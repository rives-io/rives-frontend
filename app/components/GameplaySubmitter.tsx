"use client"




import { useContext, useEffect, useState, Fragment } from "react";
import { gameplayContext } from "../play/GameplayContextProvider";
import { calculateTapeId, extractTxError, formatCartridgeIdToBytes, formatRuleIdToBytes, insertTapeGif, insertTapeImage, insertTapeName } from "../utils/util";
import { BigNumber, ContractReceipt, ethers } from "ethers";
import { CartridgeInfo, VerifyPayloadProxy } from "../backend-libs/core/ifaces";
import { envClient } from "../utils/clientEnv";
import { models } from "../backend-libs/core/lib";
import { Dialog, Transition } from '@headlessui/react';
import { TwitterShareButton, TwitterIcon } from 'next-share';
import { SOCIAL_MEDIA_HASHTAGS } from "../utils/common";
import { cartridgeInfo } from '../backend-libs/core/lib';
// @ts-ignore
import GIFEncoder from "gif-encoder-2";
import ErrorModal, { ERROR_FEEDBACK } from "./ErrorModal";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import TapeCard from "./TapeCard";
import { buildBuyCardridgeUserOp, checkContract, getCartridgeOwner, getSubmitPrice, getTapeSubmissionModelFromCartridge, getUserCartridgeBondInfo, publicClient, TAPE_SUBMIT_MODEL, worldAbi } from "../utils/assets";
import { toFunctionSelector } from "viem";
//import { sendEvent } from "../utils/googleAnalytics";
import { sendGAEvent } from '@next/third-parties/google'
import {useSmartWallets} from '@privy-io/react-auth/smart-wallets';
import { encodeFunctionData } from 'viem';
import { UserOperationCall } from "viem/account-abstraction";

enum MODAL_STATE {
    NOT_PREPARED,
    SUBMIT,
    SUBMITTING,
    SUBMITTED
}

function generateGif(frames: string[], width:number, height:number): Promise<string> {

    const encoder = new GIFEncoder(width, height, 'octree', true);
    encoder.setDelay(200);
    encoder.start();
    
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    let idx = 0;
    const addFrames = new Array<Promise<void>>();
    
    for (const frame of frames) {
        
        const p: Promise<void> = new Promise(resolveLoad => {
            const img = document.createElement("img");
            img.width = width;
            img.height = height;
            img.onload = () => {
                ctx?.drawImage(img,0,0,img.width,img.height);
                encoder.addFrame(ctx);
                resolveLoad();
            };
            img.src = frame;
        })
        addFrames.push(p);
        idx++;
    }
    return Promise.all(addFrames).then(() => {
        encoder.finish();
        const buffer = encoder.out.getData();
        if (buffer) {
            var binary = '';
            var len = buffer.byteLength;
            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode( buffer[ i ] );
            }
            return window.btoa( binary );
        }
        return "";
    });
    
}



function GameplaySubmitter() {
    const {player, gameplay, getGifParameters, clearGifFrames} = useContext(gameplayContext);
    const {user, ready} = usePrivy();
    const {client} = useSmartWallets();
    const {wallets} = useWallets();
    
    const tapeId = gameplay? calculateTapeId(gameplay.rule_id,gameplay.log):"";
    const [tapeTitle, setTapeTitle] = useState("");
    const [tapeURL, setTapeURL] = useState("");
    const [gifImg, setGifImg] = useState("");
    const [img, setImg] = useState("");

    // submission details
    const [preSubmissionTransactions, setPreSubmissionTransaction] = useState<Array<UserOperationCall>>([]);
    const [submitBtnText, setSubmissionMsg] = useState("Submit");
    const [nativeTokenFee, setNativeTokenFee] = useState<bigint|undefined>(undefined);

    const [cartridge, setCartridge] = useState<CartridgeInfo>();

    // modal state variables
    const [modalState, setModalState] = useState({isOpen: false, state: MODAL_STATE.NOT_PREPARED});
    const [errorFeedback, setErrorFeedback] = useState<ERROR_FEEDBACK>();

    function closeModal() {
        setModalState({...modalState, isOpen: false})
    }
  
    function openModal() {
        setModalState({...modalState, isOpen: true})
    }

    function onTapeTitleChange(e: React.FormEvent<HTMLInputElement>) {
        setTapeTitle(e.currentTarget.value);
    }


    useEffect(() => {
        // show warning message if user is not connected
        if (ready && !user) {
            const error:ERROR_FEEDBACK = {
                severity: "alert",
                message: "You need to be connect for your gameplay to be saved!",
                dismissible: true,
                dissmissFunction: () => setErrorFeedback(undefined)
            };
            setErrorFeedback(error);
        } else if (player.length > 0 && (wallets[0].address.toLowerCase() != player)) {
            const error:ERROR_FEEDBACK = {
                severity: "warning",
                message: `You need to send the gameplay using the same account used to play (${player.slice(0,6)}...${player.slice(player.length-4)})!`,
                dismissible: false
            };
            setErrorFeedback(error);
        } else {
            setErrorFeedback(undefined);

        }
    }, [user])

    useEffect(() => {
        if (!gameplay) {
            setModalState({isOpen: false, state: MODAL_STATE.NOT_PREPARED});
            return;
        }
        setupSubmission();
    }, [gameplay])

    async function setupSubmission() {
        if (ready && !user) {
            return;
        }

        if (!gameplay) {
            return;
        }

        const promises = [
            cartridgeInfo(
                {id: gameplay.cartridge_id},
                {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL}
            ),
            prepareGif()
        ]

        setModalState({isOpen: true, state: MODAL_STATE.NOT_PREPARED});
        const model = await getTapeSubmissionModelFromCartridge(gameplay.cartridge_id);

        if (model[0] == TAPE_SUBMIT_MODEL.FREE) {
            setModalState({isOpen: true, state: MODAL_STATE.SUBMIT});

        } else if (model[0] == TAPE_SUBMIT_MODEL.OWNERSHIP) {
            await setupOwnershipModelSubmission(gameplay.cartridge_id);
        } else if (model[0] == TAPE_SUBMIT_MODEL.FEE) { 
            await setupFeeModelSubmission(model[1], gameplay.cartridge_id);
        }

        let cartridgeInfoPromiseRes:CartridgeInfo;
        let _:any;
        [cartridgeInfoPromiseRes, _] = await Promise.all(promises);
        
        setCartridge(cartridgeInfoPromiseRes);
        setModalState({isOpen: true, state: MODAL_STATE.SUBMIT});
    }

    async function setupOwnershipModelSubmission(cartridge_id:string) {
        const bond = await getUserCartridgeBondInfo(user!.smartWallet!.address.toLowerCase(), cartridge_id);
        if (!bond) {
            console.log("No bond.");
            return;
        }
        
        if (bond.amountOwned?.gt(0)) {
            setModalState({isOpen: true, state: MODAL_STATE.SUBMIT});
            setSubmissionMsg("Submit");
        } else {
            if (!bond.buyPrice) {
                console.log("No bond.buyPrice.");
                return;
            }
           
            const userOps = await buildBuyCardridgeUserOp(
                cartridge_id, 
                user!.smartWallet!.address, 
                bond.buyPrice.toBigInt(),
                {amount: 1, erc20_address: bond.currencyToken}
            );

            // update states (submit button text and userOps)
            if (bond.buyPrice.eq(0)) {
                setSubmissionMsg(`Collect (- ${bond.currencySymbol}) and Submit`);
            } else {
                const collect = `Collect (${parseFloat(
                ethers.utils.formatUnits(bond.buyPrice, bond.currencyDecimals))
                .toLocaleString("en", {minimumFractionDigits: 6,})} ${bond.currencySymbol})`;

                setSubmissionMsg(`${collect} and Submit`);
            }
            setPreSubmissionTransaction(userOps);
        }
    }

    async function setupFeeModelSubmission(feeModelConfig:string, cartridge_id:string) {
        let userOps:Array<UserOperationCall> = [];
        const priceInfo = await getSubmitPrice(feeModelConfig);

        if (priceInfo) {
            if (!priceInfo.token) {
                // native token fee
                setNativeTokenFee(priceInfo.value);
            } else {
                // TO DO: ERC20 token fee
                const owner = await getCartridgeOwner(formatCartridgeIdToBytes(cartridge_id).slice(2));
                if (user?.smartWallet?.address.toLowerCase() != (owner?.toLowerCase())) {
                    if (! await checkContract(`0x${priceInfo.token.slice(2)}`)) {
                        alert("No token contract.");
                        return;
                    }
                    //await checkAndSetupErc20Allowance(`0x${currency.token.slice(2)}`,wallet,`0x${envClient.TAPE_FEE_SUBMISSION_MODEL.slice(2)}`, price.toBigInt());
                }
            }

            // update states (submit button text and userOps)
            if (priceInfo.value == BigInt(0)) {
                setSubmissionMsg(`Submit (0 ${priceInfo.symbol})`);
            } else {
                setSubmissionMsg(`Submit (${parseFloat(
                ethers.utils.formatUnits(priceInfo.value, priceInfo.decimals))
                .toLocaleString("en", {minimumFractionDigits: 6,})} ${priceInfo.symbol})`);
            }
            setPreSubmissionTransaction(userOps);
        }
    }

    async function prepareGif() {
        try {
            const gifParameters = getGifParameters();
            setImg(gifParameters.frames[0].split(',')[1]);
            if (gifParameters) {
                const gif = await generateGif(gifParameters.frames, gifParameters.width, gifParameters.height);
                setGifImg(gif);
            }
        } catch (error) {
            console.log("Error getting gif parameters", error)
        }
        
        //setModalState({isOpen: true, state: MODAL_STATE.SUBMIT});
    }

    async function submitLog() {
        if (!gameplay){
            alert("No gameplay data.");
            return;
        }
        if (ready && !user) return;
        if (!client) return;

        if (!models['VerifyPayloadProxy']) return;
        const exporter = models['VerifyPayloadProxy'].exporter;
        if (!exporter) return;
        const abiTypes = models['VerifyPayloadProxy'].abiTypes;


        const inputData: VerifyPayloadProxy = {
            rule_id: formatRuleIdToBytes(gameplay.rule_id),
            outcard_hash: '0x' + gameplay.outcard.hash,
            tape: ethers.utils.hexlify(gameplay.log),
            claimed_score: gameplay.score || 0,
            tapes:gameplay.tapes||[],
            in_card:gameplay.in_card ? ethers.utils.hexlify(gameplay.in_card):'0x'
        };

        const functionPayload = exporter(inputData);

        const selector = toFunctionSelector(`core.register_external_verification(${abiTypes.join(',')})`);

        const payload = selector + functionPayload.replace('0x','');

        // submit the gameplay
        try {
            setModalState({...modalState, state: MODAL_STATE.SUBMITTING});
        
            const gameplaySubmissionUserOp:UserOperationCall = {
                to: envClient.WORLD_ADDRESS as `0x${string}`,
                data: encodeFunctionData({
                    abi: worldAbi,
                    functionName: 'addInput',
                    args: [envClient.DAPP_ADDR, payload],
                }),
                value: nativeTokenFee
            }

            const txHash = await client.sendTransaction({
                account: client.account,
                // maxPriorityFeePerGas: BigInt(100000000),
                // maxFeePerGas: BigInt(100000000),
                // verificationGasLimit: BigInt(6000000),
                calls: [...preSubmissionTransactions, gameplaySubmissionUserOp]               
            });

            await publicClient.waitForTransactionReceipt( 
                { hash: txHash }
            );
            setModalState({isOpen: true, state: MODAL_STATE.SUBMITTED});

            sendGAEvent('event', 'Gameplay', { event_category: "Transaction", event_label: tapeId });

        } catch (error) {
            console.log(error)
            setModalState({...modalState, state: MODAL_STATE.SUBMIT});
            let errorMsg = (error as Error).message;
            if (errorMsg.toLowerCase().indexOf("user rejected") > -1) errorMsg = "User rejected tx";
            else if (errorMsg.toLowerCase().indexOf("10201e38") > -1) errorMsg = "You must own cartridge to send tapes";
            else if (errorMsg.toLowerCase().indexOf("ae37392") > -1) errorMsg = "You must own all used tapes";
            setErrorFeedback({message:errorMsg, severity: "error", dismissible: true, dissmissFunction: () => setErrorFeedback(undefined)});
            return;
        }

        //const gameplay_id = calculateTapeId(gameplay.log);
        try {
            if (img && img.length > 0) {
                await insertTapeImage(tapeId, img);
            }
            if (gifImg && gifImg.length > 0) {
                await insertTapeGif(tapeId, gifImg);
            }
            if (tapeTitle.length > 0) {
                await insertTapeName(tapeId, tapeTitle);
            }
        } catch (error) {
            console.log(error)
            let errorMsg = (error as Error).message;
            if (errorMsg.toLowerCase().indexOf("failed to fetch") > -1) errorMsg = "Error storing gif";
            setErrorFeedback({message:errorMsg, severity: "error", dismissible: true, dissmissFunction: () => setErrorFeedback(undefined)});
        }
        if (typeof window !== "undefined") {
            setTapeURL(`${window.location.origin}/tapes/${tapeId}`);
        }
        
        clearGifFrames();
    }


    function submitModalBody() {
        let modalBodyContent:JSX.Element;

        if (modalState.state == MODAL_STATE.NOT_PREPARED) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 pixelated-font">
                        Preparing your gameplay
                    </Dialog.Title>
        
                    <div className="p-6 flex justify-center mt-4">
                        <div className='w-12 h-12 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
                    </div>

                </>
            )
        } else if (modalState.state == MODAL_STATE.SUBMIT) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-gray-900 pixelated-font">
                        Submit your Gameplay
                    </Dialog.Title>

                    <div className="mt-4 flex space-x-2">
                        <label className="pixelated-font">Title: </label>
                        <input onChange={onTapeTitleChange} type="text" maxLength={20} className="pixelated-font p-1 text-black" placeholder="Awesome Tape" value={tapeTitle} />
                    </div>

                    <div className="mt-4 text-center">
                        <TapeCard deactivateLink={true} 
                        tapeInput={{title: tapeTitle, tapeId: tapeId, gif: gifImg, gifImage: img, address: player, twitterInfo: user?.twitter}}
                         />
                    </div>
    
                    <div className="flex pb-2 mt-4">
                        <button
                        className={`dialog-btn zoom-btn bg-red-400 text-black`}
                        type="button"
                        onClick={closeModal}
                        >
                            Cancel
                        </button>

                        <button
                        className={`dialog-btn zoom-btn bg-emerald-400 text-black`}
                        type="button"
                        onClick={submitLog}
                        >
                            {submitBtnText}
                        </button>
                    </div>
                </>
            )
        } else if (modalState.state == MODAL_STATE.SUBMITTING) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 pixelated-font">
                        Submitting Gameplay
                    </Dialog.Title>
        
                    <div className="p-6 flex justify-center mt-4">
                        <div className='w-12 h-12 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
                    </div>

                </>
            )
        } else {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 pixelated-font">
                        Gameplay Submitted!
                    </Dialog.Title>

                    <div className="mt-4 text-center">
                        {
                            !gameplay?
                                <></>
                            :
                                <TapeCard tapeInput={{title: tapeTitle, tapeId: tapeId, gif: gifImg, gifImage: img, address: player, twitterInfo: user?.twitter}} />
                        }
                    </div>

                    <div className="mt-4 grid gap-2">
                        <TwitterShareButton
                        url={tapeURL}
                        title={
                            cartridge?.id == gameplay?.cartridge_id?
                                `Check out my ${cartridge?.name} tape on @rives_io, the onchain fantasy console`
                            :
                                "Check out my tape on @rives_io, the onchain fantasy console"
                        }
                        hashtags={SOCIAL_MEDIA_HASHTAGS}
                        >
                            <div className="p-3 zoom-btn bg-[#eeeeee] text-[black] flex space-x-2 items-center">
                            {/* <button className="p-3 bg-[#eeeeee] text-[black] border border-[#eeeeee] hover:bg-transparent hover:text-[#eeeeee] flex space-x-2 items-center"> */}
                                <span>Share on</span> <TwitterIcon size={32} round />
                            </div>
                            
                        </TwitterShareButton>

                        <button className="dialog-btn zoom-btn bg-emerald-400 text-black"
                        onClick={closeModal}
                        >
                            Done
                        </button>
                    </div>
                </>
            )
        }

        return (
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-gray-500 p-4 shadow-xl transition-all flex flex-col items-center">
                {modalBodyContent}
            </Dialog.Panel>
        )
    }

    if (errorFeedback) {
        return <ErrorModal error={errorFeedback} />;
    }


    return (
        <>    
            <Transition appear show={modalState.isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/25" />
                    </Transition.Child>
            
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                {submitModalBody()}
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            {
                modalState.state != MODAL_STATE.NOT_PREPARED?  <>
                    <button className="zoom-btn dialog-btn fixed text-[10px] bg-rives-purple shadow right-5 bottom-40 z-20" onClick={() => {openModal()}}>
                        Open Submit
                    </button>
                    </>
                : 
                    <></> 
            }
        </>
    )
}

export default GameplaySubmitter;
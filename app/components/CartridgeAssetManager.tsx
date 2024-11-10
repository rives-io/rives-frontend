"use client"


import { extractTxError, formatCartridgeIdToBytes, getChain } from "../utils/util";
import { createPublicClient, erc20Abi, formatUnits, getContract, GetContractReturnType, http, PublicClient, WalletClient } from "viem";

import { envClient } from "../utils/clientEnv";
import { VerificationOutput, getOutputs, CartridgeEvent } from "../backend-libs/core/lib";
import { CartridgeInfo as Cartridge } from '../backend-libs/core/ifaces';


import cartridgeAbiFile from "@/app/contracts/Cartridge.json"
import React, { Fragment, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import ErrorModal, { ERROR_FEEDBACK } from "./ErrorModal";
import { activateCartridge, activateCartridgeSalesFree, activateFixedCartridgeSales, buildBuyCardridgeUserOp, buildSellCardridgeUserOp, buyCartridge, checkCartridgeContract, getSubmitPrice, getTapeSubmissionModel, getTapeSubmissionModelFromAddress, sellCartridge, TAPE_SUBMIT_MODEL, validateCartridge, ZERO_ADDRESS } from "../utils/assets";
import { Dialog, Transition } from "@headlessui/react";
import { Input } from '@mui/base/Input';
import CartridgeCard from "./CartridgeCard";
import Link from "next/link";
import CartridgeModelSetup from "./CartridgeModelSetup";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";

const cartridgeAbi = cartridgeAbiFile;
const chain = getChain(envClient.NETWORK_CHAIN_ID);
const publicClient = createPublicClient({
    chain: chain,
    transport: http(),
});

enum MODAL_STATE {
    NOT_PREPARED,
    SETUP,
    BUY,
    SELL,
    VALIDATE,
    SUBMITTING,
    SUBMITTED_BUY,
    SUBMITTED_SELL,
}

const getCartridgeOutput = async (cartridgeId:string):Promise<CartridgeEvent|undefined> => {
    const out:Array<VerificationOutput> = (await getOutputs(
        {
            tags: ['cartridge_inserted',cartridgeId],
            type: 'notice',
            page: 1,
            page_size: 1,
            order_by: "timestamp",
            order_dir: "asc"
        },
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    )).data;
    if (out.length == 0) return undefined;
    return out[0];
}







function CartridgeAssetManager({cartridge, reloadStats}:{cartridge:Cartridge, reloadStats():void}) {
    const {user, ready, authenticated, connectWallet, login} = usePrivy();
    const {wallets} = useWallets();
    const {client} = useSmartWallets();

    const [cartridgeOwner, setCartridgeOwner] = useState<String>();
    const [cartridgeOutput, setCartridgeOutput] = useState<CartridgeEvent>();
    const [reload,setReload] = useState<number>(0);
    
    // cartridge Marketplace State
    const [cartridgeExists, setCartridgeExists] = useState<boolean>();
    const [validated, setValidated] = useState<boolean>();
    const [buyPrice, setBuyPrice] = useState<bigint>();
    const [soldOut,setSoldOut] = useState<boolean>(false);
    const [sellPrice, setSellPrice] = useState<bigint>();
    const [currency, setCurrency] = useState({symbol: "ETH", decimals: 18});
    const [unclaimedFees,setUnclaimedFees] = useState<bigint>();
    const [amountOwned, setAmountOwned] = useState<bigint>();

    
    // contract instance used for execute view functions (contract.read.method)
    const [cartridgeContractReading, setCartridgeContractReading] = useState<GetContractReturnType<typeof cartridgeAbi.abi, PublicClient | WalletClient>>();
    const [erc20Contract, setErc20Contract] = useState<GetContractReturnType<typeof erc20Abi, PublicClient | WalletClient>>();

    // Modal State
    const [modalState, setModalState] = useState({isOpen: false, state: MODAL_STATE.NOT_PREPARED});
    const [modalValue,setModalValue] = useState<number>();
    const [modalPreviewPrice, setModalPreviewPrice] = useState<bigint>();
    const [modalSlippage, setModalSlippage] = useState<number>(0);
    const [errorFeedback, setErrorFeedback] = useState<ERROR_FEEDBACK>();
    const [tapeSubmissionModel, setTapeSubmissionModel] = useState<[string,string]|null>();
    const [tapeSubmitPriceText, setTapeSubmitPriceText] = useState<string>();

    const cartridgeIdB32 = formatCartridgeIdToBytes(cartridge.id).slice(2);
    const userAddress = (ready && authenticated)? user?.wallet?.address.toLowerCase(): "";
    const isOwner = cartridgeOwner?.toLowerCase() == userAddress;
    const isOperator = envClient.OPERATOR_ADDR?.toLowerCase() == userAddress;


    useEffect(() => {
        if (cartridgeIdB32) {
            // getCartridgeInsetOutput(cartridgeIdB32).then((out) => setCartridgeOutput(out))
            setCartridgeOwner(cartridge.user_address);
            getCartridgeOutput(cartridge.id).then((out) => setCartridgeOutput(out))
        }
        setupTapeSubmissionModel();

    }, [])

    useEffect(() => {
        if (!cartridgeContractReading || !ready || !user) {
            setAmountOwned(undefined);
            return;
        }

        const userAddress = user.smartWallet?.address;
        if (!userAddress) {
            setAmountOwned(undefined);
            return;
        }

        cartridgeContractReading.read.balanceOf([userAddress, `0x${cartridgeIdB32}`]).then((value) => {
            setAmountOwned(value as bigint);
        })
    }, [cartridgeContractReading, user, reload])

    useEffect(() => {
        setupTapeSubmissionModel();
        if (!cartridgeContractReading) return;
        
        getCartridgeMarketInfo(cartridgeContractReading);
    }, [reload])


    async function getCartridgeMarketInfo(contract:GetContractReturnType<typeof cartridgeAbi.abi, PublicClient | WalletClient>) {
        const exists = (await contract.read.exists([`0x${cartridgeIdB32}`])) as boolean;
        setCartridgeExists(exists);

        if (!exists) return;

        // const bondInfo = await getCartridgeBondInfo(`0x${cartridgeIdB32}`, true);
        // console.log("Bond Info:", bondInfo);
        // if (!bondInfo) return;

        const bond = (await contract.read.cartridgeBonds([`0x${cartridgeIdB32}`])) as Array<any>;
        setValidated(bond[6].slice(2).length > 0);
        if (bond[0].currentSupply < bond[0].steps[bond[0].steps.length - 1].rangeMax) {
            const buyPriceData = (await contract.read.getCurrentBuyPrice([`0x${cartridgeIdB32}`, 1])) as Array<bigint>;
            setBuyPrice(buyPriceData[0]);
            setSoldOut(false);
        } else {
            setBuyPrice(undefined);
            setSoldOut(true);
        }

        const allUnclaimed = bond[0].unclaimed.mint + bond[0].unclaimed.burn + bond[0].unclaimed.consume + 
        bond[0].unclaimed.royalties + bond[0].unclaimed.undistributedRoyalties;
        setUnclaimedFees(allUnclaimed);

        if (bond[0].currentSupply > BigInt(0)) {
            const sellPriceData = await (contract.read.getCurrentSellPrice([`0x${cartridgeIdB32}`, 1])) as Array<bigint>;
            setSellPrice(sellPriceData[0]);
        } else {
            setSellPrice(undefined);
        }

        if (bond[0].currencyToken != "0x0000000000000000000000000000000000000000") {
            const chain = getChain(envClient.NETWORK_CHAIN_ID);
            const publicClient = createPublicClient({
                chain: chain,
                transport: http(),
            });

            const bytecode = await publicClient.getCode({
                address: bond[0].currencyToken as `0x${string}`
            })
            
            if (!bytecode || bytecode == '0x') {
                console.log("Couldn't get erc20 contract")
                return;
            }

            const contract = getContract({
                address: bond[0].currencyToken as `0x${string}`,
                abi: erc20Abi,
                // 1a. Insert a single client
                client: publicClient,
            });

            setErc20Contract(contract);

            contract.read.symbol().then((valueSymbol) => {
                const symbol = valueSymbol as string;
                contract.read.decimals().then((valueDecimals) => {
                    const decimals = valueDecimals as number;

                    setCurrency({symbol: symbol, decimals: decimals});
                });
            });
        }
    }

    async function setupTapeSubmissionModel() {

        const model: [string,string]|null = await getTapeSubmissionModel(cartridgeIdB32)
        setTapeSubmissionModel(model);
        if (model && model[0] != ZERO_ADDRESS) {
            if (model[0] == envClient.TAPE_OWNERSHIP_SUBMISSION_MODEL) {

                if (! await checkCartridgeContract()) {
                    return;
                }

                const contract = getContract({
                    address: envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`,
                    abi: cartridgeAbi.abi,
                    client: publicClient,
                });
                setCartridgeContractReading(contract);

                getCartridgeMarketInfo(contract);
            } else if (model && model[0] == envClient.TAPE_FEE_SUBMISSION_MODEL) {
                const submitPrice = await getSubmitPrice(model[1]);
                let priceText:string = "";
                if (submitPrice) {
                    priceText = `${parseFloat(
                        formatUnits(submitPrice.value, submitPrice.decimals))
                        .toLocaleString("en", {minimumFractionDigits: 6,})} ${submitPrice.symbol}`;
                }
                setTapeSubmitPriceText(priceText);
            }
        }
    }

    //
    // Modal Functions
    //
    function closeModal() {
        setModalState({...modalState, isOpen: false});
    }
    
    function openModal(state: MODAL_STATE) {
        setModalState({state, isOpen: true});
        changeModalInput("1", state);
    }

    function changeModalInput(value:string, state: MODAL_STATE) {
        if (!cartridgeContractReading || !value) return;
        const val = parseInt(value);
        setModalValue(val);
        if (val < 1) {
            setModalPreviewPrice(BigInt(0));
            return;
        }
        if (state == MODAL_STATE.BUY) {
            cartridgeContractReading.read.getCurrentBuyPrice([`0x${cartridgeIdB32}`, value]).then((value) => {
                const data = value as Array<bigint>
                setModalPreviewPrice(data[0]);
            });
        } else if (state == MODAL_STATE.SELL) {
            if (!amountOwned || amountOwned < val) return;
            cartridgeContractReading.read.getCurrentSellPrice([`0x${cartridgeIdB32}`, value]).then((value) => {
                const data = value as Array<bigint>
                setModalPreviewPrice(data[0]);
            });
        }
    }

    function submitModalBody() {
        let modalBodyContent:JSX.Element;

        if (modalState.state == MODAL_STATE.BUY) {
            let buyPriceText:string = buyPrice == undefined? "Collect":`Collect (${parseFloat(
                formatUnits(buyPrice, currency.decimals))
                .toLocaleString("en", {minimumFractionDigits: 6,})} ${currency.symbol})`;
            
            if (buyPrice == BigInt(0)) {
                buyPriceText = `Collect (- ${currency.symbol})`;
            }
        
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-gray-900 pixelated-font mb-6">
                        Collect Cartridge
                    </Dialog.Title>


                    <div className="text-left">
                        <CartridgeCard cartridge={cartridge} deactivateLink={true} showPriceTag={false} />
                    </div>

                    <div className="pixelated-font text-black">
                        You own: {amountOwned?.toString()}
                    </div>

                    <div className="mt-4 text-center grid grid-cols-1 gap-2">
                        {/* <span className="place-self-start">Number of Cartridges {modalPreviewPrice && currencyOwned?.lt(modalPreviewPrice) ? "(Not enough funds)" : ""}</span>
                        <Input className="text-black" aria-label="Cartridges" placeholder="Cartridges to buy" type="number" value={modalValue} onChange={(e) => changeModalInput(e.target.value,MODAL_STATE.BUY)} /> */}
                        {/* <span className="place-self-start">Slippage (%)</span>
                        <Input className="text-black" aria-label="Slippage" placeholder="Slippage Accepted" type="number" value={modalSlippage} onChange={(e) => changeModalSlippage(e.target.value)} /> */}
                    </div>
    
                    <div className="flex pb-2 mt-4 gap-2">
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
                        onClick={() => buy()}
                        disabled={modalValue == undefined || modalValue < 1}
                        >
                            {buyPriceText}
                        </button>
                    </div>
                </>
            );
        } else if (modalState.state == MODAL_STATE.SELL) {
            let sellPriceText:string = modalPreviewPrice == undefined? "Sell":`Sell (${parseFloat(
                formatUnits(modalPreviewPrice, currency.decimals))
                .toLocaleString("en", {minimumFractionDigits: 6,})} ${currency.symbol})`;
            
            if (modalPreviewPrice == BigInt(0)) {
                sellPriceText = `Sell (- ${currency.symbol})`;
            }
        
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-gray-900 pixelated-font">
                        Sell Cartridge {amountOwned ? `(amount owned: ${amountOwned?.toString()})` : ""}
                    </Dialog.Title>
                    <div className="mt-4 text-center grid grid-cols-1 gap-2">
                        <span className="place-self-start">Number of Cartridges</span>
                        <Input className="text-black" aria-label="Cartridges" placeholder="Cartridges to buy" type="number" value={modalValue} onChange={(e) => changeModalInput(e.target.value,MODAL_STATE.SELL)} />
                        {/* <span className="place-self-start">Slippage (%)</span>
                        <Input className="text-black" aria-label="Slippage" placeholder="Slippage Accepted" type="number" value={modalSlippage} onChange={(e) => changeModalSlippage(e.target.value)} /> */}
                    </div>
    
                    <div className="flex pb-2 mt-4 gap-2">
                        <button
                        className={`dialog-btn zoom-btn bg-red-400 text-black`}
                        type="button"
                        onClick={closeModal}
                        >
                            Cancel
                        </button>
                        <button
                        title={modalValue != undefined && amountOwned && amountOwned >= modalValue ? "" : "No balance"} 
                        className={`dialog-btn zoom-btn bg-emerald-400 text-black`}
                        type="button"
                        onClick={sell}
                        disabled={modalValue != undefined && (modalValue < 1 || !amountOwned || amountOwned < modalValue)}
                        >
                            {sellPriceText}
                        </button>
                    </div>
                </>
            );
        } else if(modalState.state == MODAL_STATE.SUBMITTING) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-gray-900 pixelated-font">
                        Submitting Transaction
                    </Dialog.Title>
        
                    <div className="p-6 flex justify-center mt-4">
                        <div className='w-12 h-12 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
                    </div>

                </>
            );
        } else if (modalState.state == MODAL_STATE.SUBMITTED_BUY) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-gray-900 pixelated-font mb-6">
                        {cartridge.name} was added to your collection!
                    </Dialog.Title>

                    <div className="text-left">
                        <CartridgeCard cartridge={cartridge} deactivateLink={true} showPriceTag={false} />
                    </div>

                    <div className="flex pb-2 mt-4 gap-2">
                        <button className="dialog-btn bg-red-400 text-black zoom-btn"
                        onClick={closeModal}
                        >
                            Close
                        </button>
                            
                        <Link href={`/profile/${userAddress}`} 
                        className="dialog-btn bg-emerald-400 text-black zoom-btn"
                        >
                            See Profile
                        </Link>
                    </div>                    
                </>
            );
        } else if (modalState.state == MODAL_STATE.SETUP) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-gray-900 pixelated-font">
                        Setup Tape Submisstion Model
                    </Dialog.Title>
                    <CartridgeModelSetup cartridgeId={cartridge.id} reloadFn={() => {setReload(reload+1);closeModal()}} cancelFn={closeModal} />
                </>
            );
        } else {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-gray-900 pixelated-font">
                        Transaction Submitted!
                    </Dialog.Title>

                    {/* <div className="mt-4 text-center">
                    </div> */}
                    <div className="mt-4 flex flex-col space-y-2">
                            
                        <button className="dialog-btn zoom-btn bg-emerald-400 text-black"
                        onClick={closeModal}
                        >
                            Ok
                        </button>
                    </div>
                </>
            );
        }

        return (
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-gray-500 p-4 shadow-xl transition-all flex flex-col items-center text-black">
                {modalBodyContent}
            </Dialog.Panel>
        )
    }
    

    //
    // User Actions
    //

    function userReady() {
        if (!ready) return null;

        if (!user) {
            setErrorFeedback({
                message:"Login first", 
                severity: "warning", 
                dismissible: true, 
                dissmissFunction: () => {
                    login(); 
                    setErrorFeedback(undefined)
                }
            });
            return null;
        }

        const wallet = wallets.find((wallet) => wallet.address === user!.wallet!.address);
        if (!wallet) {
            setErrorFeedback({
                message:`Connect wallet ${user!.wallet!.address}`, 
                severity: "warning", 
                dismissible: true, 
                dissmissFunction: () => {
                    connectWallet(); 
                    setErrorFeedback(undefined)
                }
            });
            return null;
        }

        return wallet;
    }

    async function buy(val?: number) {
        if (!cartridgeContractReading) return;
        
        if (ready && !user) return;
        if (!client) return;


        try {
            let amount: number;
            let slippage: bigint | undefined;
            if (val) {
                setModalState({isOpen:true, state: MODAL_STATE.SUBMITTING});
                amount = val;
                const res = (await cartridgeContractReading.read.getCurrentBuyPrice([`0x${cartridgeIdB32}`, amount])) as Array<bigint>;
                slippage = res[0];
            } else {
                setModalState({...modalState, state: MODAL_STATE.SUBMITTING});
                amount = modalValue || 1;
                slippage = modalPreviewPrice != undefined? modalPreviewPrice * BigInt(100+modalSlippage) / BigInt(100):undefined;
            }
            if (slippage == undefined) {
                setErrorFeedback({message:"Couldn't get slippage", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
                return;
            }

            //await buyCartridge(cartridge.id, wallet, amount, erc20Contract?.address);
            let userOps = await buildBuyCardridgeUserOp(
                cartridge.id, 
                user!.smartWallet!.address, 
                slippage, 
                {amount: amount, erc20_address: erc20Contract?.address}
            );

            const txHash = await client.sendTransaction({
                account: client.account,
                // maxPriorityFeePerGas: BigInt(100000000),
                // maxFeePerGas: BigInt(100000000),
                // verificationGasLimit: BigInt(6000000),
                calls: userOps               
            });

            await publicClient.waitForTransactionReceipt( 
                { hash: txHash }
            );

            
            setReload(reload+1);
            reloadStats();
            setModalState({...modalState, state: MODAL_STATE.SUBMITTED_BUY});
        } catch (error) {
            console.log(error)
            setModalState({...modalState, state: MODAL_STATE.BUY});
            let errorMsg = (error as Error).message;
            if (errorMsg.toLowerCase().indexOf("user rejected") > -1) errorMsg = "User rejected tx";
            else if (errorMsg.toLowerCase().indexOf("d7b78412") > -1) errorMsg = "Slippage error";
            else errorMsg = extractTxError(errorMsg);
            setErrorFeedback({message:errorMsg, severity: "error", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
        }
    }

    async function sell() {
        if (ready && !user) return;
        if (!client) return;

        setModalState({...modalState, state: MODAL_STATE.SUBMITTING});
        try{
            const amount = modalValue || 0;
            const slippage = modalPreviewPrice != undefined? modalPreviewPrice * BigInt(100-modalSlippage) / BigInt(100):undefined;
            if (slippage == undefined) {
                setErrorFeedback({
                    message:"Couldn't get slippage", 
                    severity: "warning", 
                    dismissible: true, 
                    dissmissFunction:()=>setErrorFeedback(undefined)
                });
                return;
            }
            
            //await sellCartridge(cartridge.id, wallet, amount, slippage);
            let userOps = await buildSellCardridgeUserOp(
                cartridge.id, 
                user!.smartWallet!.address, 
                slippage, 
                {amount: amount, erc20_address: erc20Contract?.address}
            );

            const txHash = await client.sendTransaction({
                account: client.account,
                // maxPriorityFeePerGas: BigInt(100000000),
                // maxFeePerGas: BigInt(100000000),
                // verificationGasLimit: BigInt(6000000),
                calls: userOps               
            });

            await publicClient.waitForTransactionReceipt( 
                { hash: txHash }
            );

            setReload(reload+1);
            reloadStats();
            setModalState({...modalState, state: MODAL_STATE.NOT_PREPARED});
        } catch (error) {
            console.log(error)
            setModalState({...modalState, state: MODAL_STATE.SELL});
            let errorMsg = (error as Error).message;
            if (errorMsg.toLowerCase().indexOf("user rejected") > -1) errorMsg = "User rejected tx";
            else if (errorMsg.toLowerCase().indexOf("d7b78412") > -1) errorMsg = "Slippage error";
            else errorMsg = extractTxError(errorMsg);
            setErrorFeedback({message:errorMsg, severity: "error", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
        }
    }

    async function validate() {
        const wallet = userReady();
        if (!wallet) return;

        if (!cartridgeOutput?._proof) {
            setErrorFeedback({message:"No proofs yet", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }

        setModalState({isOpen: true, state: MODAL_STATE.SUBMITTING});
        try{
            await validateCartridge(cartridge.id, wallet, cartridgeOutput._payload,cartridgeOutput._proof);

            setReload(reload+1);
            reloadStats();
        } catch (error) {
            console.log(error)
            let errorMsg = (error as Error).message;
            if (errorMsg.toLowerCase().indexOf("user rejected") > -1) errorMsg = "User rejected tx";
            else errorMsg = extractTxError(errorMsg);
            // else if (errorMsg.toLowerCase().indexOf("d7b78412") > -1) errorMsg = "Slippage error";
            setErrorFeedback({message:errorMsg, severity: "error", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
        }
        setModalState({...modalState, state: MODAL_STATE.NOT_PREPARED});
    }


    //
    // JSX
    //
    function setupModel() {
        let title = "Setup Tape Submission Model";
        let buttonText = "Setup";

        if (tapeSubmissionModel) {
            const model = getTapeSubmissionModelFromAddress(tapeSubmissionModel[0]);
            buttonText = "Change model";
            if (model == TAPE_SUBMIT_MODEL.FREE) {
                title = "Currently Free Model";
            } else if (model == TAPE_SUBMIT_MODEL.OWNERSHIP) {
                title = "Currently Ownership Model";
            } else if (model == TAPE_SUBMIT_MODEL.FEE) {
                title = "Currently Submit Fee Model";
            } else {
                buttonText = "Setup";
            }
        }
        return (
            <button
            title={title}
            className="bg-[#4e99e0] assets-btn zoom-btn"
            onClick={() => {
                openModal(MODAL_STATE.SETUP);
                }}
            >
                {buttonText}
            </button>
        )
    }

    function validateCartridgeOption() {
        let title:string;

        if (validated) {
            title = "Claimed";
        } else if (cartridgeOutput?._proof && unclaimedFees) {
            const value = parseFloat(
                    formatUnits(unclaimedFees, currency.decimals)
                )
                .toLocaleString("en", {
                    minimumFractionDigits: 6,
                });
            title = `unclaimed fees = ${value} ${currency.symbol}`;
        } else {
            title = "No proof yet"
        }

        return (
            <button
            title={title}
            className="bg-[#4e99e0] assets-btn zoom-btn"
            onClick={validate}
            disabled={validated || validated == undefined || !cartridgeOutput?._proof}
            >
                {validated ? "Proved" : "Prove Cart. Upload"}
            </button>
        )
    }

    function marketplaceOptions() {
        if (tapeSubmissionModel) {
            const model = getTapeSubmissionModelFromAddress(tapeSubmissionModel[0]);
            if (model == TAPE_SUBMIT_MODEL.OWNERSHIP && cartridgeExists) {
                let buyPriceText:string = buyPrice == undefined? "Collect":`Collect (${parseFloat(
                    formatUnits(buyPrice, currency.decimals))
                    .toLocaleString("en", {minimumFractionDigits: 6,})} ${currency.symbol})`;
                let sellPriceText:string = sellPrice == undefined? "Sell":`Sell (${parseFloat(
                    formatUnits(sellPrice, currency.decimals))
                    .toLocaleString("en", {minimumFractionDigits: 6,})} ${currency.symbol})`;
                
                if (buyPrice == BigInt(0)) {
                    buyPriceText = `Collect (- ${currency.symbol})`;
                } else if (soldOut) {
                    buyPriceText = `Sold Out`;
                }
                if (sellPrice == BigInt(0)) {
                    sellPriceText = `Sell (- ${currency.symbol})`;
                }
                return (
                    <>
                        {
                            (isOwner || isOperator)?
                                validateCartridgeOption()
                            : <></>
                        }
                        <button
                            title={amountOwned && amountOwned > 0 ? "" : "No balance"}
                            className="bg-[#e04ec3] assets-btn zoom-btn"
                            onClick={() => {
                            openModal(MODAL_STATE.SELL);
                            }}
                            disabled={sellPrice == undefined || !amountOwned}
                        >
                            {sellPriceText}
                        </button>

                        <button
                            className="bg-[#53fcd8] assets-btn zoom-btn"
                            onClick={() => {
                            openModal(MODAL_STATE.BUY);
                            }}
                            disabled={buyPrice == undefined}
                        >
                            {buyPriceText}
                        </button>
                    </>
                );
            } else if (model == TAPE_SUBMIT_MODEL.FREE) {
                return (
                    <>
                        <button
                            className="bg-[#53fcd8] assets-btn zoom-btn"
                            disabled={true}
                        >
                            Free Submission
                        </button>
                    </>
                );

            } else if (model == TAPE_SUBMIT_MODEL.FEE) {
                let priceText = '';
                if (tapeSubmitPriceText)
                    priceText = `(${tapeSubmitPriceText})`;
                return (
                    <>
                        <button
                            className="bg-[#53fcd8] assets-btn zoom-btn"
                            disabled={true}
                        >
                            Fee {priceText}
                        </button>
                    </>
                );
            }

        }
    }


    if (errorFeedback) {
        return <ErrorModal error={errorFeedback} />;
    }
    
    return (
        <>
            <Transition appear show={modalState.isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-20" onClose={closeModal}>
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

            <div className="justify-center md:justify-end flex-1 flex-wrap self-center text-black flex gap-2">
                {
                    user && wallets?.length > 0 && (isOperator ||
                    (cartridgeOutput?.cartridge_user_address?.toLowerCase() == userAddress))?
                        setupModel()
                    : <></>
                }
                {marketplaceOptions()}
            </div>
        </>
    )
}

export default CartridgeAssetManager
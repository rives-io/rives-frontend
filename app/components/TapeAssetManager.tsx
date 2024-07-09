"use client"




import { useEffect, useState, Fragment } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Contract, ContractReceipt, ethers, BigNumber, PayableOverrides } from "ethers";
import { envClient } from "../utils/clientEnv";
import { VerificationOutput, VerifyPayload, getOutputs } from "../backend-libs/core/lib";
import { Dialog, Transition } from '@headlessui/react';
import { Input } from '@mui/base/Input';
import tapeAbiFile from "@/app/contracts/Tape.json"

import ErrorModal, { ERROR_FEEDBACK } from "./ErrorModal";
import { extractTxError } from "../utils/util";

const tapeAbi: any = tapeAbiFile;

const erc20abi = [
    // Read-Only Functions
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function allowance(address owner, address spender) view returns (uint256)",

    // Authenticated Functions
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint256 amount)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

enum MODAL_STATE {
    NOT_PREPARED,
    BUY,
    SELL,
    VALIDATE,
    SUBMITTING,
    SUBMITTED
}

// interface TapeBond {
//     cartridgeOwner:     string,
//     currencyBalance:    BigNumber,
//     currencyToken:      string,
//     currentPrice:       BigNumber,
//     currentSupply:      BigNumber,
//     feeModel:           string,
//     tapeCreator:        string,
//     tapeOutputData:     string,
//     totalBurned:        BigNumber,
//     totalMinted:        BigNumber,
//     unclaimedBurnFees:        BigNumber,
//     unclaimedMintFees:        BigNumber
// }

const getTapeVerificationOutput = async (tapeId:string):Promise<VerificationOutput|undefined> => {
    const out:Array<VerificationOutput> = (await getOutputs(
        {
            tags: ["score",tapeId],
            type: 'notice'
        },
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    )).data;
    if (out.length == 0) return undefined;
    return out[0];
}

const getTapeCreator = async (tapeId:string):Promise<string> => {
    const replayLogs:Array<VerifyPayload> = (await getOutputs(
        {
            tags: ["tape",tapeId],
            type: 'input'
        },
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    )).data;
    if (replayLogs.length === 0) throw new Error(`Tape ${tapeId} not found!`);
    return replayLogs[0]._msgSender;
}

function TapeAssetManager({tape_id,onChange}:{tape_id:string,onChange():void}) {
    // state
    const {user, ready, connectWallet} = usePrivy();
    const {wallets} = useWallets();
    const [tapeContract,setTapeContract] = useState<Contract>();
    const [erc20ContractAddress,setErc20Address] = useState<string>();
    const [erc20Contract,setErc20] = useState<Contract>();
    const [signerAddress,setSignerAddress] = useState<String>();
    const [signer,setSigner] = useState<ethers.providers.JsonRpcSigner>();
    const [tapeCreator,setTapeCreator] = useState<String>();
    const [buyPrice,setBuyPrice] = useState<BigNumber>();
    const [sellPrice,setSellPrice] = useState<BigNumber>();
    const [amountOwned,setAmountOwned] = useState<BigNumber>();
    const [currencyOwned,setCurrencyOwned] = useState<BigNumber>();
    const [baseBalance,setBaseBalance] = useState<BigNumber>();
    const [modalValue,setModalValue] = useState<number>();
    const [modalPreviewPrice,setModalPreviewPrice] = useState<BigNumber>();
    const [modalSlippage,setModalSlippage] = useState<number>(0);
    const [validated,setValidated] = useState<boolean>();
    const [tapeOutput,setTapeOutput] = useState<VerificationOutput>();
    const [reload,setReload] = useState<number>(0);
    const [decimals,setDecimals] = useState<number>(6);
    const [symbol,setSymbol] = useState<string>("");
    const [tapeExists,setTapeExists] = useState<boolean>();
    const [unclaimedFees,setUnclaimedFees] = useState<BigNumber>();

    // modal state variables
    const [modalState, setModalState] = useState({isOpen: false, state: MODAL_STATE.NOT_PREPARED});
    const [errorFeedback, setErrorFeedback] = useState<ERROR_FEEDBACK>();

    // use effects
    useEffect(() => {
        if (ready && !user) {
            setTapeContract(undefined);
            setSignerAddress(undefined);
            setBaseBalance(undefined);
            return;
        }
        const wallet = wallets.find((wallet) => wallet.address === user!.wallet!.address)
        if (!wallet) {
            setTapeContract(undefined);
            setSignerAddress(undefined);
            setBaseBalance(undefined);
            return;
        }
        setSignerAddress(user!.wallet!.address.toLowerCase());
        wallet.getEthereumProvider().then((provider)=>{
            const curSigner = new ethers.providers.Web3Provider(provider, 'any').getSigner();
            setSigner(curSigner);

            curSigner.getBalance().then((data: BigNumber) => {
                setBaseBalance(data);
            });
    
            const curContract = new ethers.Contract(envClient.TAPE_CONTRACT_ADDR,tapeAbi.abi,curSigner);
            curContract.provider.getCode(curContract.address).then((code) => {
                if (code == '0x') {
                    console.log("Couldn't get tape contract")
                    return;
                }
                setTapeContract(curContract);
            });
        });
    }, [ready,user,wallets])

    useEffect(() => {
        if (tape_id) {
            getTapeVerificationOutput(tape_id).then((out) => setTapeOutput(out))
            getTapeCreator(tape_id).then((out) => setTapeCreator(out))
        }
    }, [])

    useEffect(() => {
        if (!tapeContract || !signer) {
            setBuyPrice(undefined);
            setValidated(undefined)
            setSellPrice(undefined);
            setErc20(undefined);
            setErc20Address(undefined);
            setTapeExists(undefined);
            return;
        }
        tapeContract.exists(`0x${tape_id}`).then((exists:boolean) => {
            setTapeExists(exists);
            if (exists) {
                tapeContract.getCurrentBuyPrice(`0x${tape_id}`,1).then((data:BigNumber[]) => {
                    // const {total,fees,finalPrice} = data;
                    setBuyPrice(data[0]);
                });
                tapeContract.tapeBonds(`0x${tape_id}`).then((bond:any) => {
                    setValidated(bond.tapeOutputData.slice(2).length > 0)

                    if (bond.bond.currentSupply.gt(0)) {
                        tapeContract.getCurrentSellPrice(`0x${tape_id}`,1).then((data:BigNumber[]) => {
                            setSellPrice(data[0]);
                        });

                        setErc20Address(bond.bond.currencyToken);
                        const allUnclaimed = bond.bond.unclaimed.mint.add(bond.bond.unclaimed.burn).add(bond.bond.unclaimed.consume).add(bond.bond.unclaimed.royalties).add(bond.bond.unclaimed.undistributedRoyalties)
                        setUnclaimedFees(allUnclaimed);

                        if (bond.bond.currencyToken != "0x0000000000000000000000000000000000000000") {
                            const curErc20Contract = new ethers.Contract(bond.bond.currencyToken,erc20abi,signer);
                            curErc20Contract.provider.getCode(curErc20Contract.address).then((code) => {
                                if (code == '0x') {
                                    console.log("Couldn't get erc20 contract")
                                    return;
                                }
                                setErc20(curErc20Contract);
                            });
                        } else {
                            tapeContract.currencyTokenAddress().then((data:string) => {
                                setErc20Address(data);
                                if (bond.bond.currencyToken != "0x0000000000000000000000000000000000000000") {
                                    const curErc20Contract = new ethers.Contract(data,erc20abi,signer);
                                    curErc20Contract.provider.getCode(curErc20Contract.address).then((code) => {
                                        if (code == '0x') {
                                            console.log("Couldn't get erc20 contract")
                                            return;
                                        }
                                        setErc20(curErc20Contract);
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });
        
    }, [tapeContract,signer,reload])

    useEffect(() => {
        if (!tapeContract || !signerAddress) {
            setAmountOwned(undefined);
            return;
        }
        tapeContract.balanceOf(signerAddress,`0x${tape_id}`).then((amount:BigNumber) => {
            setAmountOwned(amount);
        });
    }, [tapeContract,signerAddress,reload])

    useEffect(() => {
        if (!erc20ContractAddress || !signerAddress) {
            setCurrencyOwned(undefined);
            return;
        }
        if (erc20ContractAddress != "0x0000000000000000000000000000000000000000") {
            if (!erc20Contract) {
                setCurrencyOwned(undefined);
                return;
            }
            erc20Contract.balanceOf(signerAddress).then((amount:BigNumber) => {
                setCurrencyOwned(amount);
            });
        } else {
            setCurrencyOwned(baseBalance);
        }
    }, [erc20ContractAddress,erc20Contract,signerAddress,reload])

    useEffect(() => {
        if (!erc20ContractAddress) {
            setSymbol("");
            setDecimals(6);
            return;
        }

        if (erc20ContractAddress != "0x0000000000000000000000000000000000000000") {
            if (!erc20Contract) {
                setSymbol("");
                setDecimals(6);
                return;
            }
            erc20Contract.symbol().then((data:string) => {
                setSymbol(data);
            });
            erc20Contract.decimals().then((data:number) => {
                setDecimals(data);
            });
        } else {
            setSymbol("ETH");
            setDecimals(18);
        }
    }, [erc20ContractAddress,erc20Contract])


    // modal functions
    function closeModal() {
        setModalState({...modalState, isOpen: false});
    }
  
    function openModal(state: MODAL_STATE) {
        setModalState({state, isOpen: true});
        changeModalInput("1",state);
    }

    async function buyTape() {
        if (!signer) {
            setErrorFeedback({message:"No wallet connected", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!tapeContract) {
            setErrorFeedback({message:"No contract", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!erc20ContractAddress) {
            setErrorFeedback({message:"No erc20 contract address defined", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }

        if (erc20ContractAddress != "0x0000000000000000000000000000000000000000" && !erc20Contract) {
            setErrorFeedback({message:"No erc20 contract", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }

        setModalState({...modalState, state: MODAL_STATE.SUBMITTING});
        try{
            const amount = BigNumber.from(modalValue);
            const slippage = modalPreviewPrice?.mul(100+modalSlippage).div(100);
            if (!slippage) {
                setErrorFeedback({message:"Couldn't get slippage", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
                return;
            }
            const options: PayableOverrides = {};

            if (erc20ContractAddress != "0x0000000000000000000000000000000000000000") {
                if (!erc20Contract) {
                    setErrorFeedback({message:"No erc20 contract", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
                    return;
                }
                const allowance: BigNumber = await erc20Contract.allowance(signerAddress,tapeContract.address);
                if (allowance.lt(slippage)) {
                    const approveTx = await erc20Contract.approve(tapeContract.address,slippage.sub(allowance));
                    const approveTxReceipt = await approveTx.wait(1);
                }
            } else {
                options.value = BigNumber.from(slippage);
            }

            const tx = await tapeContract.buyTapes(`0x${tape_id}`,amount,slippage,options);
            const txReceipt = await tx.wait(1);
            setReload(reload+1);
            onChange();
            closeModal();
            setModalState({...modalState, state: MODAL_STATE.NOT_PREPARED});
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

    async function sellTape() {
        if (!signer) {
            setErrorFeedback({message:"No wallet connected", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!tapeContract) {
            setErrorFeedback({message:"No contract", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        setModalState({...modalState, state: MODAL_STATE.SUBMITTING});
        try{
            const amount = BigNumber.from(modalValue);
            const slippage = modalPreviewPrice?.mul(100-modalSlippage).div(100);
            if (!slippage) {
                setErrorFeedback({message:"Couldn't get slippage", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
                return;
            }

            const tx = await tapeContract.sellTapes(`0x${tape_id}`,amount,slippage);
            const txReceipt = await tx.wait(1);
            setReload(reload+1);
            onChange();
            closeModal();
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
        if (!signer) {
            setErrorFeedback({message:"No wallet connected", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!tapeContract) {
            setErrorFeedback({message:"No contract", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!tapeOutput?._proof) {
            setErrorFeedback({message:"No proofs yet", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        setModalState({isOpen: true, state: MODAL_STATE.SUBMITTING});
        try{
            const tx = await tapeContract.validateTape(envClient.DAPP_ADDR,`0x${tape_id}`,tapeOutput._payload,tapeOutput._proof);
            const txReceipt = await tx.wait(1);
            setReload(reload+1);
            onChange();
            closeModal();
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

    async function activate() {
        if (!signer) {
            setErrorFeedback({message:"No wallet connected", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!tapeContract) {
            setErrorFeedback({message:"No contract", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        setModalState({isOpen: true, state: MODAL_STATE.SUBMITTING});
        try{
            const tx = await tapeContract.setTapeParams(`0x${tape_id}`);
            const txReceipt = await tx.wait(1);
            setReload(reload+1);
            onChange();
            closeModal();
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

    function changeModalInput(value:string, state: MODAL_STATE) {
        if (!tapeContract || !value) return;
        const val = parseInt(value);
        setModalValue(val);
        if (val < 1) {
            setModalPreviewPrice(BigNumber.from(0));
            return;
        }
        if (state == MODAL_STATE.BUY) {
            tapeContract.getCurrentBuyPrice(`0x${tape_id}`,value).then((data:BigNumber[]) => {
                setModalPreviewPrice(data[0]);
            });
        } else if (state == MODAL_STATE.SELL) {
            if (amountOwned?.lt(val)) return;
            tapeContract.getCurrentSellPrice(`0x${tape_id}`,value).then((data:BigNumber[]) => {
                setModalPreviewPrice(data[0]);
            });
        }
    }

    function changeModalSlippage(value:string) {
        if (!value) return;
        let val = parseInt(value);
        if (val < 0) val = 0;
        setModalSlippage(val);
    }

    function submitModalBody() {
        let modalBodyContent:JSX.Element;

        if (modalState.state == MODAL_STATE.BUY) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Buy Tape
                    </Dialog.Title>
                    <div className="mt-4 text-center grid grid-cols-1 gap-2">
                        <span className="place-self-start">Number of Tapes {modalPreviewPrice && currencyOwned?.lt(modalPreviewPrice) ? "(Not enough funds)" : ""}</span>
                        <Input className="text-black" aria-label="Tapes" placeholder="Tapes to buy" type="number" value={modalValue} onChange={(e) => changeModalInput(e.target.value,MODAL_STATE.BUY)} />
                        <span className="place-self-start">Slippage (%)</span>
                        <Input className="text-black" aria-label="Slippage" placeholder="Slippage Accepted" type="number" value={modalSlippage} onChange={(e) => changeModalSlippage(e.target.value)} />
                    </div>
    
                    <div className="flex pb-2 mt-4">
                        <button
                        className={`dialog-btn bg-red-400 text-black`}
                        type="button"
                        onClick={closeModal}
                        >
                            Cancel
                        </button>
                        <button
                        className={`dialog-btn zoom-btn bg-emerald-400 text-black`}
                        type="button"
                        onClick={buyTape}
                        disabled={modalValue == undefined || modalValue < 1}
                        >
                            Buy {modalPreviewPrice ? `${parseFloat(ethers.utils.formatUnits(modalPreviewPrice,decimals)).toLocaleString("en", { minimumFractionDigits: 6 })} ${symbol}` : ""}
                        </button>
                    </div>
                </>
            )
        } else if (modalState.state == MODAL_STATE.SELL) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Sell Tape
                    </Dialog.Title>
                    <div className="mt-4 text-center grid grid-cols-1 gap-2">
                        <span className="place-self-start">Number of Tapes</span>
                        <Input className="text-black" aria-label="Tapes" placeholder="Tapes to buy" type="number" value={modalValue} onChange={(e) => changeModalInput(e.target.value,MODAL_STATE.SELL)} />
                        <span className="place-self-start">Slippage (%)</span>
                        <Input className="text-black" aria-label="Slippage" placeholder="Slippage Accepted" type="number" value={modalSlippage} onChange={(e) => changeModalSlippage(e.target.value)} />
                    </div>
    
                    <div className="flex pb-2 mt-4">
                        <button
                        className={`dialog-btn bg-red-400 text-black`}
                        type="button"
                        onClick={closeModal}
                        >
                            Cancel
                        </button>
                        <button
                        title={modalValue != undefined && amountOwned?.gte(modalValue) ? "" : "No balance"} 
                        className={`dialog-btn zoom-btn bg-emerald-400 text-black`}
                        type="button"
                        onClick={sellTape}
                        disabled={modalValue != undefined && (modalValue < 1 || amountOwned?.lt(modalValue))}
                        >
                            Sell {modalPreviewPrice ? `${parseFloat(ethers.utils.formatUnits(modalPreviewPrice,decimals)).toLocaleString("en", { minimumFractionDigits: 6 })} ${symbol}` : ""}
                        </button>
                    </div>
                </>
            )
        } else if(modalState.state == MODAL_STATE.SUBMITTING) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Submitting Transaction
                    </Dialog.Title>
        
                    <div className="p-6 flex justify-center mt-4">
                        <div className='w-12 h-12 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
                    </div>

                </>
            )
        } else {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Transaction Submitted!
                    </Dialog.Title>

                    {/* <div className="mt-4 text-center">
                    </div> */}
                    <div className="mt-4 flex flex-col space-y-2">
                            
                        <button className="dialog-btn bg-emerald-400 text-black"
                        onClick={closeModal}
                        >
                            Ok
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
            {/* <div className="grid grid-cols-3 justify-items-center"> */}
            <div className='justify-center md:justify-end flex-1 flex-wrap self-center text-black flex gap-2'>
                { tapeExists ? <>
                {tapeCreator?.toLowerCase() == signerAddress?.toLowerCase() || envClient.OPERATOR_ADDR?.toLowerCase() == signerAddress?.toLowerCase() ? 
                <button title={validated ? "Claimed" : 
                    (tapeOutput?._proof ? 
                        (unclaimedFees ? `unclaimed fees = ${parseFloat(ethers.utils.formatUnits(unclaimedFees,decimals)).toLocaleString("en", { minimumFractionDigits: 6 })} ${symbol}` : "")
                        : "No proof yet")
                    } 
                    className='bg-[#4e99e0] assets-btn zoom-btn' 
                    onClick={validate} disabled={validated || validated == undefined || !(tapeOutput?._proof)}>
                {validated ? "Claimed" : "Claim"}
                </button> : <></>}
                <button title={amountOwned?.gt(0) ? "" : "No balance"} 
                        className='bg-[#e04ec3] assets-btn zoom-btn' 
                        onClick={() => {openModal(MODAL_STATE.SELL)}} disabled={!sellPrice || !amountOwned?.gt(0) }>
                    Sell {sellPrice ? `${parseFloat(ethers.utils.formatUnits(sellPrice,decimals)).toLocaleString("en", { minimumFractionDigits: 6 })} ${symbol}` : ""}
                </button>
                <button 
                        className='bg-[#53fcd8] assets-btn zoom-btn' 
                        onClick={() => {openModal(MODAL_STATE.BUY)}} disabled={!buyPrice}>
                    Buy {buyPrice ? `${parseFloat(ethers.utils.formatUnits(buyPrice,decimals)).toLocaleString("en", { minimumFractionDigits: 6 })} ${symbol}` : ""} 
                </button>
                </> :
                <> <div></div><div></div>
                {envClient.OPERATOR_ADDR?.toLowerCase() == signerAddress?.toLowerCase() ? 
                    <button title={"Activate"} 
                            className='bg-[#4e99e0] assets-btn zoom-btn' 
                            onClick={activate} disabled={tapeExists}>
                        Activate
                    </button>
                : 
                    <></>
                }
                </>
                }
            </div>
        </>
    )
}

export default TapeAssetManager;
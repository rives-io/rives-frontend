"use client"




import { useEffect, useState, Fragment } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Contract, ContractReceipt, ethers, BigNumber, PayableOverrides } from "ethers";
import { envClient } from "../utils/clientEnv";
import { VerificationOutput, VerifyPayload, cartridgeInfo, getOutputs, CartridgeInfo } from "../backend-libs/core/lib";
import { Dialog, Transition } from '@headlessui/react';
import { Input } from '@mui/base/Input';
import cartridgeAbiFile from "@/app/contracts/Cartridge.json"

import ErrorModal, { ERROR_FEEDBACK } from "./ErrorModal";

const cartridgeAbi: any = cartridgeAbiFile;

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


// const getCartridgeInsetOutput = async (cartridgeId:string):Promise<CartridgeInserted|undefined> => {
//     const out:Array<VerificationOutput> = (await getOutputs(
//         {
//             tags: ["cartridge",cartridgeId],
//             type: 'notice'
//         },
//         {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
//     )).data;
//     if (out.length == 0) return undefined;
//     return out[0];
// }

const getCartridgeOwner = async (cartridgeId:string):Promise<string> => {

    const out: CartridgeInfo = await cartridgeInfo(
        {
            id:cartridgeId
        },
        {
            decode:true,
            decodeModel:"CartridgeInfo",
            cartesiNodeUrl: envClient.CARTESI_NODE_URL
        }
    );
    
    return out.user_address;
}

function CartridgeAssetManager({cartridge_id}:{cartridge_id:string}) {
    // state
    const {user, ready, connectWallet} = usePrivy();
    const {wallets} = useWallets();
    const [cartridgeContract,setCartridgeContract] = useState<Contract>();
    const [erc20ContractAddress,setErc20Address] = useState<string>();
    const [erc20Contract,setErc20] = useState<Contract>();
    const [signerAddress,setSignerAddress] = useState<String>();
    const [signer,setSigner] = useState<ethers.providers.JsonRpcSigner>();
    const [cartridgeOwner,setCartridgeOwner] = useState<String>();
    const [buyPrice,setBuyPrice] = useState<BigNumber>();
    const [sellPrice,setSellPrice] = useState<BigNumber>();
    const [amountOwned,setAmountOwned] = useState<BigNumber>();
    const [currencyOwned,setCurrencyOwned] = useState<BigNumber>();
    const [baseBalance,setBaseBalance] = useState<BigNumber>();
    const [modalValue,setModalValue] = useState<number>();
    const [modalPreviewPrice,setModalPreviewPrice] = useState<BigNumber>();
    const [modalSlippage,setModalSlippage] = useState<number>(0);
    const [validated,setValidated] = useState<boolean>();
    const [cartridgeOutput,setCartridgeOutput] = useState<VerificationOutput>();
    const [reload,setReload] = useState<number>(0);
    const [decimals,setDecimals] = useState<number>(6);
    const [symbol,setSymbol] = useState<string>("");
    const [cartridgeExists,setCartridgeExists] = useState<boolean>();

    // modal state variables
    const [modalState, setModalState] = useState({isOpen: false, state: MODAL_STATE.NOT_PREPARED});
    const [errorFeedback, setErrorFeedback] = useState<ERROR_FEEDBACK>();

    // use effects
    useEffect(() => {
        if (ready && !user) {
            setCartridgeContract(undefined);
            setSignerAddress(undefined);
            setBaseBalance(undefined);
            return;
        }
        const wallet = wallets.find((wallet) => wallet.address === user!.wallet!.address)
        if (!wallet) {
            setCartridgeContract(undefined);
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
    
            const curContract = new ethers.Contract(envClient.CARTRIDGE_CONTRACT_ADDR,cartridgeAbi.abi,curSigner);
            curContract.provider.getCode(curContract.address).then((code) => {
                if (code == '0x') {
                    console.log("Couldn't get cartridge contract")
                    return;
                }
                setCartridgeContract(curContract);
            });
        });
    }, [ready,user,wallets])

    useEffect(() => {
        if (cartridge_id) {
            // getCartridgeInsetOutput(cartridge_id).then((out) => setCartridgeOutput(out))
            getCartridgeOwner(cartridge_id).then((out) => setCartridgeOwner(out))
        }
    }, [])

    useEffect(() => {
        if (!cartridgeContract || !signer) {
            setBuyPrice(undefined);
            setValidated(undefined)
            setSellPrice(undefined);
            setErc20(undefined);
            setErc20Address(undefined);
            setCartridgeExists(undefined);
            return;
        }
        cartridgeContract.exists(`0x${cartridge_id}`).then((exists:boolean) => {
            setCartridgeExists(exists);
            if (exists) {
                cartridgeContract.getCurrentBuyPrice(`0x${cartridge_id}`,1).then((data:BigNumber[]) => {
                    // const {total,fees,finalPrice} = data;
                    setBuyPrice(data[0]);
                });
                cartridgeContract.cartridgeBonds(`0x${cartridge_id}`).then((bond:any) => {
                    console.log("bond",bond)
                    setValidated(bond.eventData.slice(2).length > 0)

                    if (bond.bond.currentSupply.gt(0)) {
                        cartridgeContract.getCurrentSellPrice(`0x${cartridge_id}`,1).then((data:BigNumber[]) => {
                            setSellPrice(data[0]);
                        });

                        setErc20Address(bond.bond.currencyToken);

                        if (bond.bond.currencyToken != "0x0000000000000000000000000000000000000000") {
                            const curErc20Contract = new ethers.Contract(bond.bond.currencyToken,erc20abi,signer);
                            curErc20Contract.provider.getCode(curErc20Contract.address).then((code) => {
                                if (code == '0x') {
                                    console.log("Couldn't get erc20 contract")
                                    return;
                                }
                                setErc20(curErc20Contract);
                            });
                        }
                    } else {
                        cartridgeContract.currencyTokenAddress().then((data:string) => {
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
                });
            }
        });
        
    }, [cartridgeContract,signer,reload])

    useEffect(() => {
        if (!cartridgeContract || !signerAddress) {
            setAmountOwned(undefined);
            return;
        }
        cartridgeContract.balanceOf(signerAddress,`0x${cartridge_id}`).then((amount:BigNumber) => {
            setAmountOwned(amount);
        });
    }, [cartridgeContract,signerAddress,reload])

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

    async function buyCartridge() {
        if (!signer) {
            setErrorFeedback({message:"No wallet connected", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!cartridgeContract) {
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
                const allowance: BigNumber = await erc20Contract.allowance(signerAddress,cartridgeContract.address);
                if (allowance.lt(slippage)) {
                    const approveTx = await erc20Contract.approve(cartridgeContract.address,slippage.sub(allowance));
                    const approveTxReceipt = await approveTx.wait(1);
                }
            } else {
                options.value = BigNumber.from(slippage);
            }

            const tx = await cartridgeContract.buyCartridges(`0x${cartridge_id}`,amount,slippage,options);
            const txReceipt = await tx.wait(1);
            setReload(reload+1);
            closeModal();
            setModalState({...modalState, state: MODAL_STATE.NOT_PREPARED});
        } catch (error) {
            console.log(error)
            setModalState({...modalState, state: MODAL_STATE.BUY});
            let errorMsg = (error as Error).message;
            if (errorMsg.toLowerCase().indexOf("user rejected") > -1) errorMsg = "User rejected tx";
            else if (errorMsg.toLowerCase().indexOf("d7b78412") > -1) errorMsg = "Slippage error";
            setErrorFeedback({message:errorMsg, severity: "error", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
        }
    }

    async function sellCartridge() {
        if (!signer) {
            setErrorFeedback({message:"No wallet connected", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!cartridgeContract) {
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

            const tx = await cartridgeContract.sellCartridges(`0x${cartridge_id}`,amount,slippage);
            const txReceipt = await tx.wait(1);
            setReload(reload+1);
            closeModal();
            setModalState({...modalState, state: MODAL_STATE.NOT_PREPARED});
        } catch (error) {
            console.log(error)
            setModalState({...modalState, state: MODAL_STATE.SELL});
            let errorMsg = (error as Error).message;
            if (errorMsg.toLowerCase().indexOf("user rejected") > -1) errorMsg = "User rejected tx";
            else if (errorMsg.toLowerCase().indexOf("d7b78412") > -1) errorMsg = "Slippage error";
            setErrorFeedback({message:errorMsg, severity: "error", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
        }
    }

    async function validate() {
        if (!signer) {
            setErrorFeedback({message:"No wallet connected", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!cartridgeContract) {
            setErrorFeedback({message:"No contract", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!cartridgeOutput?._proof) {
            setErrorFeedback({message:"No proofs yet", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        setModalState({isOpen: true, state: MODAL_STATE.SUBMITTING});
        try{
            const tx = await cartridgeContract.validateCartridge(envClient.DAPP_ADDR,`0x${cartridge_id}`,cartridgeOutput?._payload,cartridgeOutput?._proof);
            const txReceipt = await tx.wait(1);
            setReload(reload+1);
            closeModal();
            setModalState({...modalState, state: MODAL_STATE.NOT_PREPARED});
        } catch (error) {
            console.log(error)
            setModalState({...modalState, state: MODAL_STATE.SELL});
            let errorMsg = (error as Error).message;
            if (errorMsg.toLowerCase().indexOf("user rejected") > -1) errorMsg = "User rejected tx";
            // else if (errorMsg.toLowerCase().indexOf("d7b78412") > -1) errorMsg = "Slippage error";
            setErrorFeedback({message:errorMsg, severity: "error", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
        }
    }

    async function activate() {
        if (!signer) {
            setErrorFeedback({message:"No wallet connected", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!cartridgeContract) {
            setErrorFeedback({message:"No contract", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        setModalState({isOpen: true, state: MODAL_STATE.SUBMITTING});
        try{
            const tx = await cartridgeContract.setCartridgeParams(`0x${cartridge_id}`);
            const txReceipt = await tx.wait(1);
            setReload(reload+1);
            closeModal();
            setModalState({...modalState, state: MODAL_STATE.NOT_PREPARED});
        } catch (error) {
            console.log(error)
            setModalState({...modalState, state: MODAL_STATE.SELL});
            let errorMsg = (error as Error).message;
            if (errorMsg.toLowerCase().indexOf("user rejected") > -1) errorMsg = "User rejected tx";
            // else if (errorMsg.toLowerCase().indexOf("d7b78412") > -1) errorMsg = "Slippage error";
            setErrorFeedback({message:errorMsg, severity: "error", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
        }
    }

    function changeModalInput(value:string, state: MODAL_STATE) {
        if (!cartridgeContract || !value) return;
        const val = parseInt(value);
        setModalValue(val);
        if (val < 1) {
            setModalPreviewPrice(BigNumber.from(0));
            return;
        }
        if (state == MODAL_STATE.BUY) {
            cartridgeContract.getCurrentBuyPrice(`0x${cartridge_id}`,value).then((data:BigNumber[]) => {
                setModalPreviewPrice(data[0]);
            });
        } else if (state == MODAL_STATE.SELL) {
            if (amountOwned?.lt(val)) return;
            cartridgeContract.getCurrentSellPrice(`0x${cartridge_id}`,value).then((data:BigNumber[]) => {
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
                        Buy Cartridge
                    </Dialog.Title>
                    <div className="mt-4 text-center grid grid-cols-1 gap-2">
                        <span className="place-self-start">Number of Cartridges {modalPreviewPrice && currencyOwned?.lt(modalPreviewPrice) ? "(Not enough funds)" : ""}</span>
                        <Input className="text-black" aria-label="Cartridges" placeholder="Cartridges to buy" type="number" value={modalValue} onChange={(e) => changeModalInput(e.target.value,MODAL_STATE.BUY)} />
                        <span className="place-self-start">Slippage (%)</span>
                        <Input className="text-black" aria-label="Slippage" placeholder="Slippage Accepted" type="number" value={modalSlippage} onChange={(e) => changeModalSlippage(e.target.value)} />
                    </div>
    
                    <div className="flex pb-2 mt-4">
                        <button
                        className={`bg-red-500 text-white font-bold uppercase text-sm px-6 py-2 border border-red-500 hover:text-red-500 hover:bg-transparent`}
                        type="button"
                        onClick={closeModal}
                        >
                            Cancel
                        </button>
                        <button
                        className={`bg-emerald-500 text-white font-bold uppercase text-sm px-6 py-2 ml-1 border border-emerald-500 hover:text-emerald-500 hover:bg-transparent`}
                        type="button"
                        onClick={buyCartridge}
                        disabled={modalValue == undefined || modalValue < 1}
                        >
                            Buy {modalPreviewPrice ? `${ethers.utils.formatUnits(modalPreviewPrice,decimals)} ${symbol}` : ""}
                        </button>
                    </div>
                </>
            )
        } else if (modalState.state == MODAL_STATE.SELL) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Sell Cartridge
                    </Dialog.Title>
                    <div className="mt-4 text-center grid grid-cols-1 gap-2">
                        <span className="place-self-start">Number of Cartridges {modalValue && amountOwned?.lt(modalValue) ? "(Not enough cartridges owned)" : ""}</span>
                        <Input className="text-black" aria-label="Cartridges" placeholder="Cartridges to buy" type="number" value={modalValue} onChange={(e) => changeModalInput(e.target.value,MODAL_STATE.SELL)} />
                        <span className="place-self-start">Slippage (%)</span>
                        <Input className="text-black" aria-label="Slippage" placeholder="Slippage Accepted" type="number" value={modalSlippage} onChange={(e) => changeModalSlippage(e.target.value)} />
                    </div>
    
                    <div className="flex pb-2 mt-4">
                        <button
                        className={`bg-red-500 text-white font-bold uppercase text-sm px-6 py-2 border border-red-500 hover:text-red-500 hover:bg-transparent`}
                        type="button"
                        onClick={closeModal}
                        >
                            Cancel
                        </button>
                        <button
                        className={`bg-emerald-500 text-white font-bold uppercase text-sm px-6 py-2 ml-1 border border-emerald-500 hover:text-emerald-500 hover:bg-transparent`}
                        type="button"
                        onClick={sellCartridge}
                        disabled={modalValue != undefined && amountOwned?.lt(modalValue)}
                        >
                            Sell {modalPreviewPrice ? `${ethers.utils.formatUnits(modalPreviewPrice,decimals)} ${symbol}` : ""}
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
                            
                        <button className="bg-emerald-500 text-white p-3 border border-emerald-500 hover:text-emerald-500 hover:bg-transparent"
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
            <div className='justify-center md:justify-end flex-1 self-center text-black flex gap-2'>
                { cartridgeExists ? <>
                {cartridgeOwner?.toLowerCase() == signerAddress?.toLowerCase() ? 
                <button title={validated ? "Claimed" : cartridgeOutput?._proof ? "" : "No proof yet"} 
                    className='bg-[#4e99e0] p-2 text-center font-bold w-48 h-10 hover:scale-105' 
                    onClick={validate} disabled={validated || validated == undefined || !(cartridgeOutput?._proof)}>
                {validated ? "Claimed" : "Claim"} {cartridgeOutput?._proof ? "" : "(No proof)"}
                </button> : <></>}
                <button title={amountOwned?.gt(0) ? "" : "No balance"} 
                        className='bg-[#e04ec3] p-2 text-center font-bold w-48 h-10 hover:scale-105' 
                        onClick={() => {openModal(MODAL_STATE.SELL)}} disabled={!sellPrice || !amountOwned?.gt(0) }>
                    Sell {sellPrice ? `${ethers.utils.formatUnits(sellPrice,decimals)} ${symbol}` : ""} {amountOwned?.gt(0) ? "" : "(No balance)"}
                </button>
                <button 
                        className='bg-[#53fcd8] p-2 text-center font-bold w-48 h-10 hover:scale-105' 
                        onClick={() => {openModal(MODAL_STATE.BUY)}} disabled={!buyPrice}>
                    Buy {buyPrice ? `${ethers.utils.formatUnits(buyPrice,decimals)} ${symbol}` : ""} 
                </button>
                </> :
                <> <div></div><div></div>
                {cartridgeOwner && cartridgeOwner?.toLowerCase() == signerAddress?.toLowerCase() ? 
                    <button title={"Activate"} 
                            className='bg-[#4e99e0] p-2 text-center font-bold w-48 h-10 hover:scale-105' 
                            onClick={activate} disabled={cartridgeExists}>
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

export default CartridgeAssetManager;
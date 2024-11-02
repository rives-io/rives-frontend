"use client"




import { useEffect, useState, Fragment } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Contract, ethers, BigNumber } from "ethers";
import { envClient } from "../utils/clientEnv";
import { Dialog, Transition } from '@headlessui/react';
import cartridgeAbiFile from "@/app/contracts/Cartridge.json"

import ErrorModal, { ERROR_FEEDBACK } from "./ErrorModal";
import { extractTxError } from "../utils/util";

const cartridgeAbi: any = cartridgeAbiFile;


enum MODAL_STATE {
    NOT_PREPARED,
    SUBMITTING,
    SUBMITTED
}

function CartridgeFeesManager({address}:{address:string}) {
    // state
    const {user, ready} = usePrivy();
    const {wallets} = useWallets();
    const [cartridgeContract,setCartridgeContract] = useState<Contract>();
    const [erc20ContractAddress,setErc20Address] = useState<string|undefined>("0x0000000000000000000000000000000000000000"); // TODO: allow erc20 selection
    const [erc20Contract,setErc20] = useState<Contract>();
    const [signerAddress,setSignerAddress] = useState<string>();
    const [signer,setSigner] = useState<ethers.providers.JsonRpcSigner>();
    const [reload,setReload] = useState<number>(0);
    const [decimals,setDecimals] = useState<number>(6);
    const [symbol,setSymbol] = useState<string>("");
    const [balance,setBalace] = useState<BigNumber>();

    // modal state variables
    const [modalState, setModalState] = useState({isOpen: false, state: MODAL_STATE.NOT_PREPARED});
    const [errorFeedback, setErrorFeedback] = useState<ERROR_FEEDBACK>();

    // use effects
    useEffect(() => {
        if (ready && !user) {
            setCartridgeContract(undefined);
            setSignerAddress(undefined);
            return;
        }
        const wallet = wallets.find((wallet) => wallet.address === user!.wallet!.address)
        if (!wallet) {
            setCartridgeContract(undefined);
            setSignerAddress(undefined);
            return;
        }
        if (address.toLowerCase() != user!.wallet!.address.toLowerCase()) return;
        setSignerAddress(user!.wallet!.address.toLowerCase());
        wallet.getEthereumProvider().then((provider)=>{
            const curSigner = new ethers.providers.Web3Provider(provider, 'any').getSigner();
            setSigner(curSigner);

            const curContract = new ethers.Contract(envClient.CARTRIDGE_CONTRACT_ADDR,cartridgeAbi.abi,curSigner);
            curContract.provider.getCode(curContract.address).then((code) => {
                if (!code || code == '0x') {
                    console.log("Couldn't get cartridge contract")
                    return;
                }
                setCartridgeContract(curContract);
            });
        });
    }, [ready,user,wallets])

    useEffect(() => {
        if (!cartridgeContract || !signer || !signerAddress || !erc20ContractAddress) {
            setBalace(undefined);
            return;
        }
        cartridgeContract.accounts(signerAddress, erc20ContractAddress).then((data:BigNumber) => {
            setBalace(data);
        });
        
    }, [cartridgeContract,signerAddress,erc20ContractAddress,reload])

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
  
    async function withdraw() {
        if (!signer) {
            setErrorFeedback({message:"No wallet connected", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!cartridgeContract) {
            setErrorFeedback({message:"No contract", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (!balance || balance.lte(0)) {
            setErrorFeedback({message:"No balance", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        setModalState({isOpen: true, state: MODAL_STATE.SUBMITTING});
        try{
            const tx = await cartridgeContract.withdrawBalance(erc20ContractAddress,balance);
            const txReceipt = await tx.wait(1);
            setReload(reload+1);
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

    function submitModalBody() {
        let modalBodyContent:JSX.Element;

        if(modalState.state == MODAL_STATE.SUBMITTING) {
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
            <div className='justify-center md:justify-start text-black flex'>
                { balance ? <>
                    <button title={`fees balance = ${parseFloat(ethers.utils.formatUnits(balance,decimals)).toLocaleString("en", { minimumFractionDigits: 6 })} ${symbol}`} 
                        className='bg-[#4e99e0] assets-btn zoom-btn flex-1' 
                        onClick={withdraw} disabled={!balance || balance.lte(0)}>
                    Get Cartridge Fees
                    </button>
                </> 
                : <> <div></div><div></div> </>
                }
            </div>
        </>
    )
}

export default CartridgeFeesManager;
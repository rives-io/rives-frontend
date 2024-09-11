"use client"




import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { envClient } from "../utils/clientEnv";
import { setUnlockCartridge } from "../backend-libs/core/lib";

import ErrorModal, { ERROR_FEEDBACK } from "./ErrorModal";
import { buildUrl, extractTxError, formatCartridgeIdToBytes } from "../utils/util";
import { CartridgeInfo, SetUnlockedCartridgePayloadProxy } from "../backend-libs/core/ifaces";
import Link from "next/link";

function CartridgeUnlocker({cartridge}:{cartridge:CartridgeInfo}) {
    // state
    const {user, ready } = usePrivy();
    const {wallets} = useWallets();
    
    const [signerAddress,setSignerAddress] = useState<String>();
    const [signer,setSigner] = useState<ethers.providers.JsonRpcSigner>();

    // modal state variables
    const [errorFeedback, setErrorFeedback] = useState<ERROR_FEEDBACK>();

    // use effects
    useEffect(() => {
        if (ready && !user) {
            setSignerAddress(undefined);
            return;
        }
        const wallet = wallets.find((wallet) => wallet.address === user!.wallet!.address)
        if (!wallet) {
            setSignerAddress(undefined);
            return;
        }
        setSignerAddress(user!.wallet!.address.toLowerCase());
        wallet.getEthereumProvider().then((provider)=>{
            const curSigner = new ethers.providers.Web3Provider(provider, 'any').getSigner();
            setSigner(curSigner);

        });
    }, [ready,user,wallets])

    async function unlockCartridge(unlock: boolean) {
        if (!signer) {
            setErrorFeedback({message:"No wallet connected", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        if (signerAddress?.toLowerCase() != envClient.OPERATOR_ADDR.toLowerCase()) {
            setErrorFeedback({message:"Only operator can perform this action operator", severity: "warning", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            return;
        }
        const inputData: SetUnlockedCartridgePayloadProxy = {
            unlocks: [unlock],
            ids: [formatCartridgeIdToBytes(cartridge.id)]
        };
        try{
            
            await setUnlockCartridge(signer, envClient.DAPP_ADDR, inputData, {
                sync:false, 
                cartesiNodeUrl: envClient.CARTESI_NODE_URL, 
                inputBoxAddress: envClient.WORLD_ADDRESS
            });
        } catch (error) {
            console.log(error)
            let errorMsg = (error as Error).message;
            if (errorMsg.toLowerCase().indexOf("user rejected") > -1) errorMsg = "User rejected tx";
            else errorMsg = extractTxError(errorMsg);
            // else if (errorMsg.toLowerCase().indexOf("d7b78412") > -1) errorMsg = "Slippage error";
            setErrorFeedback({message:errorMsg, severity: "error", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
        }
    }


    if (errorFeedback) {
        return <ErrorModal error={errorFeedback} />;
    }

    return (
        <>    
            {/* <div className="grid grid-cols-3 justify-items-center"> */}
            <div className='justify-center md:justify-end flex-1 flex-wrap self-center text-black flex gap-2'>
                
                { signer && cartridge.unlocked == undefined && envClient.OPERATOR_ADDR?.toLowerCase() == signerAddress?.toLowerCase() ? 
                    <>
                    <Link title={"Test"} 
                            className='bg-rives-purple assets-btn zoom-btn' 
                            href={`https://emulator.rives.io/#cartridge=${buildUrl(envClient.CARTRIDGES_URL, cartridge.id)}`}>
                        Test on Emulator
                    </Link>
                    <button title={"Reject"} 
                            className='bg-[#e04ec3] assets-btn zoom-btn' 
                            onClick={() => unlockCartridge(false)}>
                        Reject
                    </button>
                    <button title={"Unlock"} 
                            className='bg-[#53fcd8] assets-btn zoom-btn' 
                            onClick={() => unlockCartridge(true)}>
                        Unlock
                    </button>
                    </>
                : 
                    <></>
                }
            </div>
        </>
    )
}

export default CartridgeUnlocker;
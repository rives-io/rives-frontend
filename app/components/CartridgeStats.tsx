"use client"

import { useEffect, useState } from "react";

import { envClient } from "../utils/clientEnv";
import { indexerQuery } from "../backend-libs/indexer/lib";
import { IndexerOutput } from "../backend-libs/indexer/ifaces";
import { BondInfo, getCartridgeBondInfo, prettyNumberFormatter } from "../utils/assets";
import { ethers } from "ethers";
import { formatCartridgeIdToBytes } from "../utils/util";

export async function getCartridgeTapesTotal(cartridgeId:string): Promise<number> {

    const indexerOutput: IndexerOutput = await indexerQuery(
        {
            tags:["tape", cartridgeId.slice(0, 12)],
            type:"input",
            page_size:0
        },
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode:true, decodeModel:"IndexerOutput"}) as IndexerOutput;

    return indexerOutput.total;
}

function CartridgeStats({cartridge_id,reload}:{cartridge_id:string,reload:number}) {
    // state
    const [currentPrice,setCurrentPrice] = useState<string>();
    const [totalCartridges,setTotalCartridges] = useState<string>();
    const [totalTapes,setTotalTapes] = useState<number>();
    const [marketCap,setMarketCap] = useState<string>();

    useEffect(() => {
        const cartridgeIdB32 = formatCartridgeIdToBytes(cartridge_id).slice(2);
        if (cartridgeIdB32) {
            getCartridgeTapesTotal(cartridgeIdB32).then((out) => setTotalTapes(out));
            getCartridgeBondInfo(cartridgeIdB32,true).then((bond: BondInfo|null) => {
                if (bond) {
                    setCurrentPrice(`${parseFloat(ethers.utils.formatUnits(bond.currentPrice,bond.currencyDecimals)).toLocaleString("en", { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${bond.currencySymbol}`);
                    setMarketCap(`${parseFloat(ethers.utils.formatUnits(bond.marketcap,bond.currencyDecimals)).toLocaleString("en", { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${bond.currencySymbol}`);
                    setTotalCartridges(prettyNumberFormatter(bond.currentSupply.toNumber(),2));
                }
            });
        }
    }, [reload,cartridge_id])

    return (
        <div className='grid grid-cols-2 md:grid-cols-4 text-center gap-2'>
            {currentPrice ? <div className='p-4 flex flex-col bg-rives-gray'>
                <span>Current Value</span>
                <span className='mt-auto'>{currentPrice}</span>
            </div> : <></>}

            {totalCartridges ? <div className='p-4 flex flex-col bg-rives-gray'>
                <span>Cartridges Collected</span>
                <span className='mt-auto'>{totalCartridges}</span>
            </div> : <></>}

            {totalTapes != undefined ? <div className='p-4 flex flex-col bg-rives-gray'>
                <span>Tapes Created</span>
                <span className='mt-auto'>{totalTapes}</span>
            </div> : <></>}

            {marketCap ? <div className='p-4 flex flex-col bg-rives-gray'>
                <span>Marketcap</span>
                <span className='mt-auto'>{marketCap}</span>
            </div> : <></>}

            {/* <div className='p-4 flex flex-col bg-rives-gray'>
                <span>Total Owners</span>
                <span className='mt-auto'>100</span>
            </div> */}
        </div>
    )
}

export default CartridgeStats;
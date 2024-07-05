"use client"

import { useEffect, useState } from "react";

import { envClient } from "../utils/clientEnv";
import { indexerQuery } from "../backend-libs/indexer/lib";
import { IndexerOutput } from "../backend-libs/indexer/ifaces";
import { BondInfo, getCartridgeBondInfo, prettyNumberFormatter } from "../utils/assets";
import { ethers } from "ethers";

export async function getCartridgeTapesTotal(cartridgeId:string): Promise<number> {

    const indexerOutput: IndexerOutput = await indexerQuery(
        {
            tags:["tape",cartridgeId],
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
        if (cartridge_id) {
            getCartridgeTapesTotal(cartridge_id).then((out) => setTotalTapes(out));
            getCartridgeBondInfo(cartridge_id).then((bond: BondInfo|null) => {
                if (bond) {
                    setCurrentPrice(`${parseFloat(ethers.utils.formatUnits(bond.currentPrice,bond.currencyDecimals)).toLocaleString("en", { maximumFractionDigits: 5 })} ${bond.currencySymbol}`);
                    setMarketCap(`${parseFloat(ethers.utils.formatUnits(bond.marketcap,bond.currencyDecimals)).toLocaleString("en", { maximumFractionDigits: 5 })} ${bond.currencySymbol}`);
                    setTotalCartridges(prettyNumberFormatter(bond.currentSupply.toNumber(),2));
                }
            });
        }
    }, [reload])

    return (
        <div className='grid grid-cols-2 md:grid-cols-4 text-center gap-2'>
            {currentPrice ? <div className='p-4 flex flex-col bg-rives-gray'>
                <span>Current Price</span>
                <span className='mt-auto'>{currentPrice}</span>
            </div> : <></>}

            {totalCartridges ? <div className='p-4 flex flex-col bg-rives-gray'>
                <span>Total Cartridges</span>
                <span className='mt-auto'>{totalCartridges}</span>
            </div> : <></>}

            {totalTapes ? <div className='p-4 flex flex-col bg-rives-gray'>
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
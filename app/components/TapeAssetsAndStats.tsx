"use client"

import { useEffect, useState } from "react";

import { BondInfo, getTapeBondInfo, prettyNumberFormatter } from "../utils/assets";
import { ethers } from "ethers";
import TapeAssetManager from "./TapeAssetManager";

function TapeAssetsAndStats({tape_id}:{tape_id:string}) {
    // state
    const [currentPrice,setCurrentPrice] = useState<string>();
    const [totalTapes,setTotalTapes] = useState<string>();
    const [marketCap,setMarketCap] = useState<string>();
    const [reload,setReload] = useState<number>(0);

    useEffect(() => {
        if (tape_id) {
            getTapeBondInfo(tape_id).then((bond: BondInfo|null) => {
                if (bond) {
                    setCurrentPrice(`${parseFloat(ethers.utils.formatUnits(bond.currentPrice,bond.currencyDecimals)).toLocaleString("en", { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${bond.currencySymbol}`);
                    setMarketCap(`${parseFloat(ethers.utils.formatUnits(bond.marketcap,bond.currencyDecimals)).toLocaleString("en", { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${bond.currencySymbol}`);
                    setTotalTapes(prettyNumberFormatter(bond.currentSupply.toNumber(),2));
                }
            });
        }
    }, [reload,tape_id])

    return (
        <>
        <div className="flex justify-end">
            <TapeAssetManager tape_id={tape_id} onChange={()=>setReload(reload+1)}/>
        </div>
        {! (currentPrice || totalTapes || marketCap) ? <></> : <div className='grid grid-cols-2 md:grid-cols-3 text-center gap-2'>
            {currentPrice ? <div className='p-4 flex flex-col bg-rives-gray'>
                <span>Current Value</span>
                <span className='mt-auto'>{currentPrice}</span>
            </div> : <></>}

            {totalTapes ? <div className='p-4 flex flex-col bg-rives-gray'>
                <span>Total Collected</span>
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
        </div>}
        </>
    )
}

export default TapeAssetsAndStats;
import { envClient } from "./clientEnv";
import { createPublicClient, http, getContract } from 'viem'
import { BigNumber } from "ethers";

import { getChain } from "./util";
import cartridgeAbiFile from "@/app/contracts/Cartridge.json"
import tapeAbiFile from "@/app/contracts/Tape.json"
import currencyAbiFile from "@/app/contracts/CurrencyToken.json"
 
const cartridgeAbi: any = cartridgeAbiFile;
const tapeAbi: any = tapeAbiFile;
const currencyAbi: any = currencyAbiFile;


export interface BondInfo {
    currentSupply: BigNumber;
    currentPrice: BigNumber;
    marketcap: BigNumber;
    currencyDecimals: number;
    currencySymbol: string;
}

const publicClient = createPublicClient({ 
  chain: getChain(envClient.NETWORK_CHAIN_ID),
  transport: http()
})

export async function getCartridgeBondInfo(cartridgeId: string): Promise<BondInfo|null> {
    let symbol = "ETH";
    let decimals = 18;
    const bond: any[] = await publicClient.readContract({
        address: `0x${envClient.CARTRIDGE_CONTRACT_ADDR.slice(2)}`,
        abi: cartridgeAbi.abi,
        functionName: "cartridgeBonds",
        args: [`0x${cartridgeId}`]
    }) as any[];
    if (!bond || !(bond[0].steps?.length)) return null;
    if (bond[0].currencyToken != "0x0000000000000000000000000000000000000000") {
        const decimalsOut: any[] = await publicClient.readContract({
            address: `0x${bond[0].currencyToken.slice(2)}`,
            abi: currencyAbiFile.abi,
            functionName: "decimals",
            args: []
        }) as any[];
        decimals = decimalsOut[0];
        const symbolOut: any[] = await publicClient.readContract({
            address: `0x${bond[0].currencyToken.slice(2)}`,
            abi: currencyAbiFile.abi,
            functionName: "symbol",
            args: []
        }) as any[];
        symbol = symbolOut[0];
    }
    const supply = BigNumber.from(bond[0].currentSupply);
    const price = BigNumber.from(bond[0].currentPrice);
    const marketcap = supply.mul(price);
    return {
        currentPrice:price,
        currentSupply:supply,
        marketcap:marketcap,
        currencyDecimals:decimals,
        currencySymbol:symbol
    };
}


export async function getTapeBondInfo(tapeId: string): Promise<BondInfo|null> {
    let symbol = "ETH";
    let decimals = 18;
    const bond: any[] = await publicClient.readContract({
        address: `0x${envClient.TAPE_CONTRACT_ADDR.slice(2)}`,
        abi: tapeAbi.abi,
        functionName: "tapeBonds",
        args: [`0x${tapeId}`]
    }) as any[];
    if (!bond || !(bond[0].steps?.length)) return null;
    if (bond[0].currencyToken != "0x0000000000000000000000000000000000000000") {
        const decimalsOut: any[] = await publicClient.readContract({
            address: `0x${bond[0].currencyToken.slice(2)}`,
            abi: currencyAbiFile.abi,
            functionName: "decimals",
            args: []
        }) as any[];
        decimals = decimalsOut[0];
        const symbolOut: any[] = await publicClient.readContract({
            address: `0x${bond[0].currencyToken.slice(2)}`,
            abi: currencyAbiFile.abi,
            functionName: "symbol",
            args: []
        }) as any[];
        symbol = symbolOut[0];
    }
    const supply = BigNumber.from(bond[0].currentSupply);
    const price = BigNumber.from(bond[0].currentPrice);
    const marketcap = supply.mul(price);
    return {
        currentPrice:price,
        currentSupply:supply,
        marketcap:marketcap,
        currencyDecimals:decimals,
        currencySymbol:symbol
    };
}


export function prettyNumberFormatter(num: number, digits: number): string {
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "G" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" }
    ];
    const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
    const item = lookup.findLast(item => num >= item.value);
    return item ? (num / item.value).toFixed(digits).replace(regexp, "").concat(item.symbol) : "0";
}
  

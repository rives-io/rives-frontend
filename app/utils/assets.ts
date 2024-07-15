import { envClient } from "./clientEnv";
import { createPublicClient, http, getAbiItem, AbiEvent, getContract, GetLogsReturnType } from 'viem'
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
    buyPrice?: BigNumber;
    amountOwned?: BigNumber;
}

const publicClient = createPublicClient({ 
    chain: getChain(envClient.NETWORK_CHAIN_ID),
    transport: http(envClient.NETWORK_CHAIN_ID == "0xAA36A7" ? "https://ethereum-sepolia-rpc.publicnode.com" : undefined)
})

export async function getCartridgeBondInfo(cartridgeId: string, getBuyPrice = false): Promise<BondInfo|null> {
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
    let buyPrice: BigNumber|undefined = undefined;
    if (getBuyPrice){
        const buyPriceOut: any[] = await publicClient.readContract({
            address: `0x${envClient.CARTRIDGE_CONTRACT_ADDR.slice(2)}`,
            abi: cartridgeAbi.abi,
            functionName: "getCurrentBuyPrice",
            args: [`0x${cartridgeId}`,1]
        }) as any[];
        buyPrice = BigNumber.from(buyPriceOut[0]).sub(BigNumber.from(buyPriceOut[1]));
    }
    const supply = BigNumber.from(bond[0].currentSupply);
    const price = BigNumber.from(bond[0].currentPrice);
    const marketcap = supply.mul(price);
    return {
        buyPrice:buyPrice,
        currentPrice:price,
        currentSupply:supply,
        marketcap:marketcap,
        currencyDecimals:decimals,
        currencySymbol:symbol
    };
}


export async function getTapeBondInfo(tapeId: string, getBuyPrice = false): Promise<BondInfo|null> {
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
    let buyPrice: BigNumber|undefined = undefined;
    if (getBuyPrice){
        const buyPriceOut: any[] = await publicClient.readContract({
            address: `0x${envClient.TAPE_CONTRACT_ADDR.slice(2)}`,
            abi: tapeAbi.abi,
            functionName: "getCurrentBuyPrice",
            args: [`0x${tapeId}`,1]
        }) as any[];
        buyPrice = BigNumber.from(buyPriceOut[0]).sub(BigNumber.from(buyPriceOut[1]));
    }
    const supply = BigNumber.from(bond[0].currentSupply);
    const price = BigNumber.from(bond[0].currentPrice);
    const marketcap = supply.mul(price);
    return {
        buyPrice:buyPrice,
        currentPrice:price,
        currentSupply:supply,
        marketcap:marketcap,
        currencyDecimals:decimals,
        currencySymbol:symbol
    };
}

export async function getUserCartridges(user: string): Promise<string[]> {

    if (!user) return [];

    const event = getAbiItem({abi:cartridgeAbi.abi,name:"TransferSingle"}) as AbiEvent;
    let logs:any = [];
    
    let initialBlock = BigNumber.from(envClient.ASSETS_BLOCK).toBigInt();
    let lastBlock = await publicClient.getBlockNumber();
    const blockRange = BigInt(40000);

    for (let i = initialBlock; i <= lastBlock; i += blockRange) {
        const toBlock = lastBlock < i + blockRange? lastBlock: i+blockRange;
        
        logs.push(await publicClient.getLogs({ 
            address: `0x${envClient.CARTRIDGE_CONTRACT_ADDR.slice(2)}`,
            event: event,
            args: {
              to: user // `0x${user.slice(2)}`
            },
            fromBlock:i,
            toBlock: toBlock
        }));
    
    }
    
    const cartridgeIds = new Array<string>();
    for (const logArr of logs) {
        for (const log of logArr) {
            const args = log.args as any;
            const cartridgeId = BigNumber.from(args.id).toHexString()
            if (cartridgeIds.indexOf(cartridgeId) == -1) cartridgeIds.push(cartridgeId);
        }
    }
    return cartridgeIds;
}

export async function getUserCartridgesBondInfo(user: string): Promise<BondInfo[]> {
    const bondCartridges = new Array<BondInfo>();
    for (const cartridgeId of await getUserCartridges(user)) {
        const bond = await getCartridgeBondInfo(cartridgeId.slice(2));
        if (bond) {
            const balance: any[] = await publicClient.readContract({
                address: `0x${envClient.CARTRIDGE_CONTRACT_ADDR.slice(2)}`,
                abi: cartridgeAbi.abi,
                functionName: "balanceOf",
                args: [user,`0x${cartridgeId.slice(2)}`]
            }) as any[];
            if (balance) {
                bond.amountOwned = BigNumber.from(balance);
            }
            bondCartridges.push(bond);
        }
    }
    return bondCartridges;
}

export async function getUserTapes(user: string): Promise<string[]> {

    if (!user) return [];

    const event = getAbiItem({abi:tapeAbi.abi,name:"TransferSingle"}) as AbiEvent;
    let logs:Array<any> = [];
    
    let initialBlock = BigNumber.from(envClient.ASSETS_BLOCK).toBigInt();
    let lastBlock = await publicClient.getBlockNumber();
    const blockRange = BigInt(40000);

    for (let i = initialBlock; i <= lastBlock; i += blockRange) {
        const toBlock = lastBlock < i + blockRange? lastBlock: i+blockRange;

        logs.push(await publicClient.getLogs({ 
            address: `0x${envClient.TAPE_CONTRACT_ADDR.slice(2)}`,
            event: event,
            args: {
              to: user // `0x${user.slice(2)}`
            },
            fromBlock:i,
            toBlock: toBlock
        }));
    
    }
    
    const tapeIds = new Array<string>();
    for (const logArr of logs) {
        for (const log of logArr) {
            const args = log.args as any;
            const tapeId = BigNumber.from(args.id).toHexString()
            if (tapeIds.indexOf(tapeId) == -1) tapeIds.push(tapeId);
        }
    }
    return tapeIds;
}

export async function getUserTapesBondInfo(user: string): Promise<BondInfo[]> {
    const bondTapes = new Array<BondInfo>();
    for (const tapeId of await getUserTapes(user)) {
        const bond = await getTapeBondInfo(tapeId.slice(2));
        if (bond) {
            const balance: any[] = await publicClient.readContract({
                address: `0x${envClient.TAPE_CONTRACT_ADDR.slice(2)}`,
                abi: tapeAbi.abi,
                functionName: "balanceOf",
                args: [user,`0x${tapeId.slice(2)}`]
            }) as any[];
            if (balance) {
                bond.amountOwned = BigNumber.from(balance);
            }
            bondTapes.push(bond);
        }
    }
    return bondTapes;
}

export async function getTotalTapes(): Promise<BigNumber> {

    const nAssets: any[] = await publicClient.readContract({
        address: `0x${envClient.TAPE_CONTRACT_ADDR.slice(2)}`,
        abi: tapeAbi.abi,
        functionName: "totalTapes",
        args: []
    }) as any[];
    if (nAssets) {
        return BigNumber.from(nAssets);
    }
    return BigNumber.from(0);
}

export async function getTotalCartridges(): Promise<BigNumber> {

    const nAssets: any[] = await publicClient.readContract({
        address: `0x${envClient.CARTRIDGE_CONTRACT_ADDR.slice(2)}`,
        abi: cartridgeAbi.abi,
        functionName: "totalCartridges",
        args: []
    }) as any[];
    if (nAssets) {
        return BigNumber.from(nAssets);
    }
    return BigNumber.from(0);
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
  

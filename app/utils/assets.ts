import { envClient } from "./clientEnv";
import { createPublicClient, http, getAbiItem, AbiEvent, getContract, GetLogsReturnType, defineChain, createWalletClient, custom } from 'viem'
import { BigNumber } from "ethers";

import { cartridgeIdFromBytes, formatCartridgeIdToBytes, formatTapeIdToBytes, getChain, tapeIdFromBytes, verifyChain } from "./util";
import cartridgeAbiFile from "@/app/contracts/Cartridge.json"
import tapeAbiFile from "@/app/contracts/Tape.json"
import currencyAbiFile from "@/app/contracts/CurrencyToken.json"
import { ConnectedWallet } from "@privy-io/react-auth";
import { Proof } from "cartesi-client";
 
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
    currencyToken?: string;
}

// export const customChain = defineChain({
//     id: 42069,
//     name: 'Rives Devnet',
//     nativeCurrency: {
//       decimals: 18,
//       name: 'Rives Ether',
//       symbol: 'RETH',
//     },
//     rpcUrls: {
//       default: {
//         http: ['https://anvil.dev.rives.io'],
//         webSocket: ['wss://anvil.dev.rives.io'],
//       },
//     },
// });

const publicClient = createPublicClient({ 
    chain: getChain(envClient.NETWORK_CHAIN_ID),
    transport: http()
    //transport: http(envClient.NETWORK_CHAIN_ID == "0xAA36A7" ? "https://ethereum-sepolia-rpc.publicnode.com" : undefined)
})

export async function getCartridgeBondInfo(cartridgeId: string, getBuyPrice = false): Promise<BondInfo|null> {
    let symbol = "ETH";
    let decimals = 18;
    try {
        const bond: any[] = await publicClient.readContract({
            address: `0x${envClient.CARTRIDGE_CONTRACT_ADDR.slice(2)}`,
            abi: cartridgeAbi.abi,
            functionName: "cartridgeBonds",
            args: [formatCartridgeIdToBytes(cartridgeId)]
        }) as any[];
        if (!bond || !(bond[0].steps?.length)) return null;
        let currencyToken:string|undefined;
        if (bond[0].currencyToken != "0x0000000000000000000000000000000000000000") {
            currencyToken = bond[0].currencyToken as string;

            const decimalsOut: any[] = await publicClient.readContract({
                address: currencyToken as `0x${string}`,
                abi: currencyAbiFile.abi,
                functionName: "decimals",
                args: []
            }) as any[];
            decimals = decimalsOut[0];
            const symbolOut: any[] = await publicClient.readContract({
                address: currencyToken as `0x${string}`,
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
                args: [formatCartridgeIdToBytes(cartridgeId),1]
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
            currencyToken:currencyToken,
            currencyDecimals:decimals,
            currencySymbol:symbol,
        };
    } catch (e) {
        console.log("Error reading contract");
        return null;
    }
}


export async function getTapeBondInfo(tapeId: string, getBuyPrice = false): Promise<BondInfo|null> {
    let symbol = "ETH";
    let decimals = 18;
    try {
        const bond: any[] = await publicClient.readContract({
            address: `0x${envClient.TAPE_CONTRACT_ADDR.slice(2)}`,
            abi: tapeAbi.abi,
            functionName: "tapeBonds",
            args: [formatTapeIdToBytes(tapeId)]
        }) as any[];
        if (!bond || !(bond[0].steps?.length)) return null;
        if (bond[0].currencyToken != "0x0000000000000000000000000000000000000000") {
            const decimalsOut: any[] = await publicClient.readContract({
                address: `0x${bond[0].currencyToken.slice(2)}`,
                abi: currencyAbi.abi,
                functionName: "decimals",
                args: []
            }) as any[];
            decimals = decimalsOut[0];
            const symbolOut: any[] = await publicClient.readContract({
                address: `0x${bond[0].currencyToken.slice(2)}`,
                abi: currencyAbi.abi,
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
                args: [formatTapeIdToBytes(tapeId),1]
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
    } catch (e) {
        console.log("Error reading contract");
        return null;
    }
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
            if (cartridgeIds.indexOf(cartridgeId) == -1) cartridgeIds.push(cartridgeIdFromBytes(cartridgeId));
        }
    }
    return cartridgeIds;
}

export async function getUserCartridgeBondInfo(user: string, cartridgeId:string): Promise<BondInfo|null> {
    const bond = await getCartridgeBondInfo(cartridgeId, true);
    if (bond) {
        const balance: any[] = await publicClient.readContract({
            address: `0x${envClient.CARTRIDGE_CONTRACT_ADDR.slice(2)}`,
            abi: cartridgeAbi.abi,
            functionName: "balanceOf",
            args: [user,formatCartridgeIdToBytes(cartridgeId)]
        }) as any[];
        if (balance) {
            bond.amountOwned = BigNumber.from(balance);
        }
        return bond
    }
    return null;

}

export async function getUserCartridgesBondInfo(user: string): Promise<BondInfo[]> {
    const bondCartridges = new Array<BondInfo>();
    try {
        for (const cartridgeId of await getUserCartridges(user)) {
            const bond = await getUserCartridgeBondInfo(user,cartridgeId);
            if (bond) {
                bondCartridges.push(bond);
            }
        }
    } catch (e) {
        console.log("Error reading contract");
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
            if (tapeIds.indexOf(tapeId) == -1) tapeIds.push(tapeIdFromBytes(tapeId));
        }
    }
    return tapeIds;
}

export async function getUserTapesBondInfo(user: string): Promise<BondInfo[]> {
    const bondTapes = new Array<BondInfo>();
    try {
        for (const tapeId of await getUserTapes(user)) {
            const bond = await getTapeBondInfo(tapeId);
            if (bond) {
                const balance: any[] = await publicClient.readContract({
                    address: `0x${envClient.TAPE_CONTRACT_ADDR.slice(2)}`,
                    abi: tapeAbi.abi,
                    functionName: "balanceOf",
                    args: [user,formatTapeIdToBytes(tapeId)]
                }) as any[];
                if (balance) {
                    bond.amountOwned = BigNumber.from(balance);
                }
                bondTapes.push(bond);
            }
        }
    } catch (e) {
        console.log("Error reading contract");
    }
    return bondTapes;
}

export async function getTotalTapes(): Promise<BigNumber> {

    try {
        const nAssets: any[] = await publicClient.readContract({
            address: `0x${envClient.TAPE_CONTRACT_ADDR.slice(2)}`,
            abi: tapeAbi.abi,
            functionName: "totalTapes",
            args: []
        }) as any[];
        if (nAssets) {
            return BigNumber.from(nAssets);
        }
    } catch (e) {
        console.log("Error reading contract");
    }
    return BigNumber.from(0);
}

export async function getTotalCartridges(): Promise<BigNumber> {

    try {
        const nAssets: any[] = await publicClient.readContract({
            address: `0x${envClient.CARTRIDGE_CONTRACT_ADDR.slice(2)}`,
            abi: cartridgeAbi.abi,
            functionName: "totalCartridges",
            args: []
        }) as any[];
        if (nAssets) {
            return BigNumber.from(nAssets);
        }
    } catch (e) {
        console.log("Error reading contract");
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
  
export async function buyCartridge(cartridge_id:string, wallet:ConnectedWallet, amount:number|bigint, erc20TokenAddr?:string) {
    const cartridgeIdB32 = formatCartridgeIdToBytes(cartridge_id);

    await verifyChain(wallet);

    const res = (await publicClient.readContract({
        address: `0x${envClient.CARTRIDGE_CONTRACT_ADDR.slice(2)}`,
        abi: cartridgeAbi.abi,
        functionName: "getCurrentBuyPrice",
        args: [cartridgeIdB32, amount]
    })) as Array<bigint>;

    const slippage = res[0];

    const provider = await wallet.getEthereumProvider();
    const walletClient = createWalletClient({
        chain: getChain(envClient.NETWORK_CHAIN_ID),
        transport: custom(provider)
    });

    let value:bigint = BigInt(0);
    if (!erc20TokenAddr) {
        value = slippage;
    } else {
        // const allowance: BigNumber = await erc20Contract.allowance(signerAddress,cartridgeContract.address);
        // if (allowance.lt(slippage)) {
        //     const approveTx = await erc20Contract.approve(cartridgeContract.address,slippage.sub(allowance));
        //     const approveTxReceipt = await approveTx.wait(1);
        // }
    }

    const { request } = await publicClient.simulateContract({
        account: wallet.address as `0x${string}`,
        address: envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`,
        abi: cartridgeAbi.abi,
        functionName: 'buyCartridges',
        args: [cartridgeIdB32, amount, slippage],
        value: value
    });
    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt( 
        { hash: txHash }
    )
}


export async function sellCartridge(cartridge_id:string, wallet:ConnectedWallet, amount:number|bigint, slippage:number|bigint) {
    const cartridgeIdB32 = formatCartridgeIdToBytes(cartridge_id);

    await verifyChain(wallet);

    const provider = await wallet.getEthereumProvider();
    const walletClient = createWalletClient({
        chain: getChain(envClient.NETWORK_CHAIN_ID),
        transport: custom(provider)
    });

    const { request } = await publicClient.simulateContract({
        account: wallet.address as `0x${string}`,
        address: envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`,
        abi: cartridgeAbi.abi,
        functionName: 'sellCartridges',
        args: [cartridgeIdB32, amount, slippage]
    });
    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt( 
        { hash: txHash }
    );
}

export async function activateCartridgeSalesFree(cartridge_id:string, wallet:ConnectedWallet) {
    const cartridgeIdB32 = formatCartridgeIdToBytes(cartridge_id);

    await verifyChain(wallet);

    const provider = await wallet.getEthereumProvider();
    const walletClient = createWalletClient({
        chain: getChain(envClient.NETWORK_CHAIN_ID),
        transport: custom(provider)
    });

    const { request } = await publicClient.simulateContract({
        account: wallet.address as `0x${string}`,
        address: envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`,
        abi: cartridgeAbi.abi,
        functionName: 'setCartridgeParamsCustom',
        args: [cartridgeIdB32, 0, [10000,'0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'], [0,0], true]
    });
    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt( 
        { hash: txHash }
    );
}

export async function activateCartridge(cartridge_id:string, wallet:ConnectedWallet) {
    const cartridgeIdB32 = formatCartridgeIdToBytes(cartridge_id);

    await verifyChain(wallet);

    const provider = await wallet.getEthereumProvider();
    const walletClient = createWalletClient({
        chain: getChain(envClient.NETWORK_CHAIN_ID),
        transport: custom(provider)
    });

    const { request } = await publicClient.simulateContract({
        account: wallet.address as `0x${string}`,
        address: envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`,
        abi: cartridgeAbi.abi,
        functionName: 'setCartridgeParams',
        args: [cartridgeIdB32]
    });
    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt( 
        { hash: txHash }
    );
}

export async function validateCartridge(cartridge_id:string, wallet:ConnectedWallet, payload:string, proof:Proof) {
    const cartridgeIdB32 = formatCartridgeIdToBytes(cartridge_id);

    await verifyChain(wallet);

    const provider = await wallet.getEthereumProvider();
    const walletClient = createWalletClient({
        chain: getChain(envClient.NETWORK_CHAIN_ID),
        transport: custom(provider)
    });

    const { request } = await publicClient.simulateContract({
        account: wallet.address as `0x${string}`,
        address: envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`,
        abi: cartridgeAbi.abi,
        functionName: 'validateCartridge',
        args: [envClient.DAPP_ADDR, cartridgeIdB32, payload, proof]
    });
    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt( 
        { hash: txHash }
    );
}
import { envClient } from "./clientEnv";
import { createPublicClient, http, getAbiItem, AbiEvent, getContract, GetLogsReturnType, defineChain, createWalletClient, custom, parseAbi, erc20Abi, decodeAbiParameters, parseAbiParameters } from 'viem'
import { BigNumber } from "ethers";

import { cartridgeIdFromBytes, formatCartridgeIdToBytes, formatTapeIdToBytes, getChain, tapeIdFromBytes, verifyChain } from "./util";
import cartridgeAbiFile from "@/app/contracts/Cartridge.json"
import tapeAbiFile from "@/app/contracts/Tape.json"
import { ConnectedWallet } from "@privy-io/react-auth";
import { Proof } from "cartesi-client";
 
export const cartridgeAbi: any = cartridgeAbiFile;
export const tapeAbi: any = tapeAbiFile;

const humanErc20abi = [
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

const erc20abi = parseAbi(humanErc20abi);

const humanWorldAbi = [
    // Read-Only Functions
    "function getCartridgeInsertionModel() view returns ((address,bytes))",
    "function getTapeSubmissionModel(bytes32) view returns ((address,bytes))",
    "function getCartridgeOwner(bytes32) view returns (address)",
    "function getRegisteredModel(address) view returns (bool)",

    // Authenticated Functions
    "function setTapeSubmissionModel(bytes32 cartridgeId,address modelAddress, bytes config)",
    "function addInput(address _dapp, bytes payload)",
];

export const worldAbi = parseAbi(humanWorldAbi);

export const ZERO_ADDRESS = `0x${'0'.repeat(2*20)}`;

export enum TAPE_SUBMIT_MODEL {
    NOT_DEFINED,
    FREE,
    OWNERSHIP,
    FEE,
}

export interface BondStep {
    coefficient: bigint,
    rangeMax: bigint
}

export interface BondInfo {
    currentSupply: BigNumber;
    currentPrice: BigNumber;
    marketcap: BigNumber;
    currencyDecimals: number;
    currencySymbol: string;
    buyPrice?: BigNumber;
    amountOwned?: BigNumber;
    currencyToken?: string;
    steps: BondStep[];
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

export const publicClient = createPublicClient({ 
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
            const decimalsOut: number = await publicClient.readContract({
                address: `0x${bond[0].currencyToken.slice(2)}`,
                abi: erc20Abi,
                functionName: "decimals",
                args: []
            });
            decimals = decimalsOut;
            const symbolOut: string = await publicClient.readContract({
                address: `0x${bond[0].currencyToken.slice(2)}`,
                abi: erc20Abi,
                functionName: "symbol",
                args: []
            });
            symbol = symbolOut;
        }
        let buyPrice: BigNumber|undefined = undefined;
        const supply = BigNumber.from(bond[0].currentSupply);
        if (getBuyPrice && supply.lt(bond[0].steps[bond[0].steps.length-1].rangeMax)){
            const buyPriceOut: any[] = await publicClient.readContract({
                address: `0x${envClient.CARTRIDGE_CONTRACT_ADDR.slice(2)}`,
                abi: cartridgeAbi.abi,
                functionName: "getCurrentBuyPrice",
                args: [formatCartridgeIdToBytes(cartridgeId),1]
            }) as any[];
            buyPrice = BigNumber.from(buyPriceOut[0]).sub(BigNumber.from(buyPriceOut[1]));
        }
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
            steps:bond[0].steps
        };
    } catch (e) {
        console.log("Error reading cartridge contract");
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
            const decimalsOut: number = await publicClient.readContract({
                address: `0x${bond[0].currencyToken.slice(2)}`,
                abi: erc20Abi,
                functionName: "decimals",
                args: []
            });
            decimals = decimalsOut;
            const symbolOut: string = await publicClient.readContract({
                address: `0x${bond[0].currencyToken.slice(2)}`,
                abi: erc20Abi,
                functionName: "symbol",
                args: []
            });
            symbol = symbolOut;
        }
        const supply = BigNumber.from(bond[0].currentSupply);
        let buyPrice: BigNumber|undefined = undefined;
        if (getBuyPrice && supply.lt(bond[0].steps[bond[0].steps.length-1].rangeMax)){
            const buyPriceOut: any[] = await publicClient.readContract({
                address: `0x${envClient.TAPE_CONTRACT_ADDR.slice(2)}`,
                abi: tapeAbi.abi,
                functionName: "getCurrentBuyPrice",
                args: [formatTapeIdToBytes(tapeId),1]
            }) as any[];
            buyPrice = BigNumber.from(buyPriceOut[0]).sub(BigNumber.from(buyPriceOut[1]));
        }
        const price = BigNumber.from(bond[0].currentPrice);
        const marketcap = supply.mul(price);
        return {
            buyPrice:buyPrice,
            currentPrice:price,
            currentSupply:supply,
            marketcap:marketcap,
            currencyDecimals:decimals,
            currencySymbol:symbol,
            steps:bond[0].steps
        };
    } catch (e) {
        console.log("Error reading tape contract");
        return null;
    }
}

export async function getUserCartridges(user: string): Promise<string[]|null> {

    if (!user) return null;

    if (envClient.CARTRIDGE_CONTRACT_ADDR.toLowerCase() == ZERO_ADDRESS.toLowerCase())
        return null;
    
    const bytecode = await publicClient.getCode({
        address: envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`
    });
    if (!bytecode || bytecode == '0x') {
        console.log("Couldn't get cartridge contract")
        return null;
    }

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
        const cartridges = await getUserCartridges(user);
        if (cartridges) {
            for (const cartridgeId of cartridges) {
                const bond = await getUserCartridgeBondInfo(user,cartridgeId);
                if (bond) {
                    bondCartridges.push(bond);
                }
            }
        }
    } catch (e) {
        console.log("Error reading cartridge contract");
    }
    return bondCartridges;
}

export async function getUserTapes(user: string): Promise<string[]|null> {

    if (!user) return null;

    if (envClient.TAPE_CONTRACT_ADDR.toLowerCase() == ZERO_ADDRESS.toLowerCase())
        return null;
    
    const bytecode = await publicClient.getCode({
        address: envClient.TAPE_CONTRACT_ADDR as `0x${string}`
    });
    if (!bytecode || bytecode == '0x') {
        console.log("Couldn't get tape contract")
        return null;
    }


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
        const tapes = await getUserTapes(user);
        if (tapes) {
            for (const tapeId of tapes) {
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
        }
    } catch (e) {
        console.log("Error reading tape contract");
    }
    return bondTapes;
}

export async function getTotalTapes(): Promise<BigNumber|null> {

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
        console.log("Error reading tape contract");
    }
    return null;
}

export async function getTotalCartridges(): Promise<BigNumber|null> {

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
        console.log("Error reading cartridge contract");
    }
    return null;
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

export async function activateFixedCartridgeSales(cartridge_id:string,cartridgePrice:string, wallet:ConnectedWallet) {
    const cartridgeIdB32 = formatCartridgeIdToBytes(cartridge_id);

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
        args: [cartridgeIdB32, cartridgePrice, ['0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'], [0], false]
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

export async function getCartridgeOwner(cartridgeIdB32: string): Promise<string|null> {
    try {
        const model: [string] = await publicClient.readContract({
            address: `0x${envClient.WORLD_ADDRESS.slice(2)}`,
            abi: worldAbi,
            functionName: "getCartridgeOwner",
            args: [`0x${cartridgeIdB32}`]
        }) as [string];
        if (model) {
            return model[0];
        }
    } catch (e) {
        console.log("Error reading contract",e);
    }
    return null;
}
export async function getTapeSubmissionModel(cartridgeId: string): Promise<[string,string]|null> {
    try {
        const model: [string,string] = await publicClient.readContract({
            address: `0x${envClient.WORLD_ADDRESS.slice(2)}`,
            abi: worldAbi,
            functionName: "getTapeSubmissionModel",
            args: [`0x${cartridgeId}`]
        }) as [string,string];
        if (model) {
            return model;
        }
    } catch (e) {
        console.log("Error reading world contract",e);
    }
    return null;
}

export async function getSubmissionModelActive(model: TAPE_SUBMIT_MODEL): Promise<boolean> {
    try {
        const modelAddr = getTapeSubmissionModelAddress(model);
        const active = await publicClient.readContract({
            address: `0x${envClient.WORLD_ADDRESS.slice(2)}`,
            abi: worldAbi,
            functionName: "core__getRegisteredModel",
            args: [modelAddr]
        }) as boolean;
        return active;
    } catch (e) {
        console.log("Error reading world contract",e);
    }
    return false;
}

export function getTapeSubmissionModelFromAddress(modelAddr: string): TAPE_SUBMIT_MODEL {

    if (modelAddr.toLowerCase() == ZERO_ADDRESS.toLowerCase())
        return TAPE_SUBMIT_MODEL.NOT_DEFINED;

    if (modelAddr.toLowerCase() == envClient.TAPE_FREE_SUBMISSION_MODEL.toLowerCase())
        return TAPE_SUBMIT_MODEL.FREE;

    if (modelAddr.toLowerCase() == envClient.TAPE_OWNERSHIP_SUBMISSION_MODEL.toLowerCase())
        return TAPE_SUBMIT_MODEL.OWNERSHIP;

    if (modelAddr.toLowerCase() == envClient.TAPE_FEE_SUBMISSION_MODEL.toLowerCase())
        return TAPE_SUBMIT_MODEL.FEE;

    return TAPE_SUBMIT_MODEL.NOT_DEFINED;
}

export async function getTapeSubmissionModelFromCartridge(cartridgeId: string): Promise<[TAPE_SUBMIT_MODEL,string,string]> {
    const model = await getTapeSubmissionModel(formatCartridgeIdToBytes(cartridgeId).slice(2));
    return model ? [getTapeSubmissionModelFromAddress(model[0]),model[1],model[0]] : [TAPE_SUBMIT_MODEL.NOT_DEFINED,'0x',ZERO_ADDRESS];
}

export function getTapeSubmissionModelAddress(model: TAPE_SUBMIT_MODEL): string|null {

    if (model == TAPE_SUBMIT_MODEL.FREE)
        return envClient.TAPE_FREE_SUBMISSION_MODEL;

    if (model == TAPE_SUBMIT_MODEL.OWNERSHIP)
        return envClient.TAPE_OWNERSHIP_SUBMISSION_MODEL;

    if (model == TAPE_SUBMIT_MODEL.FEE)
        return envClient.TAPE_FEE_SUBMISSION_MODEL;

    return null;
}

export async function setupTapeSubmission(cartridge_id:string, modelAddress:string, config: string,  wallet:ConnectedWallet) {
    const cartridgeIdB32 = formatCartridgeIdToBytes(cartridge_id);

    await verifyChain(wallet);

    const provider = await wallet.getEthereumProvider();
    const walletClient = createWalletClient({
        chain: getChain(envClient.NETWORK_CHAIN_ID),
        transport: custom(provider)
    });

    const { request } = await publicClient.simulateContract({
        account: wallet.address as `0x${string}`,
        address: envClient.WORLD_ADDRESS as `0x${string}`,
        abi: worldAbi,
        functionName: 'setTapeSubmissionModel',
        args: [cartridgeIdB32,modelAddress,config]
    });
    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt( 
        { hash: txHash }
    );
}

export interface PriceInfo {
    token?: `0x${string}`;
    decimals: number;
    symbol: string;
    value: bigint;
}

export async function getSubmitPrice(config:string): Promise<PriceInfo|null> {
    const priceInfo: PriceInfo = {
        decimals: 0,
        symbol: "",
        value: BigInt(0)
    };
    const model = decodeAbiParameters(
        parseAbiParameters("address,uint256"),
        `0x${config.slice(2)}`
    );

    priceInfo.value = model[1];
    if (model[0] == ZERO_ADDRESS) {
        priceInfo.decimals = 18;
        priceInfo.symbol = "ETH";
    } else {
        try {
            priceInfo.token = model[0];
            const decimalsOut: number = await publicClient.readContract({
                address: priceInfo.token,
                abi: erc20Abi,
                functionName: "decimals",
                args: []
            });
            const symbolOut: string = await publicClient.readContract({
                address: priceInfo.token,
                abi: erc20Abi,
                functionName: "symbol",
                args: []
            });
            priceInfo.decimals = decimalsOut;
            priceInfo.symbol = symbolOut;
        } catch (error) {
            console.log(error)
            return null;
        }
    }
    return priceInfo;
}
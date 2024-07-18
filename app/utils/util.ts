import { envClient } from "./clientEnv";
import { anvil, base, mainnet, sepolia, polygon, polygonMumbai, Chain } from 'viem/chains';
import { isHex, fromHex } from 'viem'
import { DecodedIndexerOutput } from "../backend-libs/cartesapp/lib";
import { cartridges, getOutputs } from "../backend-libs/core/lib";
import { IndexerPayload } from "../backend-libs/indexer/ifaces";
import { encrypt } from "@/lib";
import { CartridgeInfo, CartridgesOutput, CartridgesPayload } from "../backend-libs/core/ifaces";

export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


// time in seconds
export function timeToDateUTCString(time:number) {

    const date = new Date(time*1000);
    return formatDate(date);
}

export function formatDate(date:Date) {
    const options:Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
        timeZone: "UTC",
        timeZoneName: "short"
    }
    
    const dateString = date.toLocaleDateString("en-US", options);
    let [month_day, year, time] = dateString.split(",");
    const [month, day] = month_day.split(" ");
    year = year.substring(1);

    return `${month}/${day}/${year}, ${time}`;
}

export async function getTapeGif(tape_id:string):Promise<string|null> {
    try {
        const response = await fetch(`${envClient.GIF_SERVER_URL}/gifs`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify([tape_id])
            }
        );

        if (!response.ok || response.status === 204) return null;

        const gif = await response.json();

        return gif[0];
    } catch (e) {
        console.log(`Error fetching gif: ${e}`)
        return null;
    }
}

export async function getTapesGifs(tapes:Array<string>):Promise<Array<string>> {
    if (tapes.length == 0) return [];
    
    try {
        const response = await fetch(`${envClient.GIF_SERVER_URL}/gifs`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(tapes)
            }
        );

        if (!response.ok) return [];

        const gifs = await response.json();
        return gifs;
    } catch (e) {
        console.log(`Error fetching gifs: ${e}`)
        return [];
    }
}

export async function insertTapeGif(gameplay_id:string, gifImage:string) {
    const payload = await encrypt({"gameplay_id": gameplay_id, "gif": gifImage});
    try {
        await fetch(
            `${envClient.GIF_SERVER_URL}/insert-gif`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: payload
            }
        )
    } catch (e) {
        console.log(`Error inserting gif: ${e}`)
    }
}

export async function getTapeImage(tape_id:string):Promise<string|null> {
    try {
        const response = await fetch(`${envClient.GIF_SERVER_URL}/images`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify([tape_id])
            }
        );

        if (!response.ok) return null;

        const imgs = await response.json();

        return imgs[0];
    } catch (e) {
        console.log(`Error fetching image: ${e}`)
        return null;
    }
}

export async function getTapesImages(tapes:Array<string>):Promise<Array<string>> {
    if (tapes.length == 0) return [];
    
    try {
        const response = await fetch(`${envClient.GIF_SERVER_URL}/images`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(tapes)
            }
        );

        if (!response.ok) return [];

        const imgs = await response.json();
        return imgs;
    } catch (e) {
        console.log(`Error fetching images: ${e}`)
        return [];
    }
}

export async function insertTapeImage(gameplay_id:string, gifImage:string) {
    const payload = await encrypt({"gameplay_id": gameplay_id, "image": gifImage});
    try {
        await fetch(
            `${envClient.GIF_SERVER_URL}/insert-image`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: payload
            }
        )
    } catch (e) {
        console.log(`Error inserting image: ${e}`)
    }
}


export async function getTapeName(tape_id:string):Promise<string|null> {
    try {
        const response = await fetch(`${envClient.GIF_SERVER_URL}/names`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify([tape_id])
            }
        );

        if (!response.ok) return null;

        const imgs = await response.json();

        return imgs[0];
    } catch (e) {
        console.log(`Error fetching image: ${e}`)
        return null;
    }
}


export async function insertTapeName(gameplay_id:string, name:string) {
    const payload = await encrypt({"gameplay_id": gameplay_id, "name": name});
    try {
        await fetch(
            `${envClient.GIF_SERVER_URL}/insert-name`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: payload
            }
        )
    } catch (e) {
        console.log(`Error inserting image: ${e}`)
    }
}

let chains:Record<number, Chain> = {};
chains[base.id] = base;
chains[mainnet.id] = mainnet;
chains[sepolia.id] = sepolia;
chains[polygon.id] = polygon;
chains[polygonMumbai.id] = polygon;
chains[anvil.id] = anvil;

export function getChain(chainId:number):Chain;
export function getChain(chainId:string):Chain;
export function getChain(chainId:number|string) {
    if (typeof chainId === "string") {
        if (!isHex(chainId)) return null;
        chainId = fromHex(chainId, "number");
    }

    const chain = chains[chainId];
    if (!chain) return null;

    return chain;
}



export interface TapesRequest {
    tapeIds?:string[],
    currentPage:number,
    pageSize:number
    orderBy?:string,
    orderDir?:string,
    cartridgeId?:string, // can be used to filter by cartridge
    msg_sender?:string,
    ruleId?:string
}

export async function getTapes(options:TapesRequest) {
    let tags:Array<string> = ["tape"];
    if (options.cartridgeId) tags.push(options.cartridgeId);
    if (options.ruleId) tags.push(options.ruleId);

    if (options.tapeIds && options.tapeIds.length > 0) {
        tags = tags.concat(options.tapeIds);
    }
    let req_options:IndexerPayload = {
        page: options.currentPage,
        page_size: options.pageSize,
        type: "input",
        tags: tags,
    }

    if (options.orderBy) {
        req_options.order_by = options.orderBy;
        if (options.orderDir) req_options.order_dir = options.orderDir
    }
    if (options.msg_sender) req_options.msg_sender = options.msg_sender


    const res:DecodedIndexerOutput = await getOutputs(
      req_options,
      {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    );
  
    return res;
}

export interface CartridgesRequest {
    cartridgeIds?:string[],
    currentPage:number,
    pageSize:number
    orderBy?:string,
    orderDir?:string,
    user_address?:string,
    ruleId?:string,
    tags?:string[],
    getCover?:boolean,
}

export async function getCartridges(options:CartridgesRequest): Promise<CartridgesOutput>{

    let req_options:CartridgesPayload = {
        get_cover:options.getCover
        // page: options.currentPage,
        // page_size: options.pageSize,
        // TODO: other parameters after new version
    }
    if (options.tags && options.tags.length > 0) 
        req_options.tags = options.tags;

    const res:CartridgesOutput = await cartridges(
        req_options,
        {
            decode:true,
            decodeModel:"CartridgesOutput",
            cartesiNodeUrl: envClient.CARTESI_NODE_URL
        }
    );

    const newData: CartridgeInfo[] = [];
    for (const cartridge of res.data) {
        if (options.user_address && options.user_address.toLowerCase() != cartridge.user_address.toLowerCase()) continue;
        if (options.cartridgeIds && options.cartridgeIds.indexOf(cartridge.id) == -1) continue;
        newData.push(cartridge);
    }

    res.total = newData.length;
    if (options.pageSize && options.currentPage && options.pageSize < newData.length) {
        res.data = newData.slice(options.pageSize*(options.currentPage-1),options.pageSize*options.currentPage);
    } else {
        res.data = newData;
    }
  
    return res;
}

export function extractTxError(msg:string):string {
    const m = msg.match(/(.*)\s\[/);
    if (m?.length && m.length >= 2) return m[1] as string;
    return "Error in transaction";
}

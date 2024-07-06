
import { BigNumber, ethers } from "ethers";
import { IndexerOutput, indexerQuery } from "../backend-libs/indexer/lib";
import { getUserCartridgesBondInfo, getUserTapes, getUserTapesBondInfo, prettyNumberFormatter } from "../utils/assets";
import { envClient } from "../utils/clientEnv";


export async function getUserTapesTotal(address:string): Promise<number> {

    if (!address) return 0;
    const indexerOutput: IndexerOutput = await indexerQuery(
        {
            tags:["tape"],
            msg_sender:address,
            type:"input",
            page_size:0
        },
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode:true, decodeModel:"IndexerOutput"}) as IndexerOutput;

    return indexerOutput.total;
}

export async function getUserCartridgesTotal(address:string): Promise<number> {

    if (!address) return 0;
    const indexerOutput: IndexerOutput = await indexerQuery(
        {
            tags:["cartridge"],
            msg_sender:address,
            type:"input",
            page_size:10
        },
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode:true, decodeModel:"IndexerOutput"}) as IndexerOutput;
    return indexerOutput.total;
}


export default async function ProfileSummary({address}:{address:string}) {

    // fetch info to build profile summary
    const totalTapesCreated = getUserTapesTotal(address);
    const totalCartridgesCreated = getUserCartridgesTotal(address);
    const tapes = await getUserTapesBondInfo(address);
    const cartridges = await getUserCartridgesBondInfo(address);

    // TODO: consider multiple currencies
    let totalTapesOwned = BigNumber.from(0);
    let totalCartridgesOwned = BigNumber.from(0);
    let porfolio: any = {};
    for (const bond of cartridges) {
        if (bond.amountOwned) {
            totalCartridgesOwned = totalCartridgesOwned.add(bond.amountOwned);
            if (!porfolio[bond.currencySymbol]) porfolio[bond.currencySymbol] = {decimals:bond.currencyDecimals,value:BigNumber.from(0)};
            porfolio[bond.currencySymbol].value = porfolio[bond.currencySymbol].value.add(bond.currentPrice.mul(bond.amountOwned));
        }
    }
    for (const bond of tapes) {
        if (bond.amountOwned) {
            totalTapesOwned = totalTapesOwned.add(bond.amountOwned);
            if (!porfolio[bond.currencySymbol]) porfolio[bond.currencySymbol] = {decimals:bond.currencyDecimals,value:BigNumber.from(0)};
            porfolio[bond.currencySymbol].value = porfolio[bond.currencySymbol].value.add(bond.currentPrice.mul(bond.amountOwned));
        }
    }
    let porfolioValue: string = "";
    for (const currencySymbol of Object.keys(porfolio)) {
        porfolioValue = porfolioValue + (porfolioValue && porfolioValue.length > 0 ? " / " : "") + 
            `${parseFloat(ethers.utils.formatUnits(porfolio[currencySymbol].value,porfolio[currencySymbol].decimals)).toLocaleString("en", { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${currencySymbol}`;
    }

    let cartridgesCollected: string|undefined = undefined;
    if (totalCartridgesOwned.gt(0))
        cartridgesCollected = prettyNumberFormatter(totalCartridgesOwned.toNumber(),2);

    let tapesCollected: string|undefined = undefined;
    if (totalTapesOwned.gt(0))
        tapesCollected = prettyNumberFormatter(totalTapesOwned.toNumber(),2);

    return (
        <div id="profile_portfolio">
            <div className="grid grid-cols-3 gap-2 text-center">
                {porfolioValue ? <div className="p-4 bg-rives-gray flex flex-col">
                    <span>Portfolio Value</span>
                    <span>{porfolioValue}</span>
                </div> : <></>}

                {totalCartridgesCreated ? <div className="p-4 bg-rives-gray flex flex-col">
                    <span>Cartridges Created</span>
                    <span>{totalCartridgesCreated}</span>
                </div> : <></>}

                {totalTapesCreated ? <div className="p-4 bg-rives-gray flex flex-col">
                    <span>Tapes Created</span>
                    <span>{totalTapesCreated}</span>
                </div> : <></>}

                {cartridgesCollected ? <div className="p-4 bg-rives-gray flex flex-col">
                    <span>Cartridges Collected</span>
                    <span>{cartridgesCollected}</span>
                </div> : <></>}

                {tapesCollected ? <div className="p-4 bg-rives-gray flex flex-col ">
                    <span>Tapes Collected</span>
                    <span>{tapesCollected}</span>
                </div> : <></>}

                {/*<div className="p-4 bg-rives-gray flex flex-col ">
                    <span>Rives Points</span>
                    <span>1234</span>
                </div> */}
            </div>
        </div>
    );
}
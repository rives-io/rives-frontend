import { IndexerOutput, indexerQuery } from "../backend-libs/indexer/lib";
import { envClient } from "../utils/clientEnv";


export async function getUserTapesTotal(address:string): Promise<number> {

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


export default function ProfileSummary({address}:{address:string}) {

    // fetch info to build profile summary
    const totalTapesCreated = getUserTapesTotal(address);
    const totalCartridgesCreated = getUserCartridgesTotal(address);

    return (
        <div id="profile_portfolio">
            <div className="grid grid-cols-3 gap-2 text-center">
                {/* <div className="p-4 bg-rives-gray flex flex-col">
                    <span>Portfolio Value</span>
                    <span>250 USD</span>
                </div> */}

                {totalCartridgesCreated ? <div className="p-4 bg-rives-gray flex flex-col">
                    <span>Cartridges Created</span>
                    <span>{totalCartridgesCreated}</span>
                </div> : <></>}

                {totalTapesCreated ? <div className="p-4 bg-rives-gray flex flex-col">
                    <span>Tapes Created</span>
                    <span>{totalTapesCreated}</span>
                </div> : <></>}

                {/* <div className="p-4 bg-rives-gray flex flex-col">
                    <span>Cartridges Collected</span>
                    <span>2</span>
                </div>

                <div className="p-4 bg-rives-gray flex flex-col ">
                    <span>Tapes Collected</span>
                    <span>2</span>
                </div>

                <div className="p-4 bg-rives-gray flex flex-col ">
                    <span>Rives Points</span>
                    <span>1234</span>
                </div> */}
            </div>
        </div>
    );
}
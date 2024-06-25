import Link from "next/link";
import Image from "next/image";
import { Contest, getContestStatus, getContestStatusMessage } from "../utils/common";
import { RuleInfo } from "../backend-libs/core/ifaces";


export interface ContestCardInfo extends RuleInfo, Contest {
    rank?:number // user rank
}

export default function ContestCard({contest, cartridgeCover}:{contest:ContestCardInfo, cartridgeCover?:string}) {
    return (
        <Link href={`/contests/${contest.id}`}
            className="bg-rives-gray flex items-center space-x-2 p-4 border-2 border-transparent hover:border-white"
        >

            <Image alt={"Game Cover"}
            id="canvas-cover"
            width={120}
            height={120}
            style={{
                imageRendering: "pixelated",
            }}
            src={cartridgeCover? `data:image/png;base64,${cartridgeCover}`:"/logo.png"}
            />
            
            <div className="flex flex-col items-center lg:flex-row lg:space-x-2 lg:grow">
            <span className="text-xl md:text-2xl lg:w-[60%] pixelated-font">{contest.name}</span>
            
            <div className="flex flex-col text-sm md:text-base self-start lg:w-[40%]">
                <div className="flex">
                <span className="pixelated-font">Prize:</span>
                <span className="ms-3 md:ms-4 pixelated-font">{contest.prize}</span>
                </div>

                <div className="flex flex-wrap">
                    <span className="pixelated-font">Status:</span>
                    <span className="pixelated-font">{getContestStatusMessage(getContestStatus(contest))}</span>
                </div>
            </div>
            </div>
        </Link>
    );
}
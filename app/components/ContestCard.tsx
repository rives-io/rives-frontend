"use client"

import { Contest } from "../utils/common";
import { CartridgeInfo, RuleInfo } from "../backend-libs/core/ifaces";
import CartridgeCard from "./CartridgeCard";
import { useEffect, useState } from "react";
import { envClient } from "../utils/clientEnv";
import { tapes } from "../backend-libs/core/lib";


// diff in seconds
function formatTime(diff:number):string {
    if (diff > 86400) {
      return `${Math.ceil(diff / 86400)} days`
    }
    if (diff > 3600) {
      return `${Math.ceil(diff / 3600)} hours`
    }
    if (diff > 60) {
        return `${Math.ceil(diff / 60)} min`
    }
  
    return `${diff} seconds`
  }

function contestStatusMessage(contest:RuleInfo) {
    if (!(contest.start && contest.end)) return <></>;

    const currDate = new Date().getTime() / 1000;

    if (currDate > contest.end) {
        return <span className="text-red-500">closed on {new Date(contest.end * 1000).toLocaleDateString()} </span>;
    } else if (currDate < contest.start) {
        return <span className="text-yellow-500">starts {new Date(contest.start * 1000).toLocaleDateString()}</span>;
    } else {
        return <span className="text-green-500">OPEN: ends in {formatTime(contest.end - currDate)}</span>;
    }
}

export interface ContestCardInfo extends RuleInfo, Contest {
    rank?:number // user rank
}

export default function ContestCard({contest, cartridge}:{contest:ContestCardInfo, cartridge:CartridgeInfo}) {
    const contests = envClient.CONTESTS as Record<string,Contest>;
    const isContest = contest.start && contest.end && contests[contest.id] != undefined;
    const [nTapes, setNTapes] = useState<number>();

    useEffect(() => {
        tapes({rule_id:contest.id,page:1,page_size:0}, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}).then(
            (tapeOut) => {
                setNTapes(tapeOut.total);
            }
        );
    }, [contest])

    return (
        <div onClick={() => isContest? window.open(`/contests/${contest.id}`, "_self"):null}
        className={`bg-black p-4 flex gap-4 text-start border border-transparent ${isContest? "hover:border-white hover:cursor-pointer":""}`}>
            <CartridgeCard cartridge={cartridge} small={true} />

            <div className="flex flex-col md:w-52">
                <span className="pixelated-font text-lg">{contest.name}</span>
                <span className="text-sm text-gray-400">{nTapes} Submissions</span>

                {
                    contestStatusMessage(contest)
                }
            </div>
        </div>
    );
}
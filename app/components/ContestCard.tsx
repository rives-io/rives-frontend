"use client"

import { Contest } from "../utils/common";
import { CartridgeInfo, RuleInfo } from "../backend-libs/core/ifaces";
import CartridgeCard from "./CartridgeCard";
import { formatTime } from "../utils/util";


function contestStatusMessage(contest:RuleInfo) {
    if (!(contest.start && contest.end)) return <></>;
  
    const currDate = new Date().getTime() / 1000;
  
    if (currDate > contest.end) {
        return <span className="text-red-500">CLOSED: ended {formatTime(currDate - contest.end)} ago </span>;
    } else if (currDate < contest.start) {
        return <span className="text-yellow-500">UPCOMING: starts in {formatTime(contest.start - currDate)} and lasts {formatTime(contest.end - contest.start)}</span>;
    } else {
        return <span className="text-green-500">OPEN: ends in {formatTime(contest.end - currDate)}</span>;
    }
  }

export interface ContestCardInfo extends RuleInfo, Contest {
    rank?:number // user rank
}

export default function ContestCard({contest, cartridge}:{contest:ContestCardInfo, cartridge:CartridgeInfo}) {
    const isContest = contest.start && contest.end;
    const cartridgeCard = <CartridgeCard cartridge={cartridge} small={true} />;

    return (
        <div className="relative">
            <div id={contest.id} 
            onClick={() => isContest? window.open(`/contests/${contest.id}`, "_self"):null}
            className={`bg-black p-4 flex gap-4 text-start border border-transparent ${isContest? "hover:border-white hover:cursor-pointer":""}`}>
                <div>
                    {cartridgeCard}
                </div>

                <div className="flex flex-col md:w-52"
                >
                    <span className="pixelated-font text-lg">{contest.name}</span>
                    <span className="text-sm text-gray-400">{contest.n_tapes} Submissions</span>

                    {
                        contestStatusMessage(contest)
                    }
                </div>
            </div>
            <div className="absolute start-4 top-4">
                {cartridgeCard}
            </div>
        </div>
    );
}
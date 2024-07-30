"use client"

import { Contest, ContestStatus, getContestStatus } from "../utils/common";
import { CartridgeInfo, RuleInfo } from "../backend-libs/core/ifaces";
import CartridgeCard from "./CartridgeCard";
import { useEffect, useState } from "react";
import { envClient } from "../utils/clientEnv";
import { tapes } from "../backend-libs/core/lib";
import { formatTime, getContestWinner } from "../utils/util";
import { getUsersByAddress, User } from "../utils/privyApi";
import Link from "next/link";


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

export interface CartridgeWithUser extends CartridgeInfo {
    user?:User|null
}

export default function ContestCard({contest, cartridge}:{contest:RuleInfo, cartridge:CartridgeWithUser}) {
    const [winnerAddress, setWinnerAddress] = useState<string>("");
    const [winnerUser, setWinnerUser] = useState<User|null>(null);
    const contests = envClient.CONTESTS as Record<string,Contest>;
    const isContest = contest.start && contest.end && contests[contest.id] != undefined;
    const cartridgeCard = <CartridgeCard cartridge={cartridge} small={true} creator={cartridge.user} />;
    const [nTapes, setNTapes] = useState<number>();

    const status = getContestStatus(contest);

    useEffect(() => {
        const checkWinner = async () => {
            if (status == ContestStatus.FINISHED) {
                const contestWinnerAddress = await getContestWinner(contest.cartridge_id, contest.id);
                if (!contestWinnerAddress) return;
                setWinnerAddress(contestWinnerAddress);

                const userMap:Record<string,User> = JSON.parse(await getUsersByAddress([contestWinnerAddress]));
                const contestWinnerUser = userMap[contestWinnerAddress.toLowerCase()];

                if (!contestWinnerUser) {
                    return;
                }

                setWinnerUser(contestWinnerUser);
            }
        }

        checkWinner();
    }, []);

    useEffect(() => {
        tapes({rule_id:contest.id,page:1,page_size:0}, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}).then(
            (tapeOut) => {
                setNTapes(tapeOut.total);
            }
        );
    }, [contest]);

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
                    <span className="text-sm text-gray-400">{nTapes} Submissions</span>

                    {
                        contestStatusMessage(contest)
                    }

                    {
                        winnerAddress.length == 0?
                            status == ContestStatus.FINISHED?
                                <span>WINNER: TBA</span>
                            :
                                <></>
                        :
                            !winnerUser?
                                <span title={winnerAddress}>
                                    WINNER: <Link onClick={(e:React.MouseEvent<HTMLElement>) => e.stopPropagation()} href={`/profile/${winnerAddress}`} className="text-rives-purple hover:underline">
                                        {`${winnerAddress.slice(0, 6)}...${winnerAddress.substring(winnerAddress.length-4,winnerAddress.length)}`}
                                    </Link>
                                </span>
                            :
                                <span title={winnerAddress}>
                                    WINNER: <Link onClick={(e:React.MouseEvent<HTMLElement>) => e.stopPropagation()} href={`/profile/${winnerAddress}`} className="text-rives-purple hover:underline">
                                        {winnerUser.name}
                                    </Link>
                                </span>
                    }
                </div>
            </div>
            <div className="absolute start-4 top-4">
                {cartridgeCard}
            </div>
        </div>
    );
}
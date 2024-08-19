"use client"

import { ContestDetails, ContestStatus, getContestStatus } from "../utils/common";
import { CartridgeInfo, RuleInfo } from "../backend-libs/core/ifaces";
import CartridgeCard from "./CartridgeCard";
import { useEffect, useState } from "react";
import { envClient } from "../utils/clientEnv";
import { tapes } from "../backend-libs/core/lib";
import { formatTime, getContestDetails, getContestWinner } from "../utils/util";
import { getUsersByAddress, User } from "../utils/privyApi";
import Link from "next/link";
import Image from "next/image";


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
    const isContest = contest.start && contest.end;
    const cartridgeCard = <CartridgeCard cartridge={cartridge} small={true} creator={cartridge.user} />;
    const [nTapes, setNTapes] = useState<number>();
    const [contestDetails, setContestDetails] = useState<ContestDetails|null>(null);

    const status = getContestStatus(contest);
    const contestHasPrizes = contestDetails && (contestDetails.prize || (contestDetails.achievements && contestDetails.achievements.length > 0));

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

        getContestDetails(contest.id).then(setContestDetails);

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
        <div className="relative w-[352px] h-60">
            <div id={contest.id} 
            onClick={() => isContest? window.open(`/contests/${contest.id}`, "_self"):null}
            className={`h-full bg-black p-4 flex flex-col gap-2 text-start border border-transparent ${isContest? "hover:border-white hover:cursor-pointer":""}`}>
                <div className="flex gap-2 text-start">
                    <div>
                        {cartridgeCard}
                    </div>

                    <div className="flex flex-col gap-1 w-full">
                        <div className="flex flex-col">
                            <span className="pixelated-font text-lg leading-none">{contest.name}</span>
                            <span className="text-sm text-gray-400">{nTapes} Submissions</span>
                        </div>

                        <div className="flex flex-col leading-none">
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

                            <div>
                                {
                                    !contestDetails || !contestDetails.sponsor_name?
                                        <></>
                                    :
                                        <div className="flex gap-2 items-center">
                                            SPONSOR:
                                            {
                                                !(contestDetails.sponsor_image_data || contestDetails.sponsor_image_type)?
                                                    <></>
                                                :
                                                    <Image
                                                    src={`data:${contestDetails.sponsor_image_type};base64,${contestDetails.sponsor_image_data}`}
                                                    width={24}
                                                    height={24}
                                                    alt=""
                                                    />    
                                            }
                                            <span>{contestDetails.sponsor_name}</span>
                                        </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>


                {
                        !contestHasPrizes?
                            <></>
                        :
                            <div className="border-t border-white">
                                <div className="text-center -mt-3">
                                    <span className="bg-black px-1 pixelated-font">
                                        Prizes
                                    </span>
                                </div>


                                <div>
                                    {
                                        !contestDetails || !contestDetails.prize?
                                        <></>
                                    :
                                        <div className="text-center">
                                            {contestDetails.prize}
                                        </div>

                                    }

                                    {
                                        !contestDetails || contestDetails.achievements.length == 0?
                                            <></>
                                        :
                                            <div className="flex gap-2">
                                                {
                                                    contestDetails.achievements.map((achievement, index) => {
                                                        if (!achievement) return <></>;

                                                        return <Image 
                                                        title={achievement.name} 
                                                        key={`${achievement.slug}-${index}`} 
                                                        src={`data:image/png;base64,${achievement.image_data}`} 
                                                        width={48} 
                                                        height={48} 
                                                        alt=""
                                                        />
                                                    })
                                                }
                                            </div>
                                    }
                                </div>

                            </div>
                    }
            </div>
            <div className="absolute start-4 top-4">
                {cartridgeCard}
            </div>
        </div>
    );
}
"use client"


import { useEffect, useState } from "react";
import { DecodedIndexerOutput } from "../backend-libs/cartesapp/lib";
import { cartridgeInfo, getOutputs, rules } from "../backend-libs/core/lib";
import Loading from "./Loading";
import { envClient } from "../utils/clientEnv";
import ContestCard from "./ContestCard";
import { CartridgeInfo, RuleInfo } from "../backend-libs/core/ifaces";


export default function UserContests({address}:{address:string}) {    
    const [userContests, setUserContests] = useState<Array<RuleInfo>>([]);
    const [cartridgeInfoMap, setCartridgeInfoMap] = useState<Record<string, CartridgeInfo>>({});
    
    const [contestsLoading, setContestsLoading] = useState(false);

    const contestsByProfile = async () => {
        setContestsLoading(true);

        const contests = (await rules(
            {has_start: true, has_end: true},
            {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true})
        ).data;

        let participatedContests:Array<RuleInfo> = [];
        let participatedContestsCartridges:Record<string, CartridgeInfo> = {};

        for (let i = 0; i < contests.length; i++) {
            const contest:RuleInfo = contests[i];

            // check if contest is over
            // if over: then get user rank
            // const contestStatus = getContestStatus(contest);
            // const contestIsOver = [ContestStatus.INVALID,ContestStatus.VALIDATED].indexOf(contestStatus) > -1;
            
            const res:DecodedIndexerOutput = await getOutputs(
                {
                    msg_sender: address,
                    type: "input",
                    tags: ["tape", contest.id],
                    page: 1,
                    page_size: 1
                },
                {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
            );
            
            // user played this contest
            if (res.data.length > 0) {
                participatedContests.push(contest);

                if (!participatedContestsCartridges[contest.cartridge_id]) {
                    const cartridge:CartridgeInfo = await cartridgeInfo(
                        {id:contests[i].cartridge_id},
                        {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL}
                    );
                
                    participatedContestsCartridges[cartridge.id] = cartridge;
                }
            }
        }

        setUserContests(participatedContests);
        setCartridgeInfoMap(participatedContestsCartridges);
        setContestsLoading(false);
    }

    useEffect(() => {
        contestsByProfile();
    }, [])


    return (
        <div className="flex flex-col gap-4">
            <div className='w-full lg:w-[80%]'>
                    <h1 className={`text-2xl pixelated-font`}>Contests</h1>
            </div>

            {
                contestsLoading?
                    <div className="h-56">
                        <Loading msg="Loading Contests" />
                    </div>
                :
                    userContests.length == 0?
                        <div className="text-center pixelated-font">No Contests</div>
                    :
                        <div className="flex justify-center">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {
                                    userContests.map((contest, index) => {
                                        return (
                                            <ContestCard key={index} contest={contest} cartridge={cartridgeInfoMap[contest.cartridge_id]} />
                                        )
                                    })
                                }
                            </div>
                        </div>
            }
        </div>
    )
}
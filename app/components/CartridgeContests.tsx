"use client"


import { useEffect, useState } from "react";
import { rules } from "../backend-libs/core/lib";
import Loading from "./Loading";
import { envClient } from "../utils/clientEnv";
import { Contest } from "../utils/common";
import ContestCard, { ContestCardInfo } from "./ContestCard";

const knowContests = envClient.CONTESTS as Record<string,Contest>;
const contestsIds = Object.keys(knowContests);


export default function CartridgeContests({cartridgeId, cartridgeCover}:{cartridgeId:string, cartridgeCover?:string}) {    
    const [cartridgeContests, setCartridgeContests] = useState<Array<ContestCardInfo>>([]);
    
    const [contestsLoading, setContestsLoading] = useState(false);

    const contestsByCartridge = async () => {
        setContestsLoading(true);

        const contests = (await rules(
            {ids: contestsIds, cartridge_id: cartridgeId},
            {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true})
        ).data;

        setCartridgeContests(contests);
        setContestsLoading(false);
    }

    useEffect(() => {
        contestsByCartridge();
    }, [])


    return (
        <div className="flex flex-col gap-4">
            {
                contestsLoading?
                    <div className="h-56">
                        <Loading msg="Loading Contests" />
                    </div>
                :
                    <div className="grid grid-cols-1 gap-4">
                        {
                            cartridgeContests.map((contest, index) => {
                                return (
                                    <ContestCard key={index} contest={contest} cartridgeCover={cartridgeCover} />
                                )
                            })
                        }

                    </div>
            }
        </div>
    )
}
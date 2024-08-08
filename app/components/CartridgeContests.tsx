"use client"


import { useEffect, useState } from "react";
import { rules } from "../backend-libs/core/lib";
import Loading from "./Loading";
import { envClient } from "../utils/clientEnv";
import ContestCard, { CartridgeWithUser } from "./ContestCard";
import { RuleInfo } from "../backend-libs/core/ifaces";


export default function CartridgeContests({cartridgeId, cartridge}:{cartridgeId:string, cartridge:CartridgeWithUser}) {    
    const [cartridgeContests, setCartridgeContests] = useState<Array<RuleInfo>|null>(null);
    
    const [contestsLoading, setContestsLoading] = useState(false);

    const contestsByCartridge = async () => {
        setContestsLoading(true);

        const contests = (await rules(
            {cartridge_id: cartridgeId, has_start: true, has_end: true},
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
                    cartridgeContests?.length == 0?
                        <div className="text-center pixelated-font">No Contests</div>
                    :
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {
                                cartridgeContests?.map((contest, index) => {
                                    return (
                                        <ContestCard key={index} contest={contest} cartridge={cartridge} />
                                    )
                                })
                            }

                        </div>
            }
        </div>
    )
}
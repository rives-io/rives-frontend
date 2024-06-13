import { envClient } from "@/app/utils/clientEnv";
import { CartridgeInfo, GetRulesPayload, RuleInfo } from "../backend-libs/core/ifaces";
import { cartridgeInfo, rules } from "../backend-libs/core/lib";
import { Contest, ContestStatus, getContestStatus, getContestStatusMessage } from "../utils/common";
import Link from "next/link";
import Image from "next/image";

interface RuleWithMetadata extends RuleInfo, Contest {}

const getRules = async (contests:Record<string,Contest>, onlyActive = false) => {
  const contestsRules:Array<RuleWithMetadata> = [];

  const inputPayload: GetRulesPayload = {
    ids: Object.keys(contests)
  };
  if (onlyActive) {
    inputPayload.active_ts = Math.floor((new Date()).valueOf()/1000);
  }
  
  const activeRules = (await rules(inputPayload, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true})).data
  for (let i = 0; i < activeRules.length; i++) {
    const rule: RuleInfo = activeRules[i];
    if (rule.id in contests) {
      const ruleWithMetadata = {...contests[rule.id], ...rule};
      contestsRules.push(ruleWithMetadata);
    }
  }

  return contestsRules;
}

export default async function Contests() {
  const contestsMetadata = envClient.CONTESTS as Record<string,Contest>;
  const contests = (await getRules(contestsMetadata)).sort((a, b) => {
    const aStatus = getContestStatus(a);
    const bStatus = getContestStatus(b);
    if (!b.start || !a.start) return b.created_at - a.created_at;
    if (aStatus != bStatus) aStatus - bStatus;
    return b.start - a.start
  });

  let cartridgeInfoMap:Record<string, CartridgeInfo> = {};
  
  if (contests.length == 0) {
    return (
      <main className="flex items-center justify-center h-lvh">
        <span className={`text-4xl text-white` }>No Active Contests!</span>
      </main>
    )
  }
  
  // get cartridgeInfo
  for (let i = 0; i < contests.length; i++) {
    if (!cartridgeInfoMap[contests[i].cartridge_id]) {
      const cartridge:CartridgeInfo = await cartridgeInfo(
        {id:contests[i].cartridge_id},
        {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL,cache:"force-cache"}
      );

      cartridgeInfoMap[cartridge.id] = cartridge;
    }
  }

  // const currDate = new Date().getTime()/1000; // divide by 1000 to convert from miliseconds to seconds


  return (
    <main>
      <section className="py-16 my-8 w-full flex justify-center">
        <div className="flex flex-col space-y-8 w-[95%] sm:max-w-xl lg:max-w-3xl xl:max-w-5xl">
          {
            contests.map((contest, index) => {
              if (!contest.start || !contest.end) return <></>;
              return (
                <Link key={index} href={`/contests/${contest.id}`}
                  className="bg-gray-400 flex items-center space-x-2 p-4 border-2 border-transparent hover:border-white"
                >
    
                  <Image alt={"Cover " + cartridgeInfoMap[contest.cartridge_id].name}
                    id="canvas-cover"
                    width={120}
                    height={120}
                    style={{
                        imageRendering: "pixelated",
                    }}
                    src={cartridgeInfoMap[contest.cartridge_id].cover? `data:image/png;base64,${cartridgeInfoMap[contest.cartridge_id].cover}`:"/logo.png"}
                  />
                  
                  <div className="flex flex-col items-center lg:flex-row lg:space-x-2 lg:grow">
                    <span className="text-xl md:text-2xl lg:w-[60%]">{contest.name}</span>
                    
                    <div className="flex flex-col text-xs md:text-base self-start lg:w-[40%]">
                      <div className="flex ">
                        <span>Prize:</span>
                        <span className="ms-3 md:ms-4">{contest.prize}</span>
                      </div>

                      <div className="flex flex-wrap">
                        <span>Status:</span>
                        <span>{getContestStatusMessage(getContestStatus(contest))}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          }
        </div>
      </section>
    </main>
  )
}

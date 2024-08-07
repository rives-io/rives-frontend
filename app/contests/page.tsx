import { envClient } from "@/app/utils/clientEnv";
import { CartridgeInfo, GetRulesPayload, RuleInfo } from "../backend-libs/core/ifaces";
import { cartridgeInfo, rules } from "../backend-libs/core/lib";
import { Contest, getContestStatus } from "../utils/common";
import ContestCard from "../components/ContestCard";
import { Metadata } from "next";
import { getUsersByAddress, User } from "../utils/privyApi";

export const revalidate = 0 // revalidate always

export const metadata: Metadata = {
  title: 'Contests',
  description: 'Contests',
}

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
  let userAddresses:Set<string> = new Set();
  
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
        {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL}
      );

      cartridgeInfoMap[cartridge.id] = cartridge;
      userAddresses.add(cartridge.user_address);
    }
  }

  const userMap:Record<string, User> = JSON.parse(await getUsersByAddress(Array.from(userAddresses)));

  return (
    <main>
      <section className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {
            contests.map((contest, index) => {
              if (!contest.start || !contest.end) return <></>;

              const cartridgeCreatorAddr = cartridgeInfoMap[contest.cartridge_id].user_address.toLowerCase();
              const cartridgeCreatorUser = userMap[cartridgeCreatorAddr] || null;
              return (
                <ContestCard key={index} contest={contest} 
                cartridge={{...cartridgeInfoMap[contest.cartridge_id], user: cartridgeCreatorUser}} />
              )
            })
          }
        </div>
      </section>
    </main>
  )
}

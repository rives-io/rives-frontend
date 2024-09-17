import { BigNumber } from "ethers";
import CartridgeCard from "./components/CartridgeCard";
import { CartridgeInfo, RuleInfo } from "@/app/backend-libs/core/ifaces";
import TapeCard from "./components/TapeCard";
import { cartridgeInfo, rules } from "./backend-libs/core/lib";
import { VerifyPayloadProxy } from "@/app/backend-libs/core/lib";
import { cartridges as cartridgesRequest } from "@/app/backend-libs/core/lib";
import { envClient } from "./utils/clientEnv";
import { getTapes } from "./utils/util";
import { getTotalCartridges, getTotalTapes, prettyNumberFormatter } from "./utils/assets";
import ContestCard from "./components/ContestCard";
import { getUsersByAddress, User } from "./utils/privyApi";
import OlympicsBanner from "./components/OlympicsBanner";


export const revalidate = 0 // revalidate data always

let total_cartridges:number;
let total_tapes:number;

let total_collected_cartridges:BigNumber;
let total_collected_tapes:BigNumber;

async function getLatestsCartridges() {
  const res = (await cartridgesRequest(
    {
      page: 1, 
      page_size: 4, 
      get_cover: true, 
      order_by: "created_at", 
      order_dir: "desc" 
    },
    {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL})
  );

  const cartridges:Array<CartridgeInfo> = res.data;
  total_cartridges = res.total;

  return cartridges;
}

async function getLatestsTapes() {
  const res = (await getTapes(
    {
      currentPage: 1,
      pageSize: 4,
      orderBy: "timestamp",
      orderDir: "desc"
    }
  ));

  const tapes = res.data;
  total_tapes = res.total;

  return tapes;
}

async function getLatestsContests() {
  const contests = (await rules(
    {
      active_ts: Math.floor(new Date().getTime() / 1000),
      page: 1,
      page_size: 4,
      order_by: "start",
      order_dir: "desc"
    },
    {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}
  )).data;

  return contests;
}

export default async function Home() {
  const promises = [getLatestsCartridges(), getLatestsTapes(), getLatestsContests(), getTotalCartridges(), getTotalTapes()]
  let cartridges:Array<CartridgeInfo>;
  let tapes:Array<VerifyPayloadProxy>;
  let contests:Array<RuleInfo>;
  let userAddresses:Set<string> = new Set();

  [cartridges, tapes, contests, total_collected_cartridges, total_collected_tapes] = await Promise.all(promises)

  let contestCartridges:Record<string, CartridgeInfo> = {};
  for (let i = 0; i < contests.length; i++) {
    const contestCartridgeId = contests[i].cartridge_id;
    let cartridge = cartridges.find((cartridge => cartridge.id == contestCartridgeId));
    if (!cartridge) {
      cartridge = await cartridgeInfo(
        {id: contestCartridgeId},
        {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL}
      );
    }

    if (!cartridge) continue;
    
    if (!cartridge.primary && cartridge.primary_id) {
      const primaryId = cartridge.primary_id;
      
      cartridge = cartridges.find((cartridge => cartridge.id == cartridge.primary_id));
      if (!cartridge) {
        cartridge = await cartridgeInfo(
          {id: primaryId},
          {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL}
        );  
      }
    }

    if (!cartridge) continue;

    userAddresses.add(cartridge.user_address); // contest cartridge creator
    contestCartridges[contests[i].id] = cartridge;
  }

  // users from cartridges
  for (let cartridge of cartridges) {
    userAddresses.add(cartridge.user_address);
  }

  // users from tapes
  for (let tape of tapes) {
    userAddresses.add(tape._msgSender);
  }

  const userMap:Record<string, User> = JSON.parse(await getUsersByAddress(Array.from(userAddresses)));

  return (
    <main className="gap-8">
      <section className="flex flex-col items-center">
        <OlympicsBanner/>
        
        <div className="homepageContainer">
          <h1 className={`text-4xl pixelated-font mb-4`}>Latest Cartridges</h1>
          <div className="flex flex-wrap gap-4 w-fit">
            {
              cartridges.map((cartridge, index) => {
                return <CartridgeCard key={index} cartridge={cartridge} creator={userMap[cartridge.user_address.toLowerCase()] || null}/>
              })
            }
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center">
        <div className="homepageContainer">
          <h1 className={`text-4xl pixelated-font mb-4`}>Latest Tapes</h1>
          <div className="flex flex-wrap gap-4 w-fit">
            {
              tapes.map((tape, index) => {
                return <TapeCard key={index} tapeInput={JSON.stringify(tape)} creator={userMap[tape._msgSender.toLowerCase()] || null} />
              })
            }
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center">
        <div className="homepageContainer">
          <h1 className={`text-4xl pixelated-font mb-4`}>Open Contests</h1>
          <div className={`flex flex-wrap gap-4 justify-center ${contests.length < 2? "md:justify-start":"md:justify-between"}`}>
            {
              contests.length == 0?
                <div className="text-center pixelated-font">No Contests Open</div>
              :
                <>
                {
                  contests.map((contest, index) => {
                    return <ContestCard 
                    key={`${contest.id}-${index}`} 
                    contest={contest} 
                    cartridge={{...contestCartridges[contest.id], user: userMap[contestCartridges[contest.id].user_address.toLowerCase()]}} 
                    />
                  })
                }
                </>
            }
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center">
        <div className="homepageContainer">
          <h1 className={`text-4xl pixelated-font mb-4`}>Stats</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
            <div className='p-8 bg-rives-gray flex flex-col text-center'>
              <span className={`text-3xl pixelated-font`}>Total Cartridges Created</span>
              <span className={`text-5xl pixelated-font`}>{total_cartridges}</span>
            </div>

            <div className='p-8 bg-rives-gray flex flex-col text-center'>
              <span className={`text-3xl pixelated-font`}>Total Tapes Created</span>
              <span className={`text-5xl pixelated-font`}>{total_tapes}</span>
            </div>

            {total_collected_cartridges ? <div className='p-8 bg-rives-gray flex flex-col text-center'>
              <span className={`text-3xl pixelated-font`}>Total Cartridges Collected</span>
              <span className={`text-5xl pixelated-font`}>{prettyNumberFormatter(total_collected_cartridges.toNumber(),2)}</span>
            </div> : <></>}

            {total_collected_tapes ? <div className='p-8 bg-rives-gray flex flex-col text-center'>
              <span className={`text-3xl pixelated-font`}>Total Tapes Collected</span>
              <span className={`text-5xl pixelated-font`}>{prettyNumberFormatter(total_collected_tapes.toNumber(),2)}</span>
            </div> : <></>}
          </div>
        </div>
      </section>
    </main>
  )
}

import { BigNumber } from "ethers";
import CartridgeCard from "./components/CartridgeCard";
import { CartridgeInfo, RuleInfo } from "@/app/backend-libs/core/ifaces";
import TapeCard from "./components/TapeCard";
import { cartridgeInfo, rules } from "./backend-libs/core/lib";
import { VerifyPayload } from "@/app/backend-libs/core/lib";
import { cartridges as cartridgesRequest } from "@/app/backend-libs/core/lib";
import { envClient } from "./utils/clientEnv";
import { getTapes } from "./utils/util";
import { getTotalCartridges, getTotalTapes, prettyNumberFormatter } from "./utils/assets";
import ContestCard from "./components/ContestCard";
import { getUsersByAddress, User } from "./utils/privyApi";

export const revalidate = 0 // revalidate data always

let total_cartridges:number;
let total_tapes:number;

let total_collected_cartridges:BigNumber;
let total_collected_tapes:BigNumber;

async function getLatestsCartridges() {
  const res = (await cartridgesRequest(
    {page: 1, page_size: 4, get_cover: true },
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
      page_size: 3
    },
    {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}
  )).data;

  return contests;
}

export default async function Home() {
  const promises = [getLatestsCartridges(), getLatestsTapes(), getLatestsContests(), getTotalCartridges(), getTotalTapes()]
  let cartridges:Array<CartridgeInfo>;
  let tapes:Array<VerifyPayload>;
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
    <main className="px-4">
      <div className='flex flex-col items-center mb-8 space-y-8'>
        <div className='w-full lg:w-[80%]'>
          <h1 className={`text-4xl pixelated-font`}>Latest Cartridges</h1>          
        </div>

        <div className="flex flex-wrap justify-between md:justify-start gap-2 w-full lg:w-[80%]">
          {
            cartridges.map((cartridge, index) => {
              return <CartridgeCard key={index} cartridge={cartridge} creator={userMap[cartridge.user_address.toLowerCase()] || null}/>
            })
          }

        </div>

      </div>

      <div className='flex flex-col items-center mb-8 space-y-8'>
        <div className='w-full lg:w-[80%]'>
          <h1 className={`text-4xl pixelated-font`}>Latest Tapes</h1>
        </div>

        <div className="flex flex-wrap justify-between md:justify-start gap-2 w-full lg:w-[80%]">
          {
            tapes.map((tape, index) => {
              return <TapeCard key={index} tapeInput={JSON.stringify(tape)} creator={userMap[tape._msgSender.toLowerCase()] || null} />
            })
          }
        </div>
          
      </div>


      <div className='flex flex-col items-center mb-8 space-y-8'>
        <div className='w-full lg:w-[80%]'>
          <h1 className={`text-4xl pixelated-font`}>Contests Live</h1>
        </div>

        {
            contests.length == 0?
              <div className="text-center pixelated-font">No Contests Running</div>
            :
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full lg:w-[80%]'>
              {
                contests.map((contest, index) => {
                  return <ContestCard 
                  key={`${contest.id}-${index}`} 
                  contest={contest} 
                  cartridge={{...contestCartridges[contest.id], user: userMap[contestCartridges[contest.id].user_address.toLowerCase()]}} 
                  />
                })
              }
            </div>
        }
      </div>

      <div className='flex flex-col items-center mb-8 space-y-8'>
        <div className='w-full lg:w-[80%]'>
          <h1 className={`text-4xl pixelated-font`}>Stats</h1>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-center w-full lg:w-[80%]'>

          <div className='p-8 bg-rives-gray flex flex-col'>
            <span className={`text-3xl pixelated-font`}>Total Cartridges Created</span>
            <span className={`text-5xl pixelated-font`}>{total_cartridges}</span>
          </div>

          <div className='p-8 bg-rives-gray flex flex-col'>
            <span className={`text-3xl pixelated-font`}>Total Tapes Created</span>
            <span className={`text-5xl pixelated-font`}>{total_tapes}</span>
          </div>

          <div className='p-8 bg-rives-gray flex flex-col'>
            <span className={`text-3xl pixelated-font`}>Total Cartridges Collected</span>
            <span className={`text-5xl pixelated-font`}>{prettyNumberFormatter(total_collected_cartridges.toNumber(),2)}</span>
          </div>

          <div className='p-8 bg-rives-gray flex flex-col'>
            <span className={`text-3xl pixelated-font`}>Total Tapes Collected</span>
            <span className={`text-5xl pixelated-font`}>{prettyNumberFormatter(total_collected_tapes.toNumber(),2)}</span>
          </div>
        </div>

      </div>

    </main>
  )
}

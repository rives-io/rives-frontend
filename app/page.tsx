import { BigNumber } from "ethers";
import CartridgeCard from "./components/CartridgeCard";
import { CartridgeInfo, RuleInfo } from "@/app/backend-libs/core/ifaces";
import TapeCard from "./components/TapeCard";
import { rules } from "./backend-libs/core/lib";
import { VerifyPayload } from "./backend-libs/core/ifaces";
import Link from "next/link";
import { cartridges as cartridgesRequest } from "@/app/backend-libs/core/lib";
import { envClient } from "./utils/clientEnv";
import { getTapes } from "./utils/util";
import { getTotalCartridges, getTotalTapes, prettyNumberFormatter } from "./utils/assets";

export const revalidate = 60 // revalidate the data at most every minute

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
  const cartridges = await getLatestsCartridges();
  const tapes:Array<VerifyPayload> = await getLatestsTapes();
  const contests:Array<RuleInfo> = await getLatestsContests();
  total_collected_cartridges = await getTotalCartridges();
  total_collected_tapes = await getTotalTapes();  

  const contestsColors:Record<number, string> = {0: "#53fcd8", 1: "#f99776", 2: "#8b5cf6"};

  return (
    <main className="px-4 md:px-0">
      <div className='flex flex-col items-center mb-8 space-y-8'>
        <div className='w-full lg:w-[80%]'>
          <h1 className={`text-4xl pixelated-font`}>Latest Cartridges</h1>          
        </div>

        <div className="flex flex-wrap justify-between md:justify-start gap-2 w-full lg:w-[80%]">
          {
            cartridges.map((cartridge, index) => {
              return <CartridgeCard key={index} cartridge={cartridge} />
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
              return <TapeCard key={index} tapeInput={JSON.stringify(tape)} />
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
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-center w-full lg:w-[80%] text-black'>
              {
                contests.map((contest, index) => {
                  return <Link href={contest.id} className={`p-8 bg-${contestsColors[index]} hover:scale-110`}>{contest.name}</Link>
                })
              }
            </div>
        }

        {/* <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-center w-full lg:w-[80%] text-black'>
          <Link href={""} className='p-8 bg-[#53fcd8] hover:scale-110'>
            Contest 1
          </Link>

          <Link href={""} className='p-8 bg-[#f99776] hover:scale-110'>
            Contest 2
          </Link>

          <Link href={""} className='p-8 bg-[#8b5cf6] hover:scale-110'>
            Contest 3
          </Link>
        </div> */}

      </div>

      <div className='flex flex-col items-center mb-8 space-y-8'>
        <div className='w-full lg:w-[80%]'>
          <h1 className={`text-4xl pixelated-font`}>Stats</h1>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-center w-full lg:w-[80%]'>

          <div className='p-8 bg-rives-gray flex flex-col'>
            <span className={`text-3xl pixelated-font`}>Number of Cartridges</span>
            <span className={`text-5xl pixelated-font`}>{total_cartridges}</span>
          </div>

          <div className='p-8 bg-rives-gray flex flex-col'>
            <span className={`text-3xl pixelated-font`}>Number of Tapes</span>
            <span className={`text-5xl pixelated-font`}>{total_tapes}</span>
          </div>

          <div className='p-8 bg-rives-gray flex flex-col'>
            <span className={`text-3xl pixelated-font`}>Collected Cartridges</span>
            <span className={`text-5xl pixelated-font`}>{prettyNumberFormatter(total_collected_cartridges.toNumber(),2)}</span>
          </div>

          <div className='p-8 bg-rives-gray flex flex-col'>
            <span className={`text-3xl pixelated-font`}>Collected Tapes</span>
            <span className={`text-5xl pixelated-font`}>{prettyNumberFormatter(total_collected_tapes.toNumber(),2)}</span>
          </div>
        </div>

      </div>

    </main>
  )
}

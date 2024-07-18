import { VerificationOutput, cartridgeInfo, getOutputs, rules } from "@/app/backend-libs/core/lib";
import { CartridgeInfo, RuleInfo } from "@/app/backend-libs/core/ifaces";
import { envClient } from "@/app/utils/clientEnv";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Contest as ContestClass, ContestStatus, getContestStatus } from "../../utils/common";
import CartridgeCard from "@/app/components/CartridgeCard";
import RuleLeaderboard from "@/app/components/RuleLeaderboard";
import { formatTime, timeToDateUTCString } from "@/app/utils/util";


export const revalidate = 0 // revalidate always

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

const getContest = (rule_id:string) => {
  const contests = envClient.CONTESTS as Record<string,ContestClass>;

  if (rule_id in contests) {
    return contests[rule_id];
  }

  return null;
}

const getRule = async(rule_id:string):Promise<RuleInfo|null> => {
  const rulesFound = (await rules({id: rule_id}, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true})).data;

  if (rulesFound.length == 0) return null;

  

  return rulesFound[0];
}

async function getGameInfo(cartridge_id:string) {
  const cartridgeWithInfo:CartridgeInfo = await cartridgeInfo({id:cartridge_id},{decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL});

  return cartridgeWithInfo;
}

const getWinner = async (cartridge_id:string, rule:string):Promise<string|undefined> => {
  const tags = ["score",cartridge_id,rule];
  const tapes:Array<VerificationOutput> = (await getOutputs(
      {
          tags,
          type: 'notice',
          page_size: 1,
          page: 1,
          order_by: "value",
          order_dir: "desc"
      },
      {cartesiNodeUrl: envClient.CARTESI_NODE_URL})).data;

  if (tapes.length == 0) return undefined
  return tapes[0].user_address
}
  
export default async function Contest({ params }: { params: { contest_id: string } }) {
  const contest_id = params.contest_id;

  const contestMetadata = getContest(contest_id);

  if (!contestMetadata) {
    notFound();
  }

  const contest = await getRule(contest_id);
  if (!contest) {
    notFound();
  }

  const formatedContestCreator = `${contest.created_by.slice(0, 6)}...${contest.created_by.substring(contest.created_by.length-4,contest.created_by.length)}`;
  const status = getContestStatus(contest);
  const contestIsOpen = status == ContestStatus.IN_PROGRESS;
  const game = await getGameInfo(contest.cartridge_id);
  if (status == ContestStatus.VALIDATED) {
    contestMetadata.winner = await getWinner(contest.cartridge_id,contest_id);
  }

  return (
    <main className="flex justify-center">
      <div className="container">
        <div className="w-full flex flex-wrap items-center bg-black p-4 gap-2 md:gap-8 lg:gap-20">
          <CartridgeCard cartridge={game} small={true} />

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="pixelated-font text-xl">{contest.name}</span>
              {
                !contestMetadata.winner?
                  <></>
                :
                  <span title={contestMetadata.winner} className="text-gray-400">Winner: <Link className="pixelated-font text-rives-purple hover:underline" href={`/profile/${contestMetadata.winner}`}>{`${contestMetadata.winner.slice(0, 6)}...${contestMetadata.winner.substring(contestMetadata.winner.length-4,contestMetadata.winner.length)}`}</Link></span>
              }
            </div>

            
            <Link href={`/play/rule/${contest.id}`} className="bg-rives-purple pixelated-font justify-self-end h-fit text-center py-2 w-full md:w-2/3 hover:scale-110"
              style={{pointerEvents: contestIsOpen ? "auto":"none"}}>
              PLAY
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 mt-8">
          <div className="flex flex-col gap-4 lg:col-span-3">
              <div className="flex flex-col">
                <h1 className="pixelated-font text-xl">Overview</h1>

                <div className="grid grid-cols-2">
                  <span className="text-gray-400">Submissions</span>
                  <span>{contest.n_tapes}</span>

                  <span className="text-gray-400">Status</span>
                  {contestStatusMessage(contest)}

                  <span className="text-gray-400">Start</span>
                  {timeToDateUTCString(contest.created_at)}

                  <span className="text-gray-400">End</span>
                  {contest.end? timeToDateUTCString(contest.end):"-"}

                  <span className="text-gray-400">Contest Creator</span>
                  <Link className="hover:text-rives-purple"
                  title={contest.created_by}
                  href={`/profile/${contest.created_by}`}>
                    {formatedContestCreator}
                  </Link>

                </div>
              </div>

              <div className="flex flex-col">
                <h1 className="pixelated-font text-xl">Description</h1>
                <p>{contest.description}</p>
              </div>

          </div>

          <div className="flex flex-col gap-4 lg:col-span-4">
            <h1 className="pixelated-font text-xl">Leaderboard</h1>
    
            <RuleLeaderboard cartridge_id={contest.cartridge_id} rule={contest.id} 
              get_verification_outputs={contest != undefined && [ContestStatus.INVALID,ContestStatus.VALIDATED].indexOf(status) > -1 } 
            />
          </div>
        </div>
      </div>
    </main>
  );

  // return (
  //     <main className="flex justify-center h-svh">
  //       <section className="w-full flex flex-col space-y-8 max-w-5xl h-2/3">
  //         <div className="bg-gray-400 grid grid-cols-9 gap-2 justify-between p-4">
            
  //           <div className="flex col-span-1 justify-center items-center">
  //             <Image alt={"Cover " + game.name}
  //               id="canvas-cover"
  //               width={120}
  //               height={120}
  //               objectFit='contain'
  //               style={{
  //                   imageRendering: "pixelated",
  //               }}
  //               src={game.cover? `data:image/png;base64,${game.cover}`:"/logo.png"}
  //               />
  //           </div>
  //           <div className="flex flex-col col-span-4 relative justify-center">
  //             <span className="text-2xl">{contest.name}</span>
  //             {contest.start && contest.end ? <span title={new Date(contest.start*1000).toLocaleString() + " until " + new Date((contest.end*1000)).toLocaleString()} className="text-[10px] opacity-60">ends {new Date((contest.end*1000)).toLocaleDateString()}</span> : <></>}
  //             {/* <span className={"absolute bottom-0 right-0 " }>{ContestStatus[getContestStatus(contest)]}</span> */}
  //           </div>

  //           <div className="flex flex-col col-span-3 justify-center">
  //             {/* <span>Game: {game.name}</span> */}
  //             <span>Prize: {contestMetadata.prize}</span>
  //             <span>Tapes: {contest.n_tapes}</span>
  //             <span title={contestMetadata.winner}>Winner: {contestMetadata.winner? contestMetadata.winner?.substring(0,6)+"..."+contestMetadata.winner?.substring(contestMetadata.winner?.length-4,contestMetadata.winner?.length): "TBA"}</span>
  //             <span>Status: {getContestStatusMessage(status)}</span>
  //           </div>

  //           <div className="flex col-span-1 justify-right items-center">
  //             <Link href={`/play/rule/${contest.id}`} className="btn"
  //               style={{
  //                 pointerEvents: contestIsOpen ? "auto":"none",
  //                 height:"50px"
  //               }}>
  //               PLAY
  //             </Link>
  //           </div>

  //         </div>

  //         {
  //           status != ContestStatus.VALIDATED?
  //             <div className="text-white flex space-x-1 items-center justify-center">
  //               <ReportIcon className="text-yellow-500 text-3xl" />
  //               <span className="text-sm text-center">
  //                 Scores will be available after the contest ends.
  //               </span>
  //               <ReportIcon className="text-yellow-500 text-3xl" />
  //             </div>
  //           :
  //             <></>
  //         }

  //         <div className="flex h-full">
  //           <ContestInfo contest={contest} status={status}></ContestInfo>
  //         </div>
  //       </section>
  //     </main>
  //   )
}
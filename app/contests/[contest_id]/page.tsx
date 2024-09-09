import { cartridgeInfo, rules } from "@/app/backend-libs/core/lib";
import { CartridgeInfo, RuleInfo } from "@/app/backend-libs/core/ifaces";
import { envClient } from "@/app/utils/clientEnv";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContestStatus, getContestStatus } from "../../utils/common";
import CartridgeCard from "@/app/components/CartridgeCard";
import RuleLeaderboard from "@/app/components/RuleLeaderboard";
import { formatTime, getContestDetails, getContestWinner, timeToDateUTCString } from "@/app/utils/util";
import { getUsersByAddress, User } from "@/app/utils/privyApi";
import Image from "next/image";


export const revalidate = 0 // revalidate always

export async function generateMetadata({ params }: { params: { contest_id: string } }) {
  const contest = await getRule(params.contest_id);

  const sharetitle = `${contest?.name} | RIVES`;
  const desc = `Contest "${contest?.name}"`;

  return {
    title: contest?.name,
    openGraph: {
        siteName: 'rives.io',
        title: sharetitle,
        description: desc
    },
    twitter: {
        title: sharetitle,
        card: 'summary',
        creator: '@rives_io',
        description: desc
    },
  }
}

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

const getRule = async(rule_id:string):Promise<RuleInfo|null> => {
  const rulesFound:Array<RuleInfo> = (await rules({id: rule_id, enable_deactivated: true}, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true})).data;

  if (rulesFound.length == 0) return null;

  

  return rulesFound[0];
}

async function getGameInfo(cartridge_id:string) {
  let cartridgeWithInfo:CartridgeInfo = await cartridgeInfo({id:cartridge_id},{decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL});

  if (!cartridgeWithInfo.primary && cartridgeWithInfo.primary_id) {
    cartridgeWithInfo = await cartridgeInfo(
      {id: cartridgeWithInfo.primary_id},
      {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    );
  }

  return cartridgeWithInfo;
}

export default async function Contest({ params }: { params: { contest_id: string } }) {
  const contest_id = params.contest_id;
  let userAddresses:Set<string> = new Set();

  const contest = await getRule(contest_id);
  if (!contest) {
    notFound();
  }

  let contestCreatorUser = null as User|null;
  let contestWinnerUser:User|null = null;
  let contestWinner:string|undefined;
  userAddresses.add(contest.created_by);
  const contestCreatorAddr = contest.created_by.toLowerCase();

  const formatedContestCreator = `${contestCreatorAddr.slice(0, 6)}...${contestCreatorAddr.substring(contestCreatorAddr.length-4,contestCreatorAddr.length)}`;
  const status = getContestStatus(contest);
  const contestIsOpen = status == ContestStatus.IN_PROGRESS;
  const game = await getGameInfo(contest.cartridge_id);
  if (status == ContestStatus.FINISHED) {
    contestWinner = await getContestWinner(contest.cartridge_id,contest_id);
    if (contestWinner) {
      contestWinner = contestWinner.toLowerCase();
      userAddresses.add(contestWinner);
    }
  }

  const userMap:Record<string, User> = JSON.parse(await getUsersByAddress(Array.from(userAddresses)));
  if (contestWinner && userMap[contestWinner]) {
    contestWinnerUser = userMap[contestWinner];
  }

  if (userMap[contestCreatorAddr]) contestCreatorUser = userMap[contestCreatorAddr];

  const contestDetails = await getContestDetails(params.contest_id);
  const contestHasPrizes = contestDetails && (contestDetails.prize || (contestDetails.achievements && contestDetails.achievements.length > 0));

  return (
    <main>
      <section>
        <div className="w-full flex flex-wrap items-center bg-black p-4 gap-2 md:gap-8 lg:gap-20">
          <CartridgeCard cartridge={game} small={true} creator={userMap[game.user_address.toLowerCase()] || null} />

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="pixelated-font text-xl">{contest.name}</span>
              {
                !contestWinner?
                  <></>
                :
                  contestWinnerUser?
                    <span title={contestWinner} className="text-gray-400">
                      Winner: <Link 
                      className="pixelated-font text-rives-purple hover:underline"
                      href={`/profile/${contestWinner}`}>
                        {contestWinnerUser.name}
                      </Link>
                    </span>
                  :
                    <span title={contestWinner} className="text-gray-400">
                      Winner: <Link 
                      className="pixelated-font text-rives-purple hover:underline" 
                      href={`/profile/${contestWinner}`}>
                        {`${contestWinner.slice(0, 6)}...${contestWinner.substring(contestWinner.length-4,contestWinner.length)}`}
                      </Link>
                    </span>
              }

              {
                !contestDetails || !contestDetails.sponsor_name?
                    <></>
                :
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-gray-400 me-2">Sponsor</span>
                        {
                            !(contestDetails.sponsor_image_data || contestDetails.sponsor_image_type)?
                                <></>
                            :
                                <Image
                                src={`data:${contestDetails.sponsor_image_type};base64,${contestDetails.sponsor_image_data}`}
                                width={32}
                                height={32}
                                alt=""
                                />    
                        }
                        <span>{contestDetails.sponsor_name}</span>
                    </div>
                }              

            </div>

            {
              !contestIsOpen?
                <></>
              :
                <Link href={`/play/${contest.id}`}
                className="bg-rives-purple pixelated-font justify-self-end h-fit text-center py-2 w-full md:w-2/3 hover:scale-110"
                >
                  PLAY
                </Link>
            }
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 mt-8">
          <div className="flex flex-col gap-4 lg:col-span-3">
              <div className="flex flex-col">
                <h1 className="pixelated-font text-xl">Overview</h1>

                <div className="grid grid-cols-2">
                  {/* TODO: Get tapes */}
                  {/* <span className="text-gray-400">Submissions</span>
                  <span>{contest.n_tapes}</span> */}

                  <span className="text-gray-400">Status</span>
                  {contestStatusMessage(contest)}

                  <span className="text-gray-400">Start</span>
                  {timeToDateUTCString(contest.created_at)}

                  <span className="text-gray-400">End</span>
                  {contest.end? timeToDateUTCString(contest.end):"-"}

                  <span className="text-gray-400">Contest Creator</span>
                  {
                    contestCreatorUser?
                      <Link className="text-rives-purple hover:underline"
                      title={contest.created_by}
                      href={`/profile/${contest.created_by}`}>
                        {contestCreatorUser.name}
                      </Link>
                    :
                      <Link className="text-rives-purple hover:underline"
                      title={contest.created_by}
                      href={`/profile/${contest.created_by}`}>
                        {formatedContestCreator}
                      </Link>  
                  }

                  {
                    !contestHasPrizes?
                      <></>
                    :
                      <>
                        <span className="text-gray-400">Prizes</span>
                        <div className="flex flex-col">
                          {
                            !contestDetails.prize?
                              <></>
                            :
                              contestDetails.prize
                          }

                          <div className="flex gap-2">
                            {
                              contestDetails.achievements.map((achievement, index) => {
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
                        </div>
                      </>
                  }
                </div>
              </div>

              <div className="flex flex-col">
                <h1 className="pixelated-font text-xl">Description</h1>
                <pre style={{whiteSpace: "pre-wrap", fontFamily: 'Iosevka Web'}}>
                    {contest.description}
                </pre>
              </div>

          </div>

          <div className="flex flex-col gap-4 lg:col-span-4">
            <h1 className="pixelated-font text-xl">Leaderboard</h1>
    
            <RuleLeaderboard cartridge_id={contest.cartridge_id} rule={contest.id} />
          </div>
        </div>
      </section>
    </main>
  );
}
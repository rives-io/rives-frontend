"use client"



import { Dialog, Transition } from '@headlessui/react';
import { PlayerOlympicData, ProfileAchievementAggregated, Raffle, SOCIAL_MEDIA_HASHTAGS } from '../utils/common'
import { Fragment, useEffect, useState } from 'react';
import Image from 'next/image';
import olympicsLogo from "@/public/doom-olympics-logo.png";
import { getProfileAchievementsSummary, getSocialPrizes } from '../utils/util';
import { User } from '../utils/privyApi';
import Link from 'next/link';
import { TwitterIcon, TwitterShareButton } from 'next-share';
import { usePrivy } from '@privy-io/react-auth';

export interface PlayerSummary extends PlayerOlympicData {
  rank:number,
  socialPrizes:Array<Raffle>
}

const prizesMap = {
  contest: [600, 300, 100],
  global: [1000, 500, 300, 50, 15]
}

function OlympicsSummary({player, contests, searchedUser}:
{player:PlayerSummary, contests:Array<{contest_id:string, name:string}>, searchedUser?:{address:string, user?:User}}) {
  const [modalOpen, setModalOpen] = useState(true);
  const {ready, user, linkTwitter} = usePrivy();
  
  const [contestPrizes, setContestPrizes] = useState(0);
  const [userAchievements, setUserAchievements] = useState<Array<ProfileAchievementAggregated>|null|undefined>(undefined);
  const [summaryUrl, setSummaryURL] = useState("");

  useEffect(() => {
    getProfileAchievementsSummary(player.profile_address).then(setUserAchievements);

    let prizeCounter = 0;
    for (let contest_id in player.contests) {
      const contest = player.contests[contest_id];

      if (contest.rank > 3) continue;
      
      prizeCounter = prizeCounter + prizesMap.contest[contest.rank-1];
    }

    if (player.rank <= 3) {
      prizeCounter = prizeCounter + prizesMap.global[player.rank-1];
    } else if (player.rank <= 10) {
      prizeCounter = prizeCounter + prizesMap.global[3];
    } else if (player.rank <= 100) {
      prizeCounter = prizeCounter + prizesMap.global[4];
    }

    setContestPrizes(prizeCounter);

    if (typeof window !== "undefined") {
      if (searchedUser) {
        setSummaryURL(`${window.location.origin}/olympics?user=${searchedUser.address}`);
      } else {
        setSummaryURL(`${window.location.origin}/olympics?user=${player.profile_address}`);
      }
    }
  }, [])

  if (userAchievements == undefined) return <></>;

  return (
    <Transition appear show={modalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10 text-black" onClose={() => setModalOpen(false)}>
          <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
          >
              <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>
  
          <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                      as={Fragment}
                      enter="ease-out duration-300"
                      enterFrom="opacity-0 scale-95"
                      enterTo="opacity-100 scale-100"
                      leave="ease-in duration-200"
                      leaveFrom="opacity-100 scale-100"
                      leaveTo="opacity-0 scale-95"
                  >
                      <Dialog.Panel className="w-[372px] md:w-[720px] h-fit transform bg-[#fefa97] p-4 shadow-xl transition-all grid gap-4">
                          <Dialog.Title as="h1" className="grid gap-2 place-content-center justify-items-center">
                            <Image src={olympicsLogo} width={128} alt="" />
                            {
                              !searchedUser?
                                <span className='pixelated-font text-2xl'>Your Olympics Summary</span>
                              :
                                <div className='flex gap-3'>
                                  {
                                    searchedUser.user? 
                                      <Link href={`/profile/${searchedUser.address}`} className='pixelated-font text-2xl text-rives-purple hover:underline'>
                                        {searchedUser.user.name}
                                      </Link>
                                    : 
                                      <Link href={`/profile/${searchedUser.address}`} className='pixelated-font text-2xl text-rives-purple hover:underline'>
                                        {`${searchedUser.address.substring(0, 6)}...${searchedUser.address.substring(searchedUser.address.length-6)}`}
                                      </Link>
                                  }
                                  <span className='pixelated-font text-2xl'>Olympics Summary</span>
                                </div>
                            }
                            
                          </Dialog.Title>

                          <div className='grid'>
                            <div className='flex border-b-2 border-black'>
                              <span className='p-1 bg-white flex-1 font-bold text-start border-r-2 border-black'>Contest</span>
                              <span className='p-1 bg-rives-purple font-bold text-white w-16'>Rank</span>
                            </div>

                            {
                              contests.map((contest) => {
                                const player_contest = player.contests[contest.contest_id];

                                return (
                                  <div key={contest.contest_id} className='flex'>
                                    <span className='p-1 bg-white flex-1 text-start border-r-2 border-black'>{contest.name}</span>
                                    <span className='p-1 bg-rives-purple text-white w-16'>{player_contest? player_contest.rank:"NA"}</span>
                                  </div>
                                )
                              })
                            }

                            <div className='flex'>
                              <span className='p-1 bg-white flex-1 text-start border-r-2 border-black'>GLOBAL</span>
                              <span className='p-1 bg-green-400 text-white w-16'>{player.rank}</span>
                            </div>
                          </div>

                          <div className='p-2 bg-black text-white grid gap-2 justify-items-center relative'>
                            {
                              !searchedUser && ready && !user?.twitter?
                                <button onClick={linkTwitter}
                                className='absolute top-0 start-0 bg-black bg-opacity-60 h-full w-full z-10 flex justify-center items-center text-xl hover:text-2xl'>
                                  <span className='pixelated-font'>Link Twitter to receive the prizes</span>
                                </button>
                              :
                                <></>
                            }
                            <span className='pixelated-font text-xl'>Prizes</span>

                            <div className='flex flex-wrap gap-2'>
                              {
                                !userAchievements?
                                  <></>
                                :
                                  <>
                                    {
                                      userAchievements.map((userAchievement, index) => {
                                        return (
                                          <Image 
                                          key={`${userAchievement.ca_slug}-${index}`}
                                          src={`data:image/png;base64,${userAchievement.image_data}`}
                                          width={48}
                                          height={48}
                                          alt=""
                                          />
                                        )
                                      })
                                    }
                                  </>
                              }

                            </div>

                            <div className='flex flex-wrap gap-2 items-end justify-center'>
                              {
                                contestPrizes == 0?
                                  <></>
                                :
                                <div className='grid'>
                                  <span className='pixelated-font text-3xl'>${contestPrizes}</span>
                                  <span className='text-xs'>(Contest Prizes)</span>
                                </div>
                              }

                              {
                                  player.socialPrizes.map((prize, index) => {
                                    return (
                                      <div className='grid' key={`${prize.name}-${index}`}>
                                        <span className='pixelated-font text-3xl'>
                                          {
                                            index == 0 && contestPrizes == 0?
                                              `$${prize.prize}`
                                            :
                                              `+$${prize.prize}`
                                          }
                                        </span>
                                        <span className='text-xs'>(${prize.name})</span>
                                      </div>
                                    )
                                  })
                              }
                            </div>
                            <span className='text-gray-400 text-sm'>Paid in CTSI on Ethereum Mainnet</span>
                          </div>

                          <div className='flex gap-4 justify-center'>
                            <Link rel="noopener noreferrer" target="_blank"
                            href={"https://app.deform.cc/form/847452e7-6bf6-4c34-9a63-e489dd065716"}
                            className='p-2 h-fit bg-orange-400 hover:scale-105'>
                              Share Feedback
                            </Link>

                            <TwitterShareButton
                              url={summaryUrl}
                              title={
                                searchedUser?
                                  `Check out ${searchedUser.user? searchedUser.user.name:searchedUser.address} result on @rives_io DOOM Olympics`
                                :
                                  "Check out my result on @rives_io DOOM Olympics"
                              }
                              hashtags={SOCIAL_MEDIA_HASHTAGS}
                              >
                                <div className="p-2 h-fit bg-green-400 hover:scale-105 flex gap-2 items-center">
                                  <span>Share on</span> <TwitterIcon size={24} round />
                                </div>
                                  
                            </TwitterShareButton>
                          </div>

                      </Dialog.Panel>
                  </Transition.Child>
              </div>
          </div>
      </Dialog>
  </Transition>
  )
}

export default OlympicsSummary
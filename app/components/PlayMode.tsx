"use client"


import React, { Fragment, useEffect, useState } from 'react'
import { RuleInfo } from '../backend-libs/core/ifaces'
import { ContestStatus, getContestStatus } from '../utils/common';
import Link from 'next/link';
import { Dialog, Tab, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { formatTime, timeToDateUTCString } from '../utils/util';
import { User } from '@privy-io/react-auth';
import { tapes } from '../backend-libs/core/lib';
import { envClient } from '../utils/clientEnv';



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


function PlayMode({rulesInfo}:{rulesInfo:RuleInfo[]}) {
    const router = useRouter();
    const [modalOpen, setModalOpen] = useState(false);
    const [nTapes, setNTapes] = useState<Record<string,number>>();

    useEffect(() => {
        const getRulesNTapes = async () => {
            let nTapesTmp:Record<string, number> = {};
            let rule:RuleInfo;
            for (let i = 0; i < rulesInfo.length; i++) {
                rule = rulesInfo[i];
                const tapeOut = await tapes(
                    {rule_id:rule.id, page:1, page_size:0}, 
                    {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}
                );
                if (tapeOut) nTapesTmp[rule.id.toLowerCase()] = tapeOut.total;
            }

            return nTapesTmp;
        }

        getRulesNTapes().then(setNTapes);
    }, []);

    function handle_play_click() {
        if (rulesInfo.length == 1) {
            router.push(`/play/${rulesInfo[0].id}`);
        } else {
            setModalOpen(true);
        }
    }

    return (
        <>
            <Transition appear show={modalOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={() => setModalOpen(false)}>
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
                                    <Dialog.Panel className="w-[720px] h-[360px] transform bg-gray-500 p-4 shadow-xl transition-all flex flex-col items-center">
                                        <Dialog.Title as="h1" className="text-2xl font-medium mb-4 text-gray-900 pixelated-font">
                                            Select a play mode
                                        </Dialog.Title>
                            
                                        <Tab.Group>
                                            <div className='w-full h-full grid grid-cols-4 gap-2'>
                                                <Tab.List className="flex flex-col gap-2">
                                                    {
                                                        rulesInfo.map((rule, index) => {
                                                            return (
                                                                <Tab
                                                                key={rule.id}
                                                                className={({selected}) => {return selected? "tab-navigation-item-selected":"tab-navigation-item"}}
                                                                >
                                                                    <span className='text-xl text-left pixelated-font'>{rule.name}</span>
                                                                </Tab>                                                                
                                                            )
                                                        })
                                                    }
                                                </Tab.List>

                                                <Tab.Panels className="col-span-3 bg-black text-white">
                                                    {
                                                        rulesInfo.map((rule, index) => {
                                                            const status = getContestStatus(rule);
                                                            const isContest = rule.start && rule.end;
                                                            const contestIsOpen = !isContest || (status == ContestStatus.IN_PROGRESS || status == ContestStatus.INVALID);

                                                            const contestCreatorAddr = rule.created_by.toLowerCase();
                                                            const formatedContestCreator = `${contestCreatorAddr.slice(0, 6)}...${contestCreatorAddr.substring(contestCreatorAddr.length-4,contestCreatorAddr.length)}`;
                                                            let contestCreatorUser = null as User|null;
                                                          
                                                        
                                                            return (
                                                                <Tab.Panel key={rule.id} className="h-full flex flex-1 flex-col justify-between">
                                                                    {/* <RuleLeaderboard cartridge_id={cartridge.id} rule={selectedRule?.id} /> */}
                                                                    {
                                                                        rule.name.toLowerCase() == "default"?
                                                                            <span className='pixelated-font text-left p-2'>
                                                                                This is the standard play mode of the cartridge.
                                                                            </span>
                                                                        :
                                                                            <div className="flex flex-col p-2 text-left h-[224px] overflow-y-scroll">
                                                                                <div className="flex flex-col">
                                                                                    <h1 className="pixelated-font text-lg">Overview</h1>

                                                                                    <div className="grid grid-cols-2">
                                                                                        {/* TODO: Get tapes */}
                                                                                        <span className="text-gray-400">Submissions</span>
                                                                                        <span>{nTapes? nTapes[rule.id.toLowerCase()]:"-"}</span>

                                                                                        {
                                                                                            !isContest?
                                                                                                <></>
                                                                                            :
                                                                                                <>
                                                                                                    <span className="text-gray-400">Status</span>
                                                                                                    {contestStatusMessage(rule)}
                                                                                                </>
                                                                                        }

                                                                                        <span className="text-gray-400">Start</span>
                                                                                        {timeToDateUTCString(rule.created_at)}

                                                                                        <span className="text-gray-400">End</span>
                                                                                        {rule.end? timeToDateUTCString(rule.end):"-"}

                                                                                        <span className="text-gray-400">Contest Creator</span>
                                                                                        {
                                                                                            contestCreatorUser?
                                                                                            <Link className="text-rives-purple hover:underline"
                                                                                            title={rule.created_by}
                                                                                            href={`/profile/${rule.created_by}`}>
                                                                                                {rule.name}
                                                                                            </Link>
                                                                                            :
                                                                                            <Link className="text-rives-purple hover:underline"
                                                                                            title={rule.created_by}
                                                                                            href={`/profile/${rule.created_by}`}>
                                                                                                {formatedContestCreator}
                                                                                            </Link>  
                                                                                        }

                                                                                        {/* {
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
                                                                                        } */}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex flex-col">
                                                                                    <h1 className="pixelated-font text-lg">Description</h1>
                                                                                    <pre style={{whiteSpace: "pre-wrap", fontFamily: 'Iosevka Web'}}>
                                                                                        {rule.description}
                                                                                        {rule.description}{rule.description}{rule.description}{rule.description}{rule.description}
                                                                                    </pre>
                                                                                </div>

                                                                            </div>
                                                                            
                                                                    }

                                                                    <div className='bg-gray-500 h-fit flex justify-center'>
                                                                        <Link aria-disabled={!contestIsOpen} tabIndex={!contestIsOpen? -1:undefined} 
                                                                        href={`/play/${rule.id}`}
                                                                        className={`${!contestIsOpen? "pointer-events-none bg-slate-600" : "bg-rives-purple"} mt-2 p-3 hover:scale-110 pixelated-font`}>
                                                                            Select
                                                                        </Link>
                                                                    </div>
                                                                </Tab.Panel>
                                                            )
                                                        })
                                                    }
                                                </Tab.Panels>

                                            </div>
                                        </Tab.Group>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            
            <button  onClick={handle_play_click}
            className={`bg-rives-purple p-3 hover:scale-110 pixelated-font`}>
                Play
            </button>
        </>
    )
}

export default PlayMode
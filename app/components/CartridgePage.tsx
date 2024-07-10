"use client"


import { CartridgeInfo as Cartridge, RuleInfo } from '../backend-libs/core/ifaces';
import Image from "next/image";
import { Menu, Tab } from '@headlessui/react';
import { useState } from 'react';
import Link from 'next/link';
import RuleLeaderboard from './RuleLeaderboard';
import { ContestStatus, getContestStatus } from '../utils/common';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CartridgeContests from './CartridgeContests';
import CartridgeTapes from './CartridgeTapes';
import CartridgeAssetManager from './CartridgeAssetManager';
import CartridgeStats from './CartridgeStats';

export default function CartridgePage({cartridge, rulesInfo}:{cartridge:Cartridge, rulesInfo:RuleInfo[]}) {
    const [selectedRule, setSelectedRule] = useState<RuleInfo|null>(rulesInfo.length > 0? rulesInfo[0]:null);

    const status = !selectedRule? null:getContestStatus(selectedRule);
    const contestIsOpen = (status == ContestStatus.IN_PROGRESS || status == ContestStatus.INVALID);

    const [reload, setReload] = useState(0);

    return (
        <main className="w-full flex flex-col items-center gap-8 px-4 md:px-0">
            <div className='cartridgePageCover flex justify-center relative'>
                <Image fill style={{objectFit: "contain"}} quality={100} src={"data:image/png;base64,"+cartridge.cover} alt={"Not found"} />
            </div>

            <div className='w-full md:w-2/3 flex flex-col gap-2'>
                <div className='flex flex-wrap gap-4'>
                    <div className='flex flex-col'>
                        <h1 className={`pixelated-font text-5xl`}>{cartridge.name}</h1>
                        <div>
                            <span className='pixelated-font me-2'>By:</span>
                            <Link href={`/profile/${cartridge.user_address}`}
                            className='hover:underline text-rives-purple pixelated-font break-all'
                            >
                                {cartridge.user_address}
                            </Link>
                        </div>
                    </div>

                    {/* <div className='justify-center md:justify-end flex-1 self-center text-black flex gap-2'>
                        <button className='bg-[#e04ec3] p-2 text-center font-bold w-32 h-10 hover:scale-105'>
                            ${0.09} Sell
                        </button>

                        <button className='bg-[#53fcd8] p-2 text-center font-bold w-32 h-10 hover:scale-105'>
                            ${0.1} Buy
                        </button>
                    </div> */}
                    <CartridgeAssetManager cartridge_id={cartridge.id} onChange={() => setReload(reload+1)}/>
                </div>
                <CartridgeStats cartridge_id={cartridge.id} reload={reload}/>
            </div>


            <div className='w-full md:w-2/3 flex flex-col'>
                <h2 className={`pixelated-font text-3xl`}>Description</h2>
                <pre style={{whiteSpace: "pre-wrap", fontFamily: 'Iosevka Web'}}>
                    {cartridge.info?.description}
                </pre>
            </div>

            <div className='w-full md:w-2/3 flex flex-col gap-2'>
                <h2 className={`pixelated-font text-3xl`}>Play Mode</h2>
                <div className='flex gap-4 justify-center md:justify-start'>
                    <Menu as="div" className="p-3 bg-rives-gray">
                        <Menu.Button className="flex justify-center hover:text-rives-purple pixelated-font">
                            {selectedRule?.name} <ArrowDropDownIcon/>
                        </Menu.Button>
                        <Menu.Items className="absolute z-10 h-48 mt-2 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                            
                            {
                                rulesInfo?.map((ruleInfo, index) => {
                                    return (
                                        <div key={index} className="px-1 py-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button 
                                                    onClick={() => setSelectedRule(ruleInfo)}
                                                    className={`${active? 'bg-rives-purple text-white' : 'text-black' } group flex w-full items-center rounded-md px-2 py-2 text-sm pixelated-font`}>
                                                        {ruleInfo.name}
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </div>    
                                    )
                                })
                            }
                        </Menu.Items>
                    </Menu>

                    <Link aria-disabled={!selectedRule || !contestIsOpen} tabIndex={!selectedRule || !contestIsOpen? -1:undefined} 
                    href={`/play/rule/${selectedRule?.id}`} 
                    className={`${!selectedRule || !contestIsOpen? "pointer-events-none bg-slate-600" : "bg-rives-purple"} p-3 hover:scale-110 pixelated-font`}>
                        Play
                    </Link>
                    
                </div>

                <div>
                    <Tab.Group>
                        <Tab.List className="grid grid-cols-2 gap-2">
                            <Tab
                                className={({selected}) => {return selected?"tab-navigation-item-selected":"tab-navigation-item"}}
                                >
                                    <span className='text-xl pixelated-font'>Leaderboard</span>
                            </Tab>

                            <Tab
                                className={({selected}) => {return selected?"tab-navigation-item-selected":"tab-navigation-item"}}
                                >
                                    <span className='text-xl pixelated-font hover:underline'>Tapes</span>
                            </Tab>
                        </Tab.List>

                        <Tab.Panels className="mt-2 overflow-auto custom-scrollbar">
                            <Tab.Panel className="">
                                <RuleLeaderboard cartridge_id={cartridge.id} rule={selectedRule?.id}
                                get_verification_outputs={selectedRule != undefined && [ContestStatus.INVALID,ContestStatus.VALIDATED].indexOf(getContestStatus(selectedRule)) > -1}
                                />
                            </Tab.Panel>

                            <Tab.Panel className="">
                                <CartridgeTapes cartridgeId={cartridge.id} ruleId={selectedRule?.id} />
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>
            </div>

            <div className='w-full grid grid-cols-1 md:w-2/3 '>
                <div>
                    <Tab.Group>
                        <Tab.List className="grid grid-cols-1 place-content-center gap-2">
                            {/* <Tab
                                className={({selected}) => {return selected?"tab-navigation-item-selected":"tab-navigation-item"}}
                                >
                                    <span className='text-xl pixelated-font'>Activity</span>
                            </Tab> */}

                            <Tab
                                className={({selected}) => {return selected?"tab-navigation-item-selected h-[60px]":"tab-navigation-item"}}
                                >
                                    <span className='text-xl pixelated-font'>Contests</span>
                            </Tab>
                        </Tab.List>

                        <Tab.Panels className="mt-2 overflow-auto custom-scrollbar">
                            {/* <Tab.Panel className="">
                                Show Activities
                            </Tab.Panel> */}

                            <Tab.Panel className="">
                                <CartridgeContests cartridgeId={cartridge.id} cartridge={cartridge} />
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>
            </div>
        </main>
    );
}
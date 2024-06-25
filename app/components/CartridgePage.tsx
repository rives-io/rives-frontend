"use client"


import { CartridgeInfo as Cartridge, GetRulesPayload, RuleInfo } from '../backend-libs/core/ifaces';
import { rules } from '../backend-libs/core/lib';
import Image from "next/image";
import { monogram } from '../utils/monogramExtendedFont';
import { Menu, Tab } from '@headlessui/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { envClient } from '../utils/clientEnv';
import RuleLeaderboard from './RuleLeaderboard';
import { ContestStatus, getContestStatus } from '../utils/common';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

export default function CartridgePage({cartridge}:{cartridge:Cartridge}) {
    const [rulesInfo, setRulesInfo] = useState<RuleInfo[]>();
    const [selectedRule, setSelectedRule] = useState<RuleInfo>();

    useEffect(() => {
        const inputPayload: GetRulesPayload = {
            cartridge_id: cartridge.id
        };
        rules(inputPayload, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}).then((rules) => {
            setRulesInfo(rules.data);
            if (rules.data.length > 0) setSelectedRule(rules.data[0]);
        });
    }, [])


    return (
        <main className="w-full flex flex-col items-center gap-8 px-4 md:px-0">
            <div className='cartridgePageCover flex justify-center relative'>
                <Image fill style={{objectFit: "contain"}} quality={100} src={"data:image/png;base64,"+cartridge.cover} alt={"Not found"} />
            </div>

            <div className='w-full md:w-2/3 flex flex-col gap-2'>
                <div className='flex flex-wrap gap-4'>
                    <div className='flex flex-col'>
                        <h1 className={`pixelated-font text-5xl`}>{cartridge.name}</h1>
                        <span>{cartridge.authors.length>0?cartridge.authors[0]:""}</span>
                    </div>

                    <div className='justify-center md:justify-end flex-1 self-center text-black flex gap-2'>
                        <button className='bg-[#e04ec3] p-2 text-center font-bold w-32 h-10 hover:scale-105'>
                            ${0.09} Sell
                        </button>

                        <button className='bg-[#53fcd8] p-2 text-center font-bold w-32 h-10 hover:scale-105'>
                            ${0.1} Buy
                        </button>
                    </div>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 text-center gap-2'>
                    <div className='p-4 flex flex-col bg-rives-gray'>
                        <span>Total Cartridges</span>
                        <span className='mt-auto'>1.1k</span>
                    </div>

                    <div className='p-4 flex flex-col bg-rives-gray'>
                        <span>Tapes Created</span>
                        <span className='mt-auto'>10k</span>
                    </div>

                    <div className='p-4 flex flex-col bg-rives-gray'>
                        <span>Marketcap</span>
                        <span className='mt-auto'>USD 5k</span>
                    </div>

                    <div className='p-4 flex flex-col bg-rives-gray'>
                        <span>Total Owners</span>
                        <span className='mt-auto'>100</span>
                    </div>
                </div>
            </div>


            <div className='w-full md:w-2/3 flex flex-col'>
                <h1 className={`pixelated-font text-5xl`}>Description</h1>
                <pre style={{whiteSpace: "pre-wrap"}}>
                    {cartridge.info?.description}
                </pre>
            </div>

            <div className='w-full md:w-2/3 flex flex-col gap-2'>
                <div className='flex gap-4 justify-center md:justify-start'>
                    <Menu as="div" className="p-3 bg-rives-gray">
                        <Menu.Button className="flex justify-center hover:text-rives-purple">
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
                                                    className={`${active? 'bg-rives-purple text-white' : 'text-black' } group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
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

                    <Link aria-disabled={!selectedRule} tabIndex={!selectedRule? -1:undefined} 
                    href={`play/rule/${selectedRule?.id}`} 
                    className={`${!selectedRule? "pointer-events-none" : ""} p-3 bg-rives-purple hover:scale-110`}>
                        Play
                    </Link>
                    
                </div>

                <div>
                    <Tab.Group>
                        <Tab.List className="grid grid-cols-2">
                            <Tab
                                className={({selected}) => {return selected?"underline":""}}
                                >
                                    <span className='hover:underline'>Leaderboard</span>
                            </Tab>

                            <Tab
                                className={({selected}) => {return selected?"underline":""}}
                                >
                                    <span className='hover:underline'>Tapes</span>
                            </Tab>
                        </Tab.List>

                        <Tab.Panels className="mt-2 overflow-auto custom-scrollbar">
                            <Tab.Panel className="">
                                <RuleLeaderboard cartridge_id={cartridge.id} rule={selectedRule?.id}
                                get_verification_outputs={selectedRule != undefined && [ContestStatus.INVALID,ContestStatus.VALIDATED].indexOf(getContestStatus(selectedRule)) > -1}
                                />
                            </Tab.Panel>

                            <Tab.Panel className="">
                                Show Tapes
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>                    
                </div>
            </div>

            <div className='w-full grid grid-cols-1 md:w-2/3 '>
                <div>
                    <Tab.Group>
                        <Tab.List className="grid grid-cols-2 place-content-center">
                            <Tab
                                className={({selected}) => {return selected?"underline":""}}
                                >
                                    <span className='hover:underline'>Activity</span>
                            </Tab>

                            <Tab
                                className={({selected}) => {return selected?"underline":""}}
                                >
                                    <span className='hover:underline'>Contests</span>
                            </Tab>
                        </Tab.List>

                        <Tab.Panels className="mt-2 overflow-auto custom-scrollbar">
                            <Tab.Panel className="">
                                Show Activities
                            </Tab.Panel>

                            <Tab.Panel className="">
                                Show Contests
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>
            </div>
        </main>
    );
}
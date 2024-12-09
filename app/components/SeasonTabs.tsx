"use client"

import React from 'react'
import { Tab } from "@headlessui/react";
import SeasonLeaderboard from './SeasonLeaderboard';
import { OlympicData } from '../utils/common';
import { User } from '../utils/privyApi';

function SeasonTabs({data, addressUsersMap}:{data:OlympicData, addressUsersMap:Record<string, User>}) {
  return (
    <Tab.Group>
        <Tab.List className="grid grid-cols-2 lg:flex lg:flex-wrap gap-4">
            <Tab
                className={({selected}) => {return selected?"tab-navigation-item-selected grow":"tab-navigation-item grow"}}
                >
                    <span>Global Leaderboard</span>
            </Tab>

            <Tab
                className={({selected}) => {return selected?"tab-navigation-item-selected grow":"tab-navigation-item grow"}}
                >
                    <span>Prizes</span>
            </Tab>
        </Tab.List>

        <Tab.Panels className="mt-2 overflow-visible">
            <Tab.Panel className="flex flex-col gap-4">
                <SeasonLeaderboard data={data} addressUsersMap={addressUsersMap}/>
            </Tab.Panel>

            <Tab.Panel className="">
            </Tab.Panel>
        </Tab.Panels>
    </Tab.Group>  
  )
}

export default SeasonTabs
"use client"


import { Tab } from "@headlessui/react";
import UserTapes from "./UserTapes";
import UserContests from "./UserContests";
import UserCartridges from "./UserCartridges";
import { User } from "../utils/privyApi";


export default function ProfileNavigation({address, twitterInfo}:{address:string, twitterInfo:User}) {

    return (
        <Tab.Group>
            <Tab.List className="grid grid-cols-2 lg:flex lg:flex-wrap gap-4">
                {/* <Tab
                    className={({selected}) => {return selected?"tab-navigation-item-selected":"tab-navigation-item"}}
                    >
                        <span>Activity</span>
                </Tab> */}

                <Tab
                    className={({selected}) => {return selected?"tab-navigation-item-selected grow":"tab-navigation-item grow"}}
                    >
                        <span>Tapes</span>
                </Tab>

                <Tab
                    className={({selected}) => {return selected?"tab-navigation-item-selected grow":"tab-navigation-item grow"}}
                    >
                        <span>Cartridges</span>
                </Tab>

                <Tab
                    className={({selected}) => {return selected?"tab-navigation-item-selected grow":"tab-navigation-item grow"}}
                    >
                        <span>Contests</span>
                </Tab>
            </Tab.List>

            <Tab.Panels className="mt-2 overflow-visible">
                {/* <Tab.Panel className="">
                    Show User's Activity
                </Tab.Panel> */}

                <Tab.Panel className="flex flex-col gap-4">
                    <UserTapes address={address} twitterInfo={twitterInfo} />
                </Tab.Panel>

                <Tab.Panel className="">
                    <UserCartridges address={address} twitterInfo={twitterInfo} />
                </Tab.Panel>

                <Tab.Panel className="">
                    <UserContests address={address} />
                </Tab.Panel>
            </Tab.Panels>
        </Tab.Group>   
    )
}
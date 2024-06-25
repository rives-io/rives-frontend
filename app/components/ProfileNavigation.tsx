"use client"


import { Tab } from "@headlessui/react";
import UserTapes from "./UserTapes";


export default function ProfileNavigation({address}:{address:string}) {

    return (
        <Tab.Group>
            <Tab.List className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Tab
                    className={({selected}) => {return selected?"profile-navigation-item-selected":"profile-navigation-item"}}
                    >
                        <span>Activity</span>
                </Tab>

                <Tab
                    className={({selected}) => {return selected?"profile-navigation-item-selected":"profile-navigation-item"}}
                    >
                        <span>Cartridges</span>
                </Tab>

                <Tab
                    className={({selected}) => {return selected?"profile-navigation-item-selected":"profile-navigation-item"}}
                    >
                        <span>Tapes</span>
                </Tab>

                <Tab
                    className={({selected}) => {return selected?"profile-navigation-item-selected":"profile-navigation-item"}}
                    >
                        <span>Contests</span>
                </Tab>
            </Tab.List>

            <Tab.Panels className="mt-2 overflow-auto custom-scrollbar">
                <Tab.Panel className="">
                    Show User's Activity
                </Tab.Panel>

                <Tab.Panel className="">
                    Show User's Cartridges
                </Tab.Panel>

                <Tab.Panel className="flex flex-col gap-4">
                    <UserTapes address={address} />
                </Tab.Panel>

                <Tab.Panel className="">
                    Show User's Contests
                </Tab.Panel>
            </Tab.Panels>
        </Tab.Group>   
    )
}
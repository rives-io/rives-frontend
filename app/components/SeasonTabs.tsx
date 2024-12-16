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
                    <span className='pixelated-font'>Global Leaderboard</span>
            </Tab>

            <Tab
                className={({selected}) => {return selected?"tab-navigation-item-selected grow":"tab-navigation-item grow"}}
                >
                    <span className='pixelated-font'>Prizes</span>
            </Tab>
        </Tab.List>

        <Tab.Panels className="mt-2 overflow-visible">
            <Tab.Panel className="flex flex-col gap-4">
                <SeasonLeaderboard data={data} addressUsersMap={addressUsersMap}/>
            </Tab.Panel>

            <Tab.Panel className="flex justify-center">
                <div className='grid justify-items-center gap-2'>
                    <p className='pixelated-font'>
                        Prizes will be paid out in CTSI on ETH mainnet according to the table below and Global Leaderboard rank.
                    </p>

                    <table className='w-full max-w-96'>
                        <thead>
                            <tr className='bg-black'>
                                <th className='pixelated-font'>
                                    Rank
                                </th>

                                <th className='grid'>
                                    <span className='pixelated-font'>Prize in USD</span>
                                    <span className='pixelated-font text-xs'>(Paid in CTSI)</span>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">1</td>
                                <td className="pixelated-font">320</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">2</td>
                                <td className="pixelated-font">255</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">3</td>
                                <td className="pixelated-font">205</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">4</td>
                                <td className="pixelated-font">165</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">5</td>
                                <td className="pixelated-font">135</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">6</td>
                                <td className="pixelated-font">105</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">7</td>
                                <td className="pixelated-font">85</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">8</td>
                                <td className="pixelated-font">70</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">9</td>
                                <td className="pixelated-font">60</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">10</td>
                                <td className="pixelated-font">50</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">11</td>
                                <td className="pixelated-font">40</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">12</td>
                                <td className="pixelated-font">35</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">13</td>
                                <td className="pixelated-font">30</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">14</td>
                                <td className="pixelated-font">25</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">15-17</td>
                                <td className="pixelated-font">20</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">18-21</td>
                                <td className="pixelated-font">15</td>
                            </tr>

                            <tr className='text-center hover:bg-rives-purple'>
                                <td className="pixelated-font">22-100</td>
                                <td className="pixelated-font">10</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Tab.Panel>
        </Tab.Panels>
    </Tab.Group>  
  )
}

export default SeasonTabs
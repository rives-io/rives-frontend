import React from 'react'
import { getOlympicsData } from '../utils/util'
import Link from 'next/link';
import Image from 'next/image';
import rivesCheck from "@/public/default_profile.png";
import { getUsersByAddress, User } from '../utils/privyApi';
import Accordion from '../components/Accordion';
import OlympicsBanner from '../components/OlympicsBanner';

export const revalidate = 0 // revalidate data always

async function OlympicsPage() {
    const data = await getOlympicsData("");
    const accordionItems = [
        {
            title: "Prizes",
            content: 
`All Prizes will be distributed in CTSI on Ethereum after the olympics.

Prize Structure:
    Contests - $7000 total, per contest:
        1: $600
        2: $300
        3: $100 
    Global Leaderboard - $3500
        1: $1000
        2: $500
        3: $300
        4-10: $50
        10-100: $15
    RIVES achievement collectors: $3000 - 100 winners chosen in Raffle, each achievement counts as 1 raffle entry. See all available achievements on profile page
    JokeRace: $500 - Submit and vote for the best tape
    Signup referral: $250 - Raffled to 5 people (each referral 1 entry)
    Galxe Quest: $750 - See Galxe for details`
        },
        {
            title: "How to participate?",
            content: 
`Connect wallet, make sure to have some ETH on Base to pay for gas
Link Twitter/Discord account! To qualify for prize distribution
    Your social account needs to be over 1 year old to be eligible for prizes
Play each contest on the contest page (1 per day) and submit your gameplay for verification to enter the specific contest`
        }
    ];

    if (!data) {
        return (
            <main className="flex items-center justify-center h-lvh">
                <span className={`text-4xl text-white pixelated-font` }>No Olympics data!</span>
            </main>
        );
    }

    let addresses:Array<string> = [];
    for (let i = 0; i < data.leaderboard.length; i++) {
        const item = data.leaderboard[i];
        addresses.push(item.profile_address);
    }

    const addressUsersMap:Record<string, User> = JSON.parse(await getUsersByAddress(addresses));

    return (
        <main>
            <section className='hidden xl:grid gap-4 items-center overflow-auto'>
                <OlympicsBanner summary={true} />
                <Accordion items={accordionItems}/>

                <div className='w-full'>
                    <h1 className='text-5xl pixelated-font'>Olympics Leaderboard</h1>

                    <table className="text-left w-full max-h-[580px]">
                        <thead className="text-xsuppercase sticky top-0 w-full min-h-fit h-12">
                            <tr className='bg-black'>
                                <th scope="col" className='px-2'>
                                    <span className="pixelated-font">
                                        Rank
                                    </span>
                                </th>
                                <th scope="col" className='px-2'>
                                    <span className="pixelated-font">
                                        Player
                                    </span>
                                </th>

                                {
                                    data.contests.map((contest, index) => {
                                        return (
                                            <th key={contest.name} scope="col" className='px-2'>
                                                <Link href={`/contests/${contest.contest_id}`} 
                                                className='flex items-center gap-2 pixelated-font hover:text-rives-purple'>
                                                    {contest.name}
                                                </Link>
                                            </th>
                                        )
                                    })
                                }
                                <th scope="col" className="pixelated-font px-2">
                                    Global
                                </th>
                            </tr>
                        </thead>

                        <tbody className='text-xs'>
                            {
                                data.leaderboard.map((player, index) => {
                                    const playerKey = `player-${index}`;
                                    const user = addressUsersMap[player.profile_address.toLowerCase()];

                                    return (
                                        <tr key={player.profile_address}>
                                            <td className='pixelated-font px-2 text-center'>
                                                {index+1}
                                            </td>

                                            <td className='px-2'>
                                                <Link href={`/profile/${player.profile_address}`} className='flex items-center gap-2 hover:text-rives-purple'>
                                                    {
                                                        !user?
                                                            <>
                                                                <Image width={48} height={48} src={rivesCheck} className='rounded-full pixelated-img' alt='' />
                                                                <span className=' pixelated-font' title={player.profile_address}>
                                                                    {player.profile_address.substring(0,6)+"..."+player.profile_address.substring(player.profile_address.length-4,player.profile_address.length)}
                                                                </span>
                                                            </>
                                                        :
                                                            <>
                                                                <img width={48} height={48} src={user.picture_url} className='rounded-full pixelated-img' alt='' />
                                                                <span className=' pixelated-font' title={player.profile_address}>
                                                                    {user.name}
                                                                </span>
                                                            </>
        
                                                    }
                                                </Link>
                                            </td>

                                            {
                                                data.contests.map((contest, index) => {
                                                    const player_contest = player.contests[contest.contest_id];

                                                    if (!player_contest) {
                                                        return (
                                                            <td key={`${playerKey}-${contest.contest_id}`} className='pixelated-font px-2 text-center'>
                                                                -
                                                            </td>
                                                        )
                                                    }

                                                    return (
                                                        <td key={`${playerKey}-${contest.contest_id}`} className='px-2'>
                                                            <Link href={`/tapes/${player_contest.tape_id}`} className='flex items-center justify-center gap-2 hover:text-rives-purple'>
                                                                <span className='break-all pixelated-font' title={`score: ${player_contest.score}`}>
                                                                    {player_contest.rank} ({player_contest.points} points)
                                                                </span>
                                                            </Link>
                                                        </td>
                                                    )
                                                })
                                            }

                                            <td className='pixelated-font px-2 text-center'>
                                                {player.total_points}
                                            </td>
                                        </tr>
                                    )
                                    
                                })
                            }
                        </tbody>
                    </table>

                </div>
            </section>

            <section className='xl:hidden grid gap-4 items-center'>
                <OlympicsBanner summary={true} />
                <Accordion items={accordionItems}/>

                <div className='w-full'>
                    <h1 className='text-xl sm:text-2xl md:text-4xl lg:text-5xl pixelated-font'>Olympics Leaderboard</h1>
                    <table className='w-full'>
                        <thead className="text-xsuppercase sticky top-0 w-full min-h-fit h-12">
                            <tr className='bg-black'>
                                <th scope="col" className='px-2'>
                                    <span className="pixelated-font">
                                        Rank
                                    </span>
                                </th>

                                <th scope="col" className='px-2'>
                                    <span className="pixelated-font">
                                        Player
                                    </span>
                                </th>

                                <th scope="col" className='px-2'>
                                    <span className="pixelated-font">
                                        Contests
                                    </span>
                                </th>

                                <th scope="col" className='px-2'>
                                    <span className="pixelated-font">
                                        Global
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                data.leaderboard.map((player, index) => {
                                    const user = addressUsersMap[player.profile_address.toLowerCase()];
                                    const playerKey = `player-${index}`;

                                    return (
                                        <tr key={player.profile_address} className='border-b'>
                                            <th className='pixelated-font px-2 text-center border-r'>
                                                {index+1}
                                            </th>

                                            <td className='px-2 border-r'>
                                                <Link href={`/profile/${player.profile_address}`} className='flex items-center gap-2 hover:text-rives-purple'>
                                                    {
                                                        !user?
                                                            <>
                                                                <Image width={48} height={48} src={rivesCheck} className='rounded-full pixelated-img' alt='' />
                                                                <span className=' pixelated-font' title={player.profile_address}>
                                                                    {player.profile_address.substring(0,6)+"..."+player.profile_address.substring(player.profile_address.length-4,player.profile_address.length)}
                                                                </span>
                                                            </>
                                                        :
                                                            <>
                                                                <img width={48} height={48} src={user.picture_url} className='rounded-full pixelated-img' alt='' />
                                                                <span className=' pixelated-font' title={player.profile_address}>
                                                                    {user.name}
                                                                </span>
                                                            </>

                                                    }
                                                </Link>
                                            </td>

                                            <td className='flex flex-col items-start border-r'>
                                                {
                                                    data.contests.map((contest, index) => {
                                                        const player_contest = player.contests[contest.contest_id];
                                                        const player_contest_key = `${playerKey}-${contest.contest_id}`;

                                                        if (!player_contest) {
                                                            return (
                                                                <div key={player_contest_key} className='px-2 grid grid-cols-2 w-full'>
                                                                    <div className='text-xs md:text-sm hidden sm:block'>
                                                                        <span className='pixelated-font line-clamp-1'>{contest.name}:</span>    
                                                                    </div>
                                                                    <span className='pixelated-font text-xs md:text-sm place-self-center sm:place-self-end col-span-2 sm:col-span-1'>-</span>
                                                                </div>
                                                            )
                                                        }

                                                        return (
                                                            <div key={player_contest_key} className='px-2 w-full'>
                                                                <Link href={`/tapes/${player_contest.tape_id}`} 
                                                                className='hover:text-rives-purple grid grid-cols-2 gap-2'>
                                                                    <div className='text-xs md:text-sm hidden sm:block'>
                                                                        <span 
                                                                        className='pixelated-font line-clamp-1' title={`score: ${player_contest.score}`}>
                                                                            {contest.name}:
                                                                        </span>
                                                                    </div>

                                                                    <span className='pixelated-font text-xs md:text-sm place-self-center sm:place-self-end col-span-2 sm:col-span-1'>
                                                                        {player_contest.rank} ({player_contest.points} points)
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                        )
                                                    })
                                                }

                                            </td>

                                            <td className='pixelated-font px-2 text-center'>
                                                {player.total_points}
                                            </td>
                                        </tr>
                                    )
                                    
                                })
                            }

                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    )
}

export default OlympicsPage
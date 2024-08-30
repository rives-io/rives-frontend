import React from 'react'
import { getOlympicsData } from '../utils/util'
import Link from 'next/link';
import Image from 'next/image';
import rivesCheck from "@/public/default_profile.png";
import { getUsersByAddress, User } from '../utils/privyApi';

export const revalidate = 0 // revalidate data always

async function OlympicsPage() {
    const data = await getOlympicsData("");

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
            <section className='hidden xl:flex justify-center overflow-auto'>
                <table className="text-left border-black block max-h-[580px]">
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
            </section>

            <section className='xl:hidden flex justify-center'>
    
                <table>
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
                                                                <span className='pixelated-font'>{contest.name}:</span>
                                                                <span className='pixelated-font place-self-end'>-</span>
                                                            </div>
                                                        )
                                                    }

                                                    return (
                                                        <div key={player_contest_key} className='px-2 w-full'>
                                                            <Link href={`/tapes/${player_contest.tape_id}`} 
                                                            className='hover:text-rives-purple grid grid-cols-2 gap-2'>
                                                                <span className='pixelated-font' title={`score: ${player_contest.score}`}>
                                                                    {contest.name}:
                                                                </span>

                                                                <span className='pixelated-font place-self-end'>
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

            </section>
        </main>
    )
}

export default OlympicsPage
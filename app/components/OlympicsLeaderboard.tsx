"use client"


import { OlympicData, PlayerOlympicData, Raffle, RaffleData } from '../utils/common';
import Link from 'next/link';
import Image from 'next/image';
import { User } from '../utils/privyApi';
import rivesCheck from "@/public/default_profile.png";
import { usePrivy } from '@privy-io/react-auth';
import Loading from './Loading';
import { useEffect, useState } from 'react';
import OlympicsSummary, { PlayerSummary } from './OlympicsSummary';


const OLYMPICS_END = 1726842600000; // Sep/20/2024, 14:30:00 UTC


function OlympicsLeaderboard({data, socialPrizesData, addressUsersMap, searchedUser}:
{data:OlympicData, socialPrizesData:RaffleData|null, addressUsersMap:Record<string, User>, searchedUser?:{address:string, user?:User}}) {
    const {ready, authenticated, user} = usePrivy();
    const [currUser, setCurrUser] = useState<PlayerSummary | null | undefined>();
    const [searchedUserSummary, setSearchedUserSummary] = useState<PlayerSummary | null | undefined>();

    function olympicsSummary() {
        if (new Date().getTime() < OLYMPICS_END) return <></>;

        return (
            <div className='flex-1 flex gap-2 justify-end'>
                {
                    currUser?
                        <>
                            {
                                !searchedUserSummary? // curUser and !searchedUser
                                    <OlympicsSummary player={currUser} contests={data.contests} openOnLoad={true} />
                                : // curUser and searchedUser
                                    <>
                                        <OlympicsSummary player={currUser} contests={data.contests} openOnLoad={false} />
                                        <OlympicsSummary player={searchedUserSummary} contests={data.contests} openOnLoad={true} />
                                    </>

                            }
                        </>
                    :
                        <>
                            {
                                !searchedUserSummary? // !curUser and !searchedUser
                                    <></>
                                : // searchedUser
                                    <OlympicsSummary player={searchedUserSummary} contests={data.contests} openOnLoad={true} />
                            }
                        </>
                }
            </div>
        )
    }

    function tableRowDesktopScreen(player:PlayerOlympicData, rank:number, currUserRow=false) {
        const playerKey = `player-${rank}`;
        const user = currUserRow? undefined:addressUsersMap[player.profile_address.toLowerCase()];

        return (
            <tr className={currUserRow? "bg-rives-purple":""} key={player.profile_address}>
                <td className='pixelated-font px-2 text-center'>
                    {rank}
                </td>

                <td className='px-2'>
                    <Link href={`/profile/${player.profile_address}`} className={`flex items-center gap-2 ${currUserRow? "hover:text-black":"hover:text-rives-purple"}`}>
                        {
                            currUserRow?
                                <td className='px-2 h-12 pixelated-font flex items-center'>
                                    You
                                </td>
                            :
                                <>
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
                                <Link href={`/tapes/${player_contest.tape_id}`} className={`block text-center ${currUserRow? "hover:text-black":"hover:text-rives-purple"}`}>
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
    }

    function tableRowMobileScreen(player:PlayerOlympicData, rank:number, currUserRow=false) {
        const playerKey = `player-${rank}`;
        const user = currUserRow? undefined:addressUsersMap[player.profile_address.toLowerCase()];

        return (
            <tr className={`border-b ${currUserRow? "bg-rives-purple":""}`} key={player.profile_address}>
                <th className='pixelated-font px-2 text-center border-r'>
                    {rank}
                </th>

                <td className='px-2 border-r'>
                    <Link href={`/profile/${player.profile_address}`} className={`flex items-center gap-2 ${currUserRow? "hover:text-black":"hover:text-rives-purple"}`}>
                        {
                            currUserRow?
                                <td className='px-2 h-12 pixelated-font flex items-center'>
                                    You
                                </td>
                            :
                                <>
                                    {
                                        !user?
                                            <>
                                                <Image width={48} height={48} src={rivesCheck} className='rounded-full pixelated-img' alt='' />
                                                <span className='pixelated-font text-xs md:text-sm overflow-hidden' title={player.profile_address}>
                                                    {player.profile_address.substring(0,6)+"..."+player.profile_address.substring(player.profile_address.length-4,player.profile_address.length)}
                                                </span>
                                            </>
                                        :
                                            <>
                                                <img width={48} height={48} src={user.picture_url} className='rounded-full pixelated-img' alt='' />
                                                <span className='pixelated-font text-xs md:text-sm overflow-hidden' title={player.profile_address}>
                                                    {user.name}
                                                </span>
                                            </>
                                    }
                                </>
                        }
                    </Link>
                </td>

                <td className='grid'>
                    {
                        data.contests.map((contest, index) => {
                            const player_contest = player.contests[contest.contest_id];
                            const player_contest_key = `${playerKey}-${contest.contest_id}`;

                            if (!player_contest) {
                                return (
                                    <div key={player_contest_key} className={`px-2 w-full grid grid-cols-2 gap-2`}>
                                        <div className='w-full hidden sm:flex justify-end'>
                                            <span className='pixelated-font line-clamp-1 text-xs md:text-sm'>{contest.name}:</span>    
                                        </div>

                                        <div className='col-span-2 sm:col-span-1 w-full flex justify-center sm:justify-start'>
                                            <span className='pixelated-font text-xs md:text-sm text-center sm:text-start'>-</span>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <div key={player_contest_key} className='px-2 w-full'>
                                    <Link href={`/tapes/${player_contest.tape_id}`} 
                                    className={`${currUserRow? "hover:text-black":"hover:text-rives-purple"} grid grid-cols-2 gap-2`}>
                                        <div className='w-full hidden sm:flex justify-end'>
                                            <span 
                                            className='pixelated-font line-clamp-1 text-xs md:text-sm' title={`score: ${player_contest.score}`}>
                                                {contest.name}:
                                            </span>
                                        </div>

                                        <div className='col-span-2 sm:col-span-1 w-full flex justify-center sm:justify-start'>
                                            <span className='pixelated-font text-xs md:text-sm text-center sm:text-start'>
                                                {player_contest.rank} ({player_contest.points} points)
                                            </span>
                                        </div>
                                    </Link>
                                </div>
                            )
                        })
                    }

                </td>

                <td className='pixelated-font px-2 text-center border-l'>
                    {player.total_points}
                </td>
            </tr>
        )
    }

    useEffect(() => {
        if (!(ready || authenticated || user)) return;
        
        const userAddress = user?.wallet?.address.toLowerCase();
        let exit_counter = 2;
        if (!searchedUser) exit_counter = exit_counter -1;
        if (!user?.wallet?.address) exit_counter = exit_counter -1;

        if (exit_counter) {
            for (let i = 0; i < data.leaderboard.length; i++) {
                if (exit_counter == 0) return;

                if (data.leaderboard[i].profile_address.toLowerCase() == userAddress) {
                    let prizes:Array<Raffle>|undefined;
                    if (socialPrizesData) {
                        prizes = socialPrizesData[userAddress];
                    }
    
                    setCurrUser({...data.leaderboard[i], 
                        rank: i+1, 
                        socialPrizes: prizes? prizes: [], 
                        searched: false
                    });
    
                    exit_counter = exit_counter -1;
                }
    
                if (searchedUser && data.leaderboard[i].profile_address.toLowerCase() == searchedUser.address) {
                    let prizes:Array<Raffle>|undefined;
                    if (socialPrizesData) {
                        prizes = socialPrizesData[searchedUser.address];
                    }
    
                    setSearchedUserSummary({...data.leaderboard[i], 
                        rank: i+1, 
                        socialPrizes: prizes? prizes: [], 
                        searched: true, 
                        user: searchedUser.user
                    });
    
                    exit_counter = exit_counter -1;
                }
            }
        }

        setCurrUser(null);
        setSearchedUserSummary(null);
    
    }, [ready, authenticated, user]);

    if (!ready || (currUser === undefined && searchedUserSummary == undefined)) {
        return (
            <Loading msg=''/>
        )
    }

    return (
        <>
            <div className='w-full hidden xl:grid'>
                <div className='flex gap-2 items-center'>
                    <h1 className='text-5xl pixelated-font mb-4'>Olympics Leaderboard</h1>
                    {olympicsSummary()}
                </div>

                <table className="w-full">
                    <thead className="text-xsuppercase sticky top-0 w-full min-h-fit h-12">
                        <tr className='bg-black'>
                            <th scope="col" className='pixelated-font px-2 text-center'>
                                Rank
                            </th>
                            <th scope="col" className='pixelated-font px-2 text-center'>
                                Player
                            </th>

                            {
                                data.contests.map((contest, index) => {
                                    return (
                                        <th key={contest.name} scope="col" className='px-2'>
                                            <Link href={`/contests/${contest.contest_id}`} 
                                            className='block pixelated-font text-center hover:text-rives-purple'>
                                                {contest.name}
                                            </Link>
                                        </th>
                                    )
                                })
                            }
                            <th scope="col" className="pixelated-font px-2 text-center">
                                Global
                            </th>
                        </tr>
                    </thead>

                    <tbody className='text-xs'>
                        {
                            !currUser || currUser.rank < 10?
                                <></>
                            :
                                tableRowDesktopScreen(currUser as PlayerOlympicData, currUser.rank, true)
                        }

                        {
                            data.leaderboard.map((player, index) => {
                                return tableRowDesktopScreen(player, index+1);
                            })
                        }
                    </tbody>
                </table>

            </div>



            {/* Mobile Leaderboard */}
            <div className='w-full xl:hidden grid'>
                <div className='flex gap-2 items-center'>
                    <h1 className='text-xl mb-4 sm:text-2xl md:text-4xl lg:text-5xl pixelated-font'>Olympics Leaderboard</h1>
                    {olympicsSummary()}
                </div>

                <table className='w-full' style={{tableLayout: 'fixed'}}>
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
                            !currUser || currUser.rank < 10?
                                <></>
                            :
                                tableRowMobileScreen(currUser as PlayerOlympicData, currUser.rank, true)
                        }

                        {
                            data.leaderboard.map((player, index) => {
                                return tableRowMobileScreen(player, index+1);
                            })
                        }

                    </tbody>
                </table>
            </div>
        </>
    )
}

export default OlympicsLeaderboard
import React from 'react'
import { getOlympicsData } from '../utils/util'
import Link from 'next/link';
import Image from 'next/image';
import { getUsersByAddress, User } from '../utils/privyApi';
import Accordion from '../components/Accordion';
import WarningIcon from '@mui/icons-material/Warning';
import olympicsLogo from "@/public/doom-olympics-logo.png";
import OlumpicsPageMsg from '../components/OlumpicsPageMsg';
import OlympicsLeaderboard from '../components/OlympicsLeaderboard';
import CartesiLockup from "@/public/cartesi_lockup_white.png";

export const revalidate = 0 // revalidate data always


async function OlympicsPage() {
    const data = await getOlympicsData("");
    const accordionItems = [
        {
            title: "Prizes",
            content: (
                <div>
                    <h1>All Prizes will be distributed in CTSI on Ethereum after the olympics.</h1>

                    <h2>Prize Structure:</h2>
                    <ul className='ps-4'>
                        <li>
                            Contests - $7000 total, per contest:
                            <ol className='ps-8'>
                                <li>1: $600</li>
                                <li>2: $300</li>
                                <li>3: $100</li>
                            </ol>
                        </li>

                        <li>
                            Global Leaderboard - $3500
                            <ol className='ps-8'>
                                <li>1: $1000</li>
                                <li>2: $500</li>
                                <li>3: $300</li>
                                <li>4-10: $50</li>
                                <li>10-100: $15</li>
                            </ol>
                        </li>

                        <li>
                            RIVES achievement collectors - $3000:
                            <ul className='ps-8'>
                                <li>100 winners chosen in Raffle, each achievement counts as 1 raffle entry. See all available achievements on profile page</li>        
                            </ul>
                            
                        </li>
                        <li>
                            JokeRace - $500:
                            <ul className='ps-8'>
                                <li>Submit and vote for the best tape</li>
                            </ul>
                        </li>
                        <li>
                            <Link className='text-rives-purple hover:underline' href={"https://signup.rives.io/olympics/"}>Signup referral</Link> - $250:
                            <ul className='ps-8'>
                                <li>Raffled to 5 people (each referral 1 entry)</li>
                            </ul>
                        </li>
                        <li>
                            Galxe - $750:
                            <ul className='ps-8'>
                                <li>See <Link href="https://app.galxe.com/quest/cartesi/GCr5TtxKcC" className='text-rives-purple hover:underline'>Galxe</Link> for details</li>
                            </ul>
                        </li>
                    </ul>

                </div>
            )

        },
        {
            title: "How to participate?",
            content: (
                <div>
                    <ul>
                        <li>Connect wallet, make sure to have some ETH on Base to pay for gas</li>
                        <li>
                            Link Twitter/Discord account! To qualify for prize distribution
                            <ul className='ps-4'>
                                <li className='flex items-center justify-center text-center gap-2'>
                                    <WarningIcon className='text-yellow-400' />
                                    <span>Your social account needs to be over 1 year old to be eligible for prizes</span>
                                    <WarningIcon className='text-yellow-400' />
                                </li>
                            </ul>
                        </li>
                        <li>Play each contest on the contest page (1 per day) and submit your gameplay for verification to enter the specific contest</li>
                    </ul>
                </div>
            )
        }
    ];

    // if (!data) {
    //     return (
    //         <main className="flex items-center justify-center h-lvh">
    //             <span className={`text-4xl text-white pixelated-font` }>No Olympics data!</span>
    //         </main>
    //     );
    // }

    let addresses:Array<string> = [];
    if (data) {
        for (let i = 0; i < data.leaderboard.length; i++) {
            const item = data.leaderboard[i];
            addresses.push(item.profile_address);
        }    
    }

    const addressUsersMap:Record<string, User> = JSON.parse(await getUsersByAddress(addresses));

    return (
        <main>
            <section className='grid gap-4 items-center overflow-auto'>
                <div className='hidden md:flex items-center justify-between px-8 w-full'>
                    <div className='flex flex-col'>
                        <span className='pixelated-font text-xl'>$15 k</span>
                        <span className='pixelated-font text-xl'>In Prizes</span>
                    </div>

                    <div className='flex flex-col gap-2 items-center'>
                        <Image src={olympicsLogo} width={192} alt="" />
                        <div className='flex flex-col items-center'>
                            <span className='pixelated-font text-3xl'>DOOM OLYMPICS</span>
                            <span className='pixelated-font text-sm'>SEP 12-19</span>
                        </div>
                    </div>

                    <div className='flex flex-col'>
                        <span className='pixelated-font text-xl'>Sponsored By</span>
                        <Image height={24} src={CartesiLockup} alt=''></Image>
                    </div>
                </div>

                <div className='md:hidden grid grid-cols-1 px-8 gap-4 w-full'>

                    <div className='flex flex-col gap-2 items-center'>
                        <Image src={olympicsLogo} width={192} alt="" />
                        <div className='flex flex-col items-center'>
                            <span className='pixelated-font text-3xl'>DOOM OLYMPICS</span>
                            <span className='pixelated-font text-sm'>SEP 12-19</span>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 place-items-center'>
                        <div className='flex flex-col'>
                            <span className='pixelated-font text-xl'>$15 k</span>
                            <span className='pixelated-font text-xl'>In Prizes</span>
                        </div>

                        <div className='flex flex-col'>
                            <span className='pixelated-font text-xl'>Sponsored By</span>
                            <Image height={24} src={CartesiLockup} alt=''></Image>
                    </div>

                    </div>
                </div>

                <OlumpicsPageMsg/>
                <Accordion items={accordionItems}/>

                {
                    !data?
                        <></>
                    :
                        <OlympicsLeaderboard data={data} addressUsersMap={addressUsersMap} />
                }
            </section>
        </main>
    )
}

export default OlympicsPage
import React from 'react'
import Image from "next/image";
import Link from 'next/link';
import CartesiLogo from "@/public/cartesi_icon.png";
import winnerAchievementIcon from "@/public/contest.png";
import participationAchievementIcon from "@/public/contestparticipant.png";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';


function OlympicsBanner() {
  return (
    <Link href={"/olympics"}
    className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 place-content-center bg-[#fefa97] text-black p-8 mb-8'>
        <div className='flex flex-col gap-2 items-center'>
            <div className='h-32 w-48 border'></div>
            <div className='flex flex-col items-center'>
                <span className='pixelated-font text-xl'>DOOM OLYMPICS</span>
                <span className='pixelated-font text-sm'>SEP 12-19</span>
            </div>
        </div>

        <div className='flex justify-center'>
            <div className='flex flex-col gap-2 items-center'>
                <div className='flex flex-col gap-2'>
                    <div className='flex flex-col'>
                        <span className='pixelated-font text-3xl'>$15 k</span>
                        <span>In Prizes</span>
                    </div>

                    <div className='flex flex-col'>
                        <span className='pixelated-font'>Sponsored By</span>
                        <div className='flex gap-2 items-center'>
                            <Image width={24} height={24} quality={100} src={CartesiLogo} alt=''></Image>
                            <span className='text-black'>Cartesi</span>
                        </div>
                    </div>

                </div>
                
                <button className='lg:hidden pixelated-font text-white bg-[#df50c4] flex items-center justify-center gap-2 p-2 w-48'>
                    <AddCircleOutlineIcon/>
                    <span className='pixelated-font'>Sign Me Up!</span>
                </button>
            </div>
        </div>

        <div className='hidden lg:flex flex-col gap-4'>
            <div className='pixelated-font'>7 days, 7 contests</div>
            <div className='flex flex-col gap-0'>
                <span>Lightning Run</span>
                <span>Knucle Crusher</span>
                <span>Infallible Aim</span>
                <span>Secret Master</span>
                <span>Treasure Seaker</span>
                <span>The Completionist</span>
                <span>Enemy Eradicator</span>
            </div>
        </div>

        <div className='hidden lg:flex flex-col justify-between gap-4'>
            <div className='flex flex-col'>
                <div className='pixelated-font'>Unlock Achievements</div>
                <div className='flex items-center gap-2'>
                    <Image width={64} height={64} src={winnerAchievementIcon} alt=""/>
                    <Image width={64} height={64} src={participationAchievementIcon} alt=""/>
                    <div className='pixelated-font'>
                        + many more
                    </div>
                </div>
            </div>

            <button className='text-white bg-[#df50c4] flex items-center justify-center gap-2 p-2'>
                <AddCircleOutlineIcon/>
                <span className='pixelated-font'>Sign Me Up!</span>
            </button>
        </div>
    </Link>
  )
}

export default OlympicsBanner
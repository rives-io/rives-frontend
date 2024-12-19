import React from 'react'
import Image from "next/image";
import Link from 'next/link';
import seasonBkgImg from "@/public/season_banner_img.png";
import CartesiLogo from "@/public/cartesi_icon.png";

export interface seasonDetails {
    contests:Array<{contest_id:string, name:string}>,
    submissions:number
}

async function SeasonBanner({season_id, details}:{season_id:string, details?:seasonDetails}) {


    if (!details) {
        return (
            // <Link href={`/season/${season_id}`} className=''>
            <Link href={`/season/cs1`} className=''>
                <div className='relative w-full flex items-center justify-center p-8 
                bg-gradient-to-r from-[#8b5cf6] to-stone-200 hover:scale-110'>
                    <Image alt='' src={seasonBkgImg} height={192} className={`absolute left-0 opacity-40`} />
                    <div className='grid gap-2 relative w-full max-w-lg'>
                        <h1 className='text-black pixelated-font text-2xl justify-self-center'>Creator Season 1</h1>
                        
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                            <div className='pixelated-font text-center bg-rives-purple p-2 col-span-2 md:col-span-1'>
                                Nov 15 - Dec 23
                            </div>

                            <div className='flex flex-wrap justify-center items-center gap-2 text-black text-center bg-[#00F7FF] p-2'>
                                <span className='pixelated-font'>By</span>
                                <div className='flex h-fit'>
                                    <Image width={24} height={24} quality={100} src={CartesiLogo} alt='Not found'></Image>
                                    <span className='pixelated-font'>Cartesi</span>
                                </div>
                            </div>
                            
                            <div className='pixelated-font text-black text-center bg-[#fefa97] p-2'>
                                Create + Play
                            </div>
                        </div>
            
                        <div className='text-black bg-stone-300 p-2 flex'>
                            <span className='pixelated-font'>$5k in prizes</span>
                
                            <div className='flex flex-1 justify-end'>
                                <span className='pixelated-font'>5+ achievements</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        )
    }
    
    return (
        <div className='relative w-full grid sm:grid-cols-2 gap-2 p-8 
        bg-gradient-to-r from-[#c784ff] to-stone-200'>

            <div className='flex items-center relative'>
                <Image alt='' src={seasonBkgImg} height={192} className={`absolute left-0 opacity-40`} />

                <div className='grid gap-2 relative w-full max-w-lg'>

                    <h1 className='text-black pixelated-font text-4xl justify-self-center text-center'>Creator Season 1</h1>

                    <div className='grid grid-cols-2 lg:grid-cols-3 gap-2'>
                        <div className='pixelated-font text-center bg-rives-purple p-2 col-span-2 lg:col-span-1'>
                            Nov 15 - Dec 23
                        </div>

                        <div className='flex flex-wrap justify-center items-center gap-2 text-black text-center bg-[#00F7FF] p-2'>
                            <span className='pixelated-font'>By</span>
                            <div className='flex h-fit'>
                                <Image width={24} height={24} quality={100} src={CartesiLogo} alt='Not found'></Image>
                                <span className='pixelated-font'>Cartesi</span>
                            </div>
                        </div>

                        <div className='pixelated-font text-black text-center bg-[#fefa97] p-2'>
                            {details.contests.length} Contests
                        </div>
                    </div>
        
                    <div className='text-black bg-stone-300 p-2 flex gap-2'>
                        <span className='pixelated-font'>$5k in prizes</span>
            
                        <div className='flex flex-1 justify-end'>
                            <span className='pixelated-font'>5+ achievements</span>
                        </div>
                    </div>

                    <div className='pixelated-font text-black text-sm'>{details.submissions} submissions so far</div>

                </div>
            </div>

            <div className='flex flex-wrap justify-center sm:justify-normal sm:grid sm:justify-items-end gap-1'>
                {details.contests.map((contest, index) => {
                    return (
                        <Link href={`/contests/${contest.contest_id}`} key={`banner-${contest.contest_id}-${index}`} 
                        className='w-fit py-1 px-1 sm:px-16 bg-rives-purple hover:text-rives-purple hover:bg-white pixelated-font text-center'>
                            Play Contest {index+1}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

export default SeasonBanner

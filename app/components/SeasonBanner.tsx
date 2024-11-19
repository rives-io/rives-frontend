"use client"


import React from 'react'
import Image from "next/image";
import Link from 'next/link';
import seasonBkgImg from "@/public/season_banner_img.png";


function SeasonBanner() {

  return (
    <Link href={"https://itch.io/jam/rives-jam-3"}
    className='homepageContainer flex items-center justify-center p-8 
    bg-gradient-to-r from-[#8b5cf6] to-stone-200 relative hover:scale-110'>
        <Image alt='' src={seasonBkgImg} height={192} className='absolute left-0 opacity-60 z-0' />
        <div className='grid gap-2 z-10'>
            <h1 className='text-black pixelated-font text-2xl justify-self-center'>Creator Season 1</h1>
            
            <div className='grid grid-cols-2 gap-2'>
                <div className='pixelated-font text-center bg-rives-purple p-2'>
                    Nov 15 - Dec 23
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
    </Link>
  )
}

export default SeasonBanner
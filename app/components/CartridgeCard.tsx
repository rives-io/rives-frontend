"use client"



import Image from "next/image";
import { CartridgeInfo } from "../backend-libs/core/ifaces"
import { cartridgeInfo } from "@/app/backend-libs/core/lib";
import { envClient } from "../utils/clientEnv";
// import RivesLogo from "./svg/RivesLogo";
import { useContext } from "react";
import { selectedCartridgeContext } from "../cartridges/selectedCartridgeProvider";
import rivesLogo from '@/public/logo.png';
import Link from "next/link";



export default function CartridgeCard({cartridge}:{cartridge:CartridgeInfo}) {

    return (
        <Link href={`cartridge/${cartridge.id}`} className="w-48 h-64 px-2 flex flex-col pixel-corners bg-[#403f47] hover:scale-110">
            <div className='w-28 h-8 '>
                <Image
                    src={rivesLogo}
                    layout="fit"
                    quality={100}
                    alt='rives logo'
                    className="-mt-4 -ms-2"
                />
            </div>

            <div className="w-fill h-32 my-2 bg-black relative">
                <Image fill 
                    // src={cartridge.cover!} alt={"Not found"}
                    src={"data:image/png;base64,"+cartridge.cover} alt={"Not found"}
                />
            </div>

            <div className="bg-[#35343c] flex h-12">
                <div className="w-2/3 flex flex-col p-1">
                    <span className="truncate">{cartridge.name}</span>
                    {
                        cartridge.authors.length == 0?
                            <></>
                        :
                            <span className="text-sm truncate">By: <span className="text-rives-purple">{cartridge.authors[0]}</span></span>
                    }
                </div>

                <div className="w-1/3 bg-rives-purple flex flex-col justify-center text-center text-wrap text-xs">
                    0.03 ETH
                </div>

            </div>
        </Link>
    )
}
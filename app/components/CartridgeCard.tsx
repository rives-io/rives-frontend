"use client"



import Image from "next/image";
import { CartridgeInfo } from "../backend-libs/core/ifaces"
import rivesLogo from '@/public/logo.png';
import Link from "next/link";


export default function CartridgeCard({cartridge}:{cartridge:CartridgeInfo}) {

    return (
        // <Link href={`cartridges?cartridge_id=${cartridge.id}`} className="w-48 h-fit pb-3 px-1 flex flex-col pixel-corners bg-[#403f47] hover:scale-110">
        <Link href={`cartridges?cartridge_id=${cartridge.id}`} className="cartridgeBorder rounded-full w-48 h-fit pb-1 px-1 flex flex-col bg-[#403f47] hover:scale-110">

            <div className="flex">
                <div className='w-28 h-8 '>
                    <Image
                        src={rivesLogo}
                        layout="fit"
                        quality={100}
                        alt='rives logo'
                        className="-mt-4 -ms-2"
                    />
                </div>

                <div className="flex items-center text-wrap">
                    <div className="h-fit bg-rives-purple text-[10px] px-0.5">
                        0.03 ETH
                    </div>
                    
                </div>

            </div>

            <div className="w-fill h-[172px] my-1 bg-black flex justify-center">
                <Image width={172} height={172} 
                    // src={cartridge.cover!} alt={"Not found"}
                    src={"data:image/png;base64,"+cartridge.cover} alt={"Not found"}
                />
            </div>

            <div className="bg-[#35343c] flex h-12 w-full">
                <div className="flex flex-col p-1">
                    <span className="truncate">{cartridge.name}</span>
                    {
                        cartridge.authors.length == 0?
                            <></>
                        :
                            <span className="text-sm truncate">By: <span className="text-rives-purple">{cartridge.authors[0]}</span></span>
                    }
                </div>
            </div>
        </Link>
    )
}
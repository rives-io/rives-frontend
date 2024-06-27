"use client"



import Image from "next/image";
import { CartridgeInfo } from "../backend-libs/core/ifaces"
import rivesLogo from '@/public/logo.png';
import Link from "next/link";


export default function CartridgeCard({cartridge}:{cartridge:CartridgeInfo}) {

    return (
        <Link href={`cartridges?cartridge_id=${cartridge.id}`} className="cartridgeBorder rounded-full w-44 h-60 flex flex-col bg-rives-gray hover:scale-110">

            <div className="flex">
                <div className='w-20 h-8'>
                    <Image
                        src={rivesLogo}
                        layout="fit"
                        quality={100}
                        alt='rives logo'
                        className="-mt-6 -ms-4"
                    />
                </div>

                <div className="flex flex-1 justify-center text-wrap -me-2">
                    <div className="h-fit px-1 bg-rives-purple text-black text-xs -mt-[6px]">
                        0.03 ETH
                    </div>
                    
                </div>

            </div>

            <div className="w-fill -mt-[16px] -mx-2  justify-center">
                <div className="w-40 h-40 grid grid-cols-1 place-content-center bg-black relative">
                    <Image fill
                        style={{objectFit: "cover"}}
                        src={"data:image/png;base64,"+cartridge.cover} alt={"Not found"}
                    />
                </div>

                {/* <div className="w-40 h-40">
                    <img style={{objectFit: "cover", width: 160, height: 160}}
                        src={"data:image/png;base64,"+cartridge.cover} alt={"Not found"}
                    />
                </div> */}
            </div>

            <div className="flex h-10 w-fill -mx-2 ">
                <div className="flex flex-col p-[2px] h-10">
                    <span className="pixelated-font text-sm truncate">{cartridge.name}</span>
                    {
                        cartridge.authors.length == 0?
                            <></>
                        :
                            <span className="pixelated-font text-xs truncate">By: <span className="text-rives-purple">{cartridge.authors[0]}</span></span>
                    }
                </div>
            </div>
        </Link>
    )
}
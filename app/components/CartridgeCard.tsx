"use client"



import Image from "next/image";
import { CartridgeInfo } from "../backend-libs/core/ifaces"
import rivesLogo from '@/public/logo_cutted.png';
import Link from "next/link";
import { User, getUsersByAddress } from "../utils/privyApi";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { BondInfo, getCartridgeBondInfo } from "../utils/assets";


export default function CartridgeCard({cartridge, small}:{cartridge:CartridgeInfo, small?:boolean}) {
    const cartridge_creator = cartridge.user_address;
    const formatedCreatorAddr = `${cartridge_creator.slice(0, 6)}...${cartridge_creator.substring(cartridge_creator.length-4,cartridge_creator.length)}`;

    
    const cartridgeSize = small? "w-36 h-52":"w-44 h-60";
    const cartridgeLogoSize = small? "w-12 ":"w-16"
    const cartridgeCoverSize = small? "w-32 h-32":"w-40 h-40";

    const [twitterInfo, setTwitterInfo] = useState<User|null>(null);
    const [currentPrice,setCurrentPrice] = useState<string>();

    useEffect(() => {
        getUsersByAddress([cartridge.user_address]).then((userMapString) => {
            const userMap:Record<string,User> = JSON.parse(userMapString);
            const user = userMap[cartridge.user_address.toLowerCase()];

            if (user) {
                setTwitterInfo(user);
            }
        });

        if (cartridge.id) {
            getCartridgeBondInfo(cartridge.id).then((bond: BondInfo|null) => {
                if (bond)
                    setCurrentPrice(`${parseFloat(ethers.utils.formatUnits(bond.currentPrice,bond.currencyDecimals)).toLocaleString("en", { maximumFractionDigits: 3 })}${bond.currencySymbol}`);
            });
        }
    }, [])

    return (
        <Link title={cartridge.name} href={`/cartridges/${cartridge.id}`} className={`cartridgeBorder rounded-full ${cartridgeSize} flex flex-col bg-rives-gray hover:scale-110`}>

            <div className="flex items-stretch">
                <div className='w-fit h-8'>
                    <div className={`${cartridgeLogoSize} h-4 relative`}>
                    <Image fill
                        src={rivesLogo}
                        quality={100}
                        alt='rives logo'
                        className="-mt-2 -ms-2"
                    />

                    </div>
                </div>

                {currentPrice ? <div className="flex flex-1 justify-end text-wrap -me-2">
                    <div className="h-fit px-1 bg-rives-purple text-black text-xs -mt-2">
                        {currentPrice}
                    </div>
                    
                </div> : <></>}

            </div>

            <div className="w-fill -mt-[16px] -mx-2  justify-center">
                <div className={`${cartridgeCoverSize} grid grid-cols-1 place-content-center bg-black relative`}>
                    <Image fill
                        style={{objectFit: "cover"}}
                        src={"data:image/png;base64,"+cartridge.cover} alt={"Not found"}
                    />
                </div>
            </div>

            <div className="flex h-10 w-fill -mx-2 ">
                <div className="flex flex-col p-[2px] h-10 w-full">
                    <span className="pixelated-font text-sm truncate">{cartridge.name}</span>
                    <span className="pixelated-font text-xs truncate">
                        By: <button onClick={() => window.open(`/profile/${cartridge.user_address}`,"_self")}
                            className="pixelated-font text-rives-purple hover:underline">
                                {
                                    !twitterInfo?
                                        formatedCreatorAddr
                                    :
                                        twitterInfo.name
                                }
                            </button>
                    </span>
                </div>
            </div>
        </Link>
    )
}
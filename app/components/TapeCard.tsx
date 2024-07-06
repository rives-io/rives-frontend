"use client"

import Link from "next/link";
import Image from "next/image";
import { VerifyPayload } from "../backend-libs/core/lib";
import { sha256 } from "js-sha256";
import { ethers } from "ethers";
import rivesLogo from '@/public/logo.png';
import { getTapeGif, getTapeImage, getTapeName } from "../utils/util";
import { useEffect, useState } from "react";
import rivesCheck from "@/public/rives_check.png";
import { Twitter } from "@privy-io/react-auth";
import { User, getUsersByAddress } from "../utils/privyApi";
import { BondInfo, getTapeBondInfo } from "../utils/assets";

interface TapePreview {
    title:string,
    address:string,
    tapeId:string,
    gif:string,
    gifImage:string,
    twitterInfo?:Twitter
}

export default function TapeCard({tapeInput}:{tapeInput:string|VerifyPayload|TapePreview}) {
    let tape:VerifyPayload|TapePreview;

    if (typeof tapeInput == "string") {
        tape = JSON.parse(tapeInput);
    } else {
        tape = tapeInput;
    }

    let userAddress:string;
    //const timestamp = new Date(tape._timestamp*1000).toLocaleDateString();
    let tapeId:string;
    let tapeTitle:string|null = null;
    let initialGifImageValue = "";
    let initialGifValue = "";
    let userName:string|null = null;

    if (tape.gif) {
        tape = (tape as TapePreview);
        tapeId = tape.tapeId;
        userAddress = tape.address.toLowerCase();
        initialGifImageValue = tape.gifImage;
        initialGifValue = tape.gif;
        tapeTitle = tape.title;
        
        if (tape.twitterInfo) {
            userName = tape.twitterInfo.name;
        }
    } else {
        userAddress = (tape as VerifyPayload)._msgSender.toLowerCase();
        tapeId = sha256(ethers.utils.arrayify(((tape as VerifyPayload).tape)));
    }

    const player = `${userAddress.slice(0, 6)}...${userAddress.substring(userAddress.length-4,userAddress.length)}`;
    const [playerName, setPlayerName] = useState<string|null>(userName);
    const [title, setTitle] = useState<string|null>(tapeTitle === null || tapeTitle.length == 0? tapeId:tapeTitle);
    const [gifImage, setGifImage] = useState<string|null>(initialGifImageValue);
    const [gif, setGif] = useState<string|null>(initialGifValue);
    const [currentPrice,setCurrentPrice] = useState<string>();

    const [displayGif, setDisplayGif] = useState(false);
    const onMouseEnter = () => setDisplayGif(true);
    const onMouseLeave = () => setDisplayGif(false);
    
    useEffect(() => {
        const tapePreview = tape as TapePreview;
        if (tapePreview && !title) setTitle(tapePreview.title === null || tapePreview.title === undefined || tapePreview.title.length == 0 ? tapeId : tapePreview.title);
    }, [tape])

    useEffect(() => {
        if (!playerName) {
            getUsersByAddress([userAddress]).then((userMapString) => {
                const userMap:Record<string,User> = JSON.parse(userMapString);
                const user = userMap[userAddress];
    
                if (user) {
                    setPlayerName(user.name);
                }
            });
        }
        if (!(tape as TapePreview).title) {
            getTapeName(tapeId).then((tapeName) => {
                if (tapeName) setTitle(tapeName);
            });
        }

        if (gifImage?.length == 0) {
            getTapeImage(tapeId).then((gifImage) => setGifImage(gifImage));
        }
    
        if (gif?.length == 0) {
            getTapeGif(tapeId).then((gif) => setGif(gif));
        }

        if (tapeId) {
            getTapeBondInfo(tapeId).then((bond: BondInfo|null) => {
                if (bond)
                    setCurrentPrice(`${parseFloat(ethers.utils.formatUnits(bond.buyPrice,bond.currencyDecimals)).toLocaleString("en", { maximumFractionDigits: 3 })}${bond.currencySymbol}`);
            });
        }
    
    }, [])


    return (
        <div 
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        >
            <Link href={`/tapes/${tapeId}`}
            style={{
                pointerEvents: typeof tapeTitle == "string" ? "none":"auto"
            }}
            className="tapeBorder flex flex-col items-center w-44 h-60 hover:scale-110">
                <div className='w-20 h-8'>
                    <Image
                        src={rivesLogo}
                        quality={100}
                        alt='rives logo'
                        className="-mt-12 -ms-11"
                    />
                    {currentPrice ? <div className="h-fit w-16 px-1 bg-rives-purple text-black text-xs -mt-[28px] ms-12">
                        {currentPrice}
                    </div> : <></>}
                </div>

                <div className="w-fill -mt-3 -me-2 mb-1 flex justify-center">
                    <div className="w-[156px] h-[156px] relative">
                        {
                            displayGif && gif && gif.length > 0?
                                <Image fill
                                    style={{objectFit: "cover"}}
                                    src={"data:image/gif;base64," + gif}
                                    alt={"Not found"}
                                />
                            :
                                <Image fill
                                    style={{objectFit: "cover"}}
                                    src={!gifImage || gifImage.length == 0? rivesCheck:"data:image/jpeg;base64," + gifImage}
                                    alt={"Not found"}
                                />
                    
                        }
                    </div>
                </div>
                    

                <div className="w-44 px-2 -me-2">
                    <div className="flex flex-col items-start">
                        <span className="pixelated-font text-sm truncate max-w-full">{title}</span>
                        <span className="pixelated-font text-xs truncate">
                            By: <button onClick={() => window.open(`/profile/${userAddress}`,"_self")}
                                className="pixelated-font text-rives-purple hover:underline">
                                    {
                                        playerName?
                                            playerName
                                        :
                                            player
                                    }
                            </button>
                        </span>
                    </div>

                </div>
            </Link>
        </div>

    )
}
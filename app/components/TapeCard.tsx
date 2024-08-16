"use client"

import Link from "next/link";
import Image from "next/image";
import { VerifyPayloadProxy } from "../backend-libs/core/lib";
import { sha256 } from "js-sha256";
import { ethers } from "ethers";
import rivesLogo from '@/public/logo_cutted.png';
import { calculateTapeId, getTapeGif, getTapeImage, getTapeName } from "../utils/util";
import { useEffect, useState } from "react";
import rivesCheck from "@/public/default_tape.png";
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

export default function TapeCard({tapeInput, creator, deactivateLink=false}:{tapeInput:string|VerifyPayloadProxy|TapePreview, creator?:User|null, deactivateLink?:boolean}) {
    let tape:VerifyPayloadProxy|TapePreview;

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
        userAddress = (tape as VerifyPayloadProxy)._msgSender.toLowerCase();
        tapeId = calculateTapeId((tape as VerifyPayloadProxy).rule_id,(tape as VerifyPayloadProxy).tape);
    }

    const player = `${userAddress.slice(0, 6)}...${userAddress.substring(userAddress.length-4,userAddress.length)}`;
    const [playerName, setPlayerName] = useState<string|null>(userName);
    const [title, setTitle] = useState<string|null>(tapeTitle === null || tapeTitle.length == 0? `...${tapeId.substring(56, 64)}`:tapeTitle);
    const [gifImage, setGifImage] = useState<string|null>(initialGifImageValue);
    const [gif, setGif] = useState<string|null>(initialGifValue);
    const [currentPrice,setCurrentPrice] = useState<string>();

    const [displayGif, setDisplayGif] = useState(false);
    const onMouseEnter = () => setDisplayGif(true);
    const onMouseLeave = () => setDisplayGif(false);
    
    useEffect(() => {
        const tapePreview = tape as TapePreview;
        if (tapePreview.gif) setTitle(!tapePreview.title || tapePreview.title.length == 0 ? tapeId : tapePreview.title);
    }, [tape])

    useEffect(() => {
        if (!playerName) {
            if (creator) {
                setPlayerName(creator.name);
            } else if (typeof creator === "undefined") {
                getUsersByAddress([userAddress]).then((userMapString) => {
                    const userMap:Record<string,User> = JSON.parse(userMapString);
                    const user = userMap[userAddress];
        
                    if (user) {
                        setPlayerName(user.name);
                    }
                });    
            }
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
            getTapeBondInfo(tapeId,true).then((bond: BondInfo|null) => {
                if (bond && bond.buyPrice)
                    setCurrentPrice(`${parseFloat(ethers.utils.formatUnits(bond.buyPrice,bond.currencyDecimals)).toLocaleString("en", { maximumFractionDigits: 3 })}${bond.currencySymbol}`);
            });
        }
    
    }, [])

    function handleClick(e:React.MouseEvent<HTMLElement>) {
        e.preventDefault();
        window.open(`/profile/${userAddress}`,"_self");
    }

    return (
        <div 
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        >
            <Link href={`/tapes/${tapeId}`}
            aria-disabled={deactivateLink} 
            tabIndex={deactivateLink ? -1 : undefined}
            className={`tapeBorder flex flex-col items-center w-44 h-60 ${deactivateLink ? 'pointer-events-none' : 'hover:scale-110'}`}>
                <div className="w-44 flex items-stretch px-[10px] ms-2">
                    <div className='w-fit h-8'>
                        <div className="w-16 h-4 relative">
                        <Image fill
                            src={rivesLogo}
                            quality={100}
                            alt='rives logo'
                            className="-mt-8"
                        />

                        </div>
                    </div>

                    {
                        currentPrice?
                            <div className="flex flex-1 justify-end text-wrap">
                                <div className="h-fit px-1 bg-rives-purple text-black text-xs -mt-8">
                                    {currentPrice}
                                </div>
                            </div>
                        :
                            <></>
                    }

                </div>

                <div className="w-fill -mt-10 -me-2 mb-1 flex justify-center">
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
                                    className={`${!gifImage || gifImage.length == 0? "pixelated-img":""}`}
                                    style={{objectFit: "cover"}}
                                    src={!gifImage || gifImage.length == 0? rivesCheck:"data:image/jpeg;base64," + gifImage}
                                    alt={"Not found"}
                                />
                    
                        }
                    </div>
                </div>
                    

                <div className="w-44 px-[10px] ms-2">
                    <div className="flex flex-col items-start">
                        <span className="pixelated-font text-sm truncate max-w-full">{title}</span>
                        <span className="pixelated-font text-xs truncate">
                            By <button onClick={handleClick}
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
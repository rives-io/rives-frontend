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

interface TapePreview {
    title:string,
    address:string,
    tapeId:string,
    gif:string,
    gifImage:string
}

export default function TapeCard({tapeInput}:{tapeInput:string|VerifyPayload|TapePreview}) {
    let tape:VerifyPayload|TapePreview;

    if (typeof tapeInput == "string") {
        tape = JSON.parse(tapeInput);
    } else {
        tape = tapeInput;
    }

    let user:string;
    //const timestamp = new Date(tape._timestamp*1000).toLocaleDateString();
    let tapeId:string;
    let tapeTitle:string|null = null;
    let initialGifImageValue = "";
    let initialGifValue = "";

    if (tape.gif) {
        tapeId = (tape as TapePreview).tapeId;
        user = (tape as TapePreview).address;
        initialGifImageValue = (tape as TapePreview).gifImage;
        initialGifValue = (tape as TapePreview).gif;
        tapeTitle = (tape as TapePreview).title;
    } else {
        user = (tape as VerifyPayload)._msgSender;
        tapeId = sha256(ethers.utils.arrayify(((tape as VerifyPayload).tape)));
    }

    const player = `${user.slice(0, 6)}...${user.substring(user.length-4,user.length)}`;
    const [title, setTitle] = useState<string|null>(tapeTitle === null || tapeTitle.length == 0? tapeId:tapeTitle);
    const [gifImage, setGifImage] = useState<string|null>(initialGifImageValue);
    const [gif, setGif] = useState<string|null>(initialGifValue);

    const [displayGif, setDisplayGif] = useState(false);
    const onMouseEnter = () => setDisplayGif(true);
    const onMouseLeave = () => setDisplayGif(false);

    // if (tapeTitle === null) {
    //     // fetch tape title if no title set tapeId as title
    //     getTapeName(tapeId).then((tapeName) => {
    //         if (tapeName) {
    //             setTitle(tapeName);
    //         }
    //     });
    // }
    
    if (gifImage?.length == 0) {
        getTapeImage(tapeId).then((gifImage) => setGifImage(gifImage));
    }

    if (gif?.length == 0) {
        getTapeGif(tapeId).then((gif) => setGif(gif));
    }

    useEffect(() => {
        if ((tape as TapePreview).title) setTitle((tape as TapePreview).title);
        else getTapeName(tapeId).then((tapeName) => {
            if (tapeName) setTitle(tapeName);
        })
    }, [tape])


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
                        layout="fit"
                        quality={100}
                        alt='rives logo'
                        className="-mt-12 -ms-11"
                    />
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
                            By: <span className="pixelated-font text-rives-purple">{player}</span>
                        </span>
                    </div>

                </div>
            </Link>
        </div>

    )
}
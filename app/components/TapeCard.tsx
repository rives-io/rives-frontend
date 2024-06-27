"use client"

import Link from "next/link";
import Image from "next/image";
import { VerifyPayload } from "../backend-libs/core/lib";
import { sha256 } from "js-sha256";
import { ethers } from "ethers";
import rivesLogo from '@/public/logo.png';
import { getTapeGif, getTapeImage } from "../utils/util";
import { useState } from "react";
import rivesCheck from "@/public/rives_check.png";

export default function TapeCard({tapeInput}:{tapeInput:string|VerifyPayload}) {

    let tape:VerifyPayload;
    if (typeof tapeInput == "string") {
        tape = JSON.parse(tapeInput);
    } else {
        tape = tapeInput;
    }
    

    const user = tape._msgSender;
    const player = `${user.slice(0, 6)}...${user.substring(user.length-4,user.length)}`;
    const timestamp = new Date(tape._timestamp*1000).toLocaleDateString();
    const tapeId = sha256(ethers.utils.arrayify((tape.tape)));
    const [gifImage, setGifImage] = useState<string|null>("");
    const [gif, setGif] = useState<string|null>("");

    const [displayGif, setDisplayGif] = useState(false);
    const onMouseEnter = () => setDisplayGif(true);
    const onMouseLeave = () => setDisplayGif(false);

    if (gifImage?.length == 0) {
        getTapeImage(tapeId).then((gifImage) => setGifImage(gifImage));
    }

    if (gif?.length == 0) {
        getTapeGif(tapeId).then((gif) => setGif(gif));
    }

    return (
        <Link href={`/tapes/${tapeId}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
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
                <div className="flex flex-col">
                    <span className="pixelated-font text-sm truncate">{tapeId}</span>
                    <span className="pixelated-font text-xs truncate">
                        By: <span className="pixelated-font text-rives-purple">{player}</span>
                    </span>
                </div>

            </div>
        </Link>
    )
}
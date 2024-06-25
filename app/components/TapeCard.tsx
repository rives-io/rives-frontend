"use client"

import Link from "next/link";
import Image from "next/image";
import { VerifyPayload } from "../backend-libs/core/lib";
import { sha256 } from "js-sha256";
import { ethers } from "ethers";
import rivesLogo from '@/public/logo.png';
import { getTapeImage } from "../utils/util";
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

    if (gifImage?.length == 0) {
        getTapeImage(tapeId).then((gif) => setGifImage(gif));
    }

    return (
        <Link href={`/tapes/${tapeId}`} className="flex flex-col px-4 items-center border-2 bg-rives-gray border-gray-700 hover:scale-110 w-44 h-56">
            <div className='w-28 h-8 '>
                <Image
                    src={rivesLogo}
                    layout="fit"
                    quality={100}
                    alt='rives logo'
                    className="-mt-4"
                />
            </div>

            <div className="w-32 h-32 grid grid-cols-1 my-2 place-content-center bg-black">
                <Image
                    width={128} height={128}
                    src={!gifImage || gifImage.length == 0? rivesCheck:"data:image/jpeg;base64," + gifImage}
                    alt={"Not found"}
                />
            </div>

            <div className="flex flex-col self-start w-full">
                <span className="truncate">{tapeId}</span>
                <span className="text-sm truncate">
                    By: <span className="text-rives-purple">{player}</span>
                </span>
            </div>
        </Link>
    )
}
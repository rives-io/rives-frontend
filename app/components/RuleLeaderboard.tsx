"use client"

import { getOutputs, VerificationOutput, VerifyPayloadInput } from '../backend-libs/core/lib';
import {  ethers } from "ethers";
import { envClient } from '../utils/clientEnv';
import React, { useEffect, useState } from 'react';
import { sha256 } from "js-sha256";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { useConnectWallet } from '@web3-onboard/react';
import { DecodedIndexerOutput } from '../backend-libs/cartesapp/lib';
import { getUsersByAddress } from '../utils/privyApi';
import Image from 'next/image';
import rivesCheck from "@/public/rives_check.png";

const DEFAULT_PAGE_SIZE = 10;
let total_pages = 1;

const getGeneralVerificationPayloads = async (
cartridge_id:string, rule:string, page:number, getVerificationOutputs: boolean
):Promise<DecodedIndexerOutput> => {
    let res:DecodedIndexerOutput;
    
    if (getVerificationOutputs) {
        const tags = ["score", cartridge_id, rule];
        res = await getOutputs(
            {
                tags,
                type: 'notice',
                page,
                page_size: DEFAULT_PAGE_SIZE,
                order_by: "value",
                order_dir: "desc"
            },
            {cartesiNodeUrl: envClient.CARTESI_NODE_URL});
    } else {
        const tags = ["tape", cartridge_id, rule];
        res = await getOutputs(
            {
                tags,
                type: 'input',
                page,
                page_size: DEFAULT_PAGE_SIZE,
                order_by: "timestamp",
                order_dir: "desc"
            },
            {cartesiNodeUrl: envClient.CARTESI_NODE_URL});    
    }

    total_pages = Math.ceil(res.total / DEFAULT_PAGE_SIZE);
    return res;
}

function tapesBoardFallback() {
    const arr = Array.from(Array(DEFAULT_PAGE_SIZE).keys());

    return (
        <div className="relative min-h-[480px]">
            <table className="w-full text-left">
                <thead className="text-xsuppercase">
                    <tr>
                        <th scope="col" className="px-2 py-3">
                            User
                        </th>
                        <th scope="col" className="px-2 py-3">
                            Timestamp
                        </th>
                        <th scope="col" className="px-2 py-3">
                            Score
                        </th>
                    </tr>
                </thead>
                <tbody className='animate-pulse text-transparent'>
                    {
                        arr.map((num, index) => {
                            return (
                                <tr key={index}>
                                    <td className=' h-[50px] flex items-center gap-2'>
                                        <div className='h-12 w-12 fallback-bg-color rounded-full'></div>
                                        <div className='fallback-bg-color rounded-md'>
                                            0xf39F...2266
                                        </div>
                                    </td>

                                    <td className=" h-[50px]">
                                        <div className='fallback-bg-color rounded-md'>
                                            31/12/1969, 21:06:36 PM
                                        </div>
                                    </td>

                                    <td className="w-[50px] h-[50px]">
                                        <div className='fallback-bg-color rounded-md'>
                                            100
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    }

                </tbody>
            </table>
        </div>
    )
}


interface User {
    username:string,
    picture_url:string
}

function RuleLeaderboard({cartridge_id, rule, get_verification_outputs = false}:{
    cartridge_id:string, rule: string | undefined, get_verification_outputs: boolean}) {
    const [tapePayloads, setTapePayloads] = useState<VerifyPayloadInput[]|VerificationOutput[]|null>(null);
    const [addressUserMap, setAddressUserMap] = useState<Record<string, User>>({});

    // pagenation state
    const [currPage, setCurrPage] = useState(1);
    const [pageToLoad, setPageToLoad] = useState(1);
    const [atEnd, setAtEnd] = useState(false);
    const [oldRule, setOldRule] = useState<string>();

    // user
    //const [{ wallet }] = useConnectWallet();
    //const userAddress = wallet? wallet.accounts[0].address.toLocaleLowerCase(): null;
    const userAddress = null;


    const reloadScores = async (page: number) => {
        if (!rule) return null;
        return (await getGeneralVerificationPayloads(cartridge_id, rule, page, get_verification_outputs))
    }

    const previousPage = () => {
        setPageToLoad(currPage-1);
    }

    const nextPage = () => {
        setPageToLoad(currPage+1);
    }

    useEffect(() => {
        let newRule = false;
        let page = pageToLoad;
        if (rule != oldRule) {
            setTapePayloads(null);
            setOldRule(rule);
            newRule = true;
            page = 1;
        }
        if (currPage == pageToLoad && !newRule) return;
        if (tapePayloads) setTapePayloads(null) // set to null to trigger the loading effect

        reloadScores(page).then((res) => {
            if (!res) return;

            let addresses:Set<string> = new Set();

            const scores = res.data;
            scores.forEach((score) => {
                const verification_outputs = score instanceof VerificationOutput;
                const sender = verification_outputs ? score.user_address : score._msgSender;
                addresses.add(sender);
            })

            getUsersByAddress(Array.from(addresses)).then((res:string) => {
                const users = JSON.parse(res).data;

                let user;
                let userMap:Record<string, User> = {};
                for (let i = 0; i < users.length; i++) {
                    user = users[i];

                    if (user["linked_accounts"].length != 2) continue;

                    let wallet_account;
                    let twitter_account;

                    if (user["linked_accounts"][0].type == "wallet") {
                        wallet_account = user["linked_accounts"][0];
                        twitter_account = user["linked_accounts"][1];
                    } else if (user["linked_accounts"][0].type == "twitter_oauth") {
                        twitter_account = user["linked_accounts"][0];
                        wallet_account = user["linked_accounts"][1];
                    }

                    if (! (wallet_account && twitter_account)) continue;

                    userMap[wallet_account.address.toLowerCase()] = {
                        username: twitter_account.name,
                        picture_url: twitter_account.profile_picture_url
                    }
                }

                setAddressUserMap({...addressUserMap, ...userMap});
                setTapePayloads(scores);
            });

            setAtEnd(res.total <= page * DEFAULT_PAGE_SIZE);
            setCurrPage(page);
            setPageToLoad(page);
        });
    }, [pageToLoad, rule, get_verification_outputs])

    useEffect(() => {
        setTapePayloads(null);
    }, [cartridge_id])

    if (!rule) {
        return (
            <div className='relative text-center'>
                {/* <span>No rule selected!</span> */}
            </div>
        )
    }

    if (!tapePayloads) {
        return tapesBoardFallback();
    }

    if (tapePayloads.length == 0) {
        return (
            <div className='relative text-center'>
                <span>No tapes!</span>
            </div>
        )
    }

    function getTapeId(tapeHex: string): String {
        return sha256(ethers.utils.arrayify(tapeHex));
    }

    return (
        <div className="relative min-h-[480px]">
            <table className="w-full text-left">
                <thead className="text-xsuppercase">
                    <tr>
                        <th scope="col" className="px-2 py-3">
                            User
                        </th>
                        <th scope="col" className="px-2 py-3">
                            Timestamp
                        </th>
                        <th scope="col" className="px-2 py-3">
                            Score
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {
                        tapePayloads.map((tape, index) => {
                            const verification_outputs = tape instanceof VerificationOutput;
                            const tapets = verification_outputs ? tape.timestamp : tape._timestamp;
                            const tapeDate = new Date(Number(tapets)*1000);
                            const sender = verification_outputs ? tape.user_address : tape._msgSender;
                            const tapeId = verification_outputs ? tape.tape_hash.slice(2) : getTapeId(tape.tape);
                            const score = verification_outputs ? tape.score.toString() : "-";
                            const userTape = userAddress == sender?.toLocaleLowerCase();

                            const user = addressUserMap[sender.toLowerCase()];

                            return (
                                <tr key={index} onClick={() => window.open(`/tapes/${tapeId}`, "_blank", "noopener,noreferrer")}
                                className={`p-4 hover:bg-rives-purple hover:text-black ${userTape? "bg-gray-500":""}`}
                                style={{cursor: "pointer"}}
                                >
                                    {
                                        !user?
                                            <td className='flex items-center gap-2'>
                                                <Image width={48} height={48} src={rivesCheck} className='rounded-full' alt='Nop' />
                                                <span title={sender}>{sender?.substring(0,6)+"..."+sender?.substring(sender?.length-4,sender?.length)}</span>
                                            </td>
                                        :
                                            <td className='flex items-center gap-2'>
                                                <img width={48} height={48} src={user? user.picture_url:""} className='rounded-full' alt='Nop' />
                                                <span title={sender}>{user.username}</span>
                                            </td>
                                    }

                                    <td title={tapeDate.toLocaleString()} className="px-2 py-2">
                                        {tapeDate.toLocaleDateString()} {tapeDate.toLocaleTimeString()}
                                    </td>
                                    <td>{score}</td>
                                </tr>
                            );
                        })
                    }
                </tbody>
            </table>

            <div className='flex justify-center items-center space-x-1'>
                    <button disabled={currPage == 1} onClick={previousPage} className={`border border-transparent ${currPage != 1? "hover:border-black":""}`}>
                        <NavigateBeforeIcon />
                    </button>
                    <span>
                        {currPage} of {total_pages}
                    </span>
                    <button disabled={atEnd} onClick={nextPage} className={`border border-transparent ${!atEnd? "hover:border-black":""}`}>
                        <NavigateNextIcon />                
                    </button>
            </div>
        </div>
    )
}

export default RuleLeaderboard;
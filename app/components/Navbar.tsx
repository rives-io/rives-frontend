'use client'

import Link from 'next/link'
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from 'react'
//import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import rivesLogo from '@/public/logo.png';
import MenuIcon from '@mui/icons-material/Menu';
import { Menu } from '@headlessui/react'
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import { monogram } from '../utils/monogramExtendedFont';

function Navbar() {
    const pathname = usePathname();
    const [connectButtonTxt, setConnectButtonTxt] = useState<React.JSX.Element>(<span className={`text-4xl ${monogram.className}`}>Connect</span>);
    const {ready, authenticated, login, logout, user, linkTwitter} = usePrivy();
    // Disable login when Privy is not ready or the user is already authenticated
    const disableLogin = !ready || (ready && authenticated);


    useEffect(() => {
        if (!user) {
            setConnectButtonTxt(<span className={`text-4xl ${monogram.className}`}>Connect</span>);
            return;
        }

        // if ((ready && authenticated) && !user.twitter) {
        //     linkTwitter();
        // }
        const userAddress = user.wallet?.address;

        if (!userAddress) return;

        if (!user.twitter) {
            setConnectButtonTxt(
                <>
                    <span className={`text-4xl ${monogram.className}`}>Disconnect</span>
                    <span className='text-[10px] opacity-50'>
                        {userAddress.slice(0, 6)}...{userAddress.slice(userAddress.length-4)}
                    </span>
                </>
            )
        } else {
            setConnectButtonTxt(
                <>
                    <span className='text-[10px] opacity-50'>
                        {user.twitter.username}
                    </span>
                    <span className={`text-4xl ${monogram.className}`}>Disconnect</span>
                    {
                        userAddress?
                            <span className='text-[10px] opacity-50'>
                                {userAddress.slice(0, 6)}...{userAddress.slice(userAddress.length-4)}
                            </span>
                        :
                            <></>
                    }
                </>
            )
        }
    }, [user])

    return (
        <header className='header'>
            <Link href={"/"} className={`min-w-24 grid grid-cols-1 items-center navbar-item ${pathname === "/" ? "lg:link-active" : "" }`}>
                <div className='w-28 h-16'>
                    <Image
                        src={rivesLogo}
                        layout="fit"
                        quality={100}
                        alt='rives logo'
                    />
                </div>
            </Link>

            <Link href={"/cartridges"} className={`hidden lg:grid grid-cols-1 h-full items-center navbar-item ${pathname.startsWith("/cartridges") ? "lg:link-active" : "" }`}>
                <span className={`text-4xl ${monogram.className}`}>Cartridges</span>
            </Link>

            <Link href={"/contests"} className={`hidden lg:grid grid-cols-1 h-full items-center navbar-item ${pathname.startsWith("/contests") ? "lg:link-active" : "" }`}>
            <span className={`text-4xl ${monogram.className}`}>Contests</span>
            </Link>

            <Link href={"/tapes"} className={`hidden lg:grid grid-cols-1 h-full items-center navbar-item ${pathname.startsWith("/tapes") ? "lg:link-active" : "" }`}>
                <span className={`text-4xl ${monogram.className}`}>Tapes</span>
            </Link>

            <Link href={"/upload-cartridges"}className={`hidden lg:grid grid-cols-1 h-full items-center navbar-item ${pathname.startsWith("/upload-cartridges") ? "lg:link-active" : "" }`}>
                <span className={`text-4xl ${monogram.className}`} style={{lineHeight: "1.5rem"}} >Upload Cartridges</span>
            </Link>

            <div className='hidden lg:flex flex-1 justify-end h-full'>
                <button className='navbar-item'
                    disabled={!ready}
                    onClick={disableLogin?logout:login}
                    title={user?.wallet?.address}
                >
                    <div className='flex flex-col justify-center h-full'>
                        {connectButtonTxt}
                    </div>
                </button>
            </div>

            <Menu as="div" className="lg:hidden navbar-item ms-auto">
                <Menu.Button className="h-full flex flex-col justify-center"><MenuIcon className='text-5xl' /></Menu.Button>
                <Menu.Items className="absolute right-0 mt-2 w-full origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <div className="px-1 py-1 ">
                        <Menu.Item>
                            {({ active }) => (
                                <Link 
                                href={"/cartridges"} 
                                className={`${pathname === "/cartridges" || active? 'bg-rives-purple text-white' : 'text-black' 
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                                    Cartridges
                                </Link>
                            )}
                        </Menu.Item>
                    </div>

                    <div className="px-1 py-1 ">
                        <Menu.Item>
                            {({ active }) => (
                                <Link 
                                href={"/contests"} 
                                className={`${pathname === "/contests" || active ? 'bg-rives-purple text-white' : 'text-black'
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                                    Contests
                                </Link>
                            )}
                        </Menu.Item>
                    </div>

                    <div className="px-1 py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <Link 
                                href={"/tapes"} 
                                className={`${pathname === "/tapes" || active ? 'bg-rives-purple text-white' : 'text-black'
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                                    Tapes
                                </Link>
                            )}
                        </Menu.Item>
                    </div>

                    <div className="px-1 py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <div className='flex-1 flex justify-end h-full'>
                                    <button 
                                    className={`${active ? 'bg-rives-purple text-white' : 'text-black'
                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`} 
                                    disabled={!ready}
                                    onClick={disableLogin?logout:login}
                                    title={user?.wallet?.address}
                                    >
                                        <div className='flex flex-col justify-center h-full'>
                                            {connectButtonTxt}
                                        </div>
                                    </button>
                                </div>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Menu>
        </header>
    )
}

export default Navbar
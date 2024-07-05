'use client'

import Link from 'next/link'
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from 'react'
import rivesLogo from '@/public/logo.png';
import MenuIcon from '@mui/icons-material/Menu';
import { Menu } from '@headlessui/react'
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';

function Navbar() {
    const pathname = usePathname();
    const [connectButtonTxt, setConnectButtonTxt] = useState<React.JSX.Element>(<span className={`text-4xl pixelated-font`}>Connect</span>);
    const {ready, authenticated, login, user} = usePrivy();
    // Disable login when Privy is not ready or the user is already authenticated
    const disableLogin = !ready || (ready && authenticated);

    const onMyProfile = (ready && authenticated) && pathname.startsWith("/profile") && user?.wallet?.address.toLowerCase() == pathname.split("/")[2]?.toLowerCase();


    useEffect(() => {
        if (!user) {
            setConnectButtonTxt(<span className={`text-sm md:text-xl pixelated-font`}>Connect</span>);
            return;
        }

        const userAddress = user.wallet?.address;

        if (!userAddress) return;

        setConnectButtonTxt(
            <Link href={`/profile/${userAddress}`} className={`text-sm md:text-xl pixelated-font`}>Profile</Link>
        );
    }, [user])

    return (
        <header className='header'>
            <Link href={"/"} className={`min-w-24 grid grid-cols-1 items-center navbar-item ${pathname === "/" ? "md:link-active" : "" }`}>
                <div className='w-28 h-16'>
                    <Image
                        src={rivesLogo}
                        quality={100}
                        alt='rives logo'
                    />
                </div>
            </Link>

            <Link href={"/cartridges"} className={`hidden md:grid grid-cols-1 h-full items-center navbar-item ${pathname.startsWith("/cartridges") ? "md:link-active" : "" }`}>
                <span className={`text-xl pixelated-font`}>Cartridges</span>
            </Link>

            <Link href={"/contests"} className={`hidden md:grid grid-cols-1 h-full items-center navbar-item ${pathname.startsWith("/contests") ? "md:link-active" : "" }`}>
            <span className={`text-xl pixelated-font`}>Contests</span>
            </Link>

            <Link href={"/tapes"} className={`hidden md:grid grid-cols-1 h-full items-center navbar-item ${pathname.startsWith("/tapes") ? "md:link-active" : "" }`}>
                <span className={`text-xl pixelated-font`}>Tapes</span>
            </Link>

            <div className='hidden md:flex flex-1 justify-end h-full'>
                <button className={`navbar-item ${onMyProfile? "md:link-active" : "" }`}
                    disabled={!ready}
                    onClick={!disableLogin?login:undefined}
                    title={user?.wallet?.address}
                >
                    <div className='flex flex-col justify-center h-full'>
                        {connectButtonTxt}
                    </div>
                </button>
            </div>

            <Menu as="div" className="md:hidden navbar-item ms-auto">
                <Menu.Button className="h-full flex flex-col justify-center"><MenuIcon className='text-5xl' /></Menu.Button>
                <Menu.Items className="absolute right-0 mt-2 w-full origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <div className="px-1 py-1 ">
                        <Menu.Item>
                            {({ active }) => (
                                <Link 
                                href={"/cartridges"} 
                                className={`${pathname === "/cartridges" || active? 'bg-rives-purple text-white' : 'text-black' 
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm pixelated-font`}>
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
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm pixelated-font`}>
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
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm pixelated-font`}>
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
                                    onClick={!disableLogin?login:undefined}
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
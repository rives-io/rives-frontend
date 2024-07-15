"use client"


import { useEffect, useState } from "react";
import { getCartridges } from "../utils/util";
import { CartridgeInfo } from "../backend-libs/core/ifaces";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CartridgeCard from "./CartridgeCard";
import Loading from "./Loading";
import { getUserCartridges } from "../utils/assets";
import { CartridgesOutput } from "../backend-libs/core/ifaces";


export default function UserCartridges({address}:{address:string}) {
    const [cartridgesCreated, setCartridgesCreated] = useState<Array<Array<CartridgeInfo>>>([]);
    const [cartridgesCreatedPage, setCartridgesCreatedPage] = useState(0);
    
    const [cartridgesCollect, setCartridgesCollect] = useState<Array<Array<CartridgeInfo>>>([]);
    const [cartridgesCollectedPage, setCartridgesCollectedPage] = useState(0);
    
    const [cartridgesCreatedPageToLoad, setCartridgesCreatedPageToLoad] = useState(1);
    const [totalCartridgesCreatedPages, setTotalCartridgesCreatedPages] = useState(-1);

    const [cartridgesCollectedPageToLoad, setCartridgesCollectedPageToLoad] = useState(1);
    const [totalCartridgesCollectedPages, setTotalCartridgesCollectedPages] = useState(-1);

    const [cartridgesCreatedLoading, setCartridgesCreatedLoading] = useState(true);
    const [cartridgesCollectedLoading, setCartridgesCollectedLoading] = useState(true);
    
    const [cartridgesCollectedList, setCartridgesCollectedList] = useState<Array<string>>([]);

    const disablePrevCartridgesCreatedPage = cartridgesCreatedPage == 1;
    const disablePrevCartridgesCollectedPage = cartridgesCollectedPage == 1;

    const disableNextCartridgesCreatedPage = cartridgesCreatedPage == totalCartridgesCreatedPages;
    const disableNextCartridgesCollectedPage = cartridgesCollectedPage == totalCartridgesCollectedPages;

    const CartridgesCreatedByProfile = async () => {
        if (cartridgesCreated[cartridgesCreatedPageToLoad-1]) {
            setCartridgesCreatedPage(cartridgesCreatedPageToLoad);
            setCartridgesCreatedLoading(false);
            return;
        }

        setCartridgesCreatedLoading(true);

        const page_size = 6;

        const res:CartridgesOutput = await getCartridges(
            {
                currentPage: cartridgesCreatedPageToLoad,
                pageSize: page_size,
                user_address: address,
                orderBy: "timestamp",
                orderDir: "desc",
                getCover:true
            }
        )
    
        const new_total_pages = Math.ceil(res.total / page_size);
        if (totalCartridgesCreatedPages != new_total_pages) setTotalCartridgesCreatedPages(new_total_pages);

        setCartridgesCreated([...cartridgesCreated, res.data]);
        setCartridgesCreatedPage(cartridgesCreatedPageToLoad);
        setCartridgesCreatedLoading(false);
    }

    const nextCreatedCartridgesPage = () => {
        setCartridgesCreatedPageToLoad(cartridgesCreatedPageToLoad+1);
    }

    const prevCreatedCartridgesPage = () => {
        setCartridgesCreatedPageToLoad(cartridgesCreatedPageToLoad-1);
    }

    const CartridgesCollectedByProfile = async () => {
        if (cartridgesCollectedList.length == 0 || cartridgesCollect[cartridgesCollectedPageToLoad-1]) {
            setCartridgesCollectedLoading(false);
            return;
        }

        setCartridgesCollectedLoading(true);

        const page_size = 6;

        const res:CartridgesOutput = await getCartridges(
            {
                cartridgeIds: cartridgesCollectedList, 
                currentPage: cartridgesCollectedPageToLoad,
                pageSize: page_size,
                orderBy: "timestamp",
                orderDir: "desc",
                getCover:true
            }
        )
    
        const new_total_pages = Math.ceil(res.total / page_size);
        if (totalCartridgesCollectedPages != new_total_pages) setTotalCartridgesCollectedPages(new_total_pages);

        setCartridgesCollect([...cartridgesCollect, res.data]);
        setCartridgesCollectedPage(cartridgesCollectedPageToLoad);
        setCartridgesCollectedLoading(false);
    }

    const nextCollectedCartridgesPage = () => {
        setCartridgesCollectedPageToLoad(cartridgesCollectedPageToLoad+1);
    }

    const prevCollectedCartridgesPage = () => {
        setCartridgesCollectedPageToLoad(cartridgesCollectedPageToLoad-1);
    }


    useEffect(() => {
        CartridgesCreatedByProfile();
        getUserCartridges(address).then(out => setCartridgesCollectedList(out.map((t,i) => t.slice(2))));
    }, [])

    useEffect(() => {
        CartridgesCollectedByProfile();
    }, [cartridgesCollectedList])


    useEffect(() => {
        CartridgesCreatedByProfile();
    }, [cartridgesCreatedPageToLoad])

    useEffect(() => {
        CartridgesCollectedByProfile();
    }, [cartridgesCollectedPageToLoad])


    return (
        <div>
            <div className="flex flex-col gap-4">
                <div className='w-full lg:w-[80%]'>
                        <h1 className={`text-2xl pixelated-font`}>Cartridges Created</h1>
                </div>

                {
                    cartridgesCreatedLoading?
                        <Loading msg="Loading Created Cartridges" />
                    :
                        <>
                            <div className="flex flex-wrap gap-4 justify-evenly md:justify-start">
                                {
                                    cartridgesCreated[cartridgesCreatedPage-1]?.map((cartridge, index) => {
                                        return (
                                            <CartridgeCard key={`${cartridgesCreatedPage}-${index}`} cartridge={cartridge} />
                                        )
                                    })
                                }

                            </div>

                            {
                                cartridgesCreated.length == 0 || cartridgesCreated[0].length == 0?
                                    totalCartridgesCollectedPages != -1?
                                        <div className="text-center pixelated-font">No Cartridges Created</div>
                                    :
                                        <></>
                                :
                                    <div className='flex justify-center items-center space-x-1'>
                                        <button disabled={disablePrevCartridgesCreatedPage} onClick={prevCreatedCartridgesPage} className={`border border-transparent ${disablePrevCartridgesCreatedPage? "":"hover:border-black"}`}>
                                            <NavigateBeforeIcon />
                                        </button>
                                        <span>
                                            {cartridgesCreatedPage} of {totalCartridgesCreatedPages}
                                        </span>
                                        <button disabled={disableNextCartridgesCreatedPage} onClick={nextCreatedCartridgesPage} className={`border border-transparent ${disableNextCartridgesCreatedPage? "":"hover:border-black"}`}>
                                            <NavigateNextIcon />                
                                        </button>
                                    </div>

                            }
                        </>
                }
            </div>

            <div className="flex flex-col gap-4">
                <div className='w-full lg:w-[80%]'>
                    <h1 className={`text-2xl pixelated-font`}>Cartridges Collected</h1>
                </div>

                {
                    cartridgesCollectedLoading?
                        <Loading msg="Loading Created Cartridges" />
                    :
                    <>
                        <div className="flex flex-wrap gap-4">
                            {
                                cartridgesCollect[cartridgesCollectedPage-1]?.map((cartridge, index) => {
                                    return (
                                        <CartridgeCard key={`${cartridgesCollectedPage}-${index}`} cartridge={cartridge} />
                                    )
                                })
                            }

                        </div>

                        {
                            cartridgesCollect.length == 0 || cartridgesCollect[0].length == 0?
                                totalCartridgesCollectedPages != -1?
                                    <div className="text-center pixelated-font">No Cartridges Collected</div>
                                :
                                    <></>
                            :
                                <div className='flex justify-center items-center space-x-1'>
                                    <button disabled={disablePrevCartridgesCollectedPage} onClick={prevCollectedCartridgesPage} className={`border border-transparent ${disablePrevCartridgesCollectedPage? "":"hover:border-black"}`}>
                                        <NavigateBeforeIcon />
                                    </button>
                                    <span>
                                        {cartridgesCollectedPage} of {totalCartridgesCollectedPages}
                                    </span>
                                    <button disabled={disableNextCartridgesCollectedPage} onClick={nextCollectedCartridgesPage} className={`border border-transparent ${disableNextCartridgesCollectedPage? "":"hover:border-black"}`}>
                                        <NavigateNextIcon />                
                                    </button>
                                </div>
                        }
                    </>}
            </div>
        </div>
    )
}
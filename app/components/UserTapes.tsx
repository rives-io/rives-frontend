"use client"


import { useEffect, useState } from "react";
import { DecodedIndexerOutput } from "../backend-libs/cartesapp/lib";
import { getTapes, getUsersFromTapes } from "../utils/util";
import { VerifyPayload } from "../backend-libs/core/lib";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import TapeCard from "./TapeCard";
import Loading from "./Loading";
import { getUserTapes } from "../utils/assets";
import { User } from "../utils/privyApi";


export default function UserTapes({address, twitterInfo}:{address:string, twitterInfo:User}) {
    const [tapesCreated, setTapesCreated] = useState<Array<Array<VerifyPayload>>>([]);
    const [tapesCreatedPage, setTapesCreatedPage] = useState(0);
    
    const [tapesCollect, setTapesCollect] = useState<Array<Array<VerifyPayload>>>([]);
    const [tapesCollectedPage, setTapesCollectedPage] = useState(0);
    
    const [tapesCreatedPageToLoad, setTapesCreatedPageToLoad] = useState(1);
    const [totalTapesCreatedPages, setTotalTapesCreatedPages] = useState(-1);

    const [tapesCollectedPageToLoad, setTapesCollectedPageToLoad] = useState(1);
    const [totalTapesCollectedPages, setTotalTapesCollectedPages] = useState(-1);

    const [tapesCreatedLoading, setTapesCreatedLoading] = useState(true);
    const [tapesCollectedLoading, setTapesCollectedLoading] = useState(true);
    
    const [tapesCollectedList, setTapesCollectedList] = useState<Array<string>>([]);

    const disablePrevTapesCreatedPage = tapesCreatedPage == 1;
    const disablePrevTapesCollectedPage = tapesCollectedPage == 1;
    
    const disableNextTapesCreatedPage = tapesCreatedPage == totalTapesCreatedPages;
    const disableNextTapesCollectedPage = tapesCollectedPage == totalTapesCollectedPages;

    const [userMap, setUserMap] = useState<Record<string, User>>({});

    const TapesCreatedByProfile = async () => {
        if (tapesCreated[tapesCreatedPageToLoad-1]) {
            setTapesCreatedPage(tapesCreatedPageToLoad);
            setTapesCreatedLoading(false);
            return;
        }

        setTapesCreatedLoading(true);

        const page_size = 6;

        const res:DecodedIndexerOutput = await getTapes(
            {
                currentPage: tapesCreatedPageToLoad,
                pageSize: page_size,
                msg_sender: address,
                orderBy: "timestamp",
                orderDir: "desc"
            }
        )
    
        const new_total_pages = Math.ceil(res.total / page_size);
        if (totalTapesCreatedPages != new_total_pages) setTotalTapesCreatedPages(new_total_pages);

        setTapesCreated([...tapesCreated, res.data]);
        setTapesCreatedPage(tapesCreatedPageToLoad);
        setTapesCreatedLoading(false);
    }

    const nextCreatedTapesPage = () => {
        setTapesCreatedPageToLoad(tapesCreatedPageToLoad+1);
    }

    const prevCreatedTapesPage = () => {
        setTapesCreatedPageToLoad(tapesCreatedPageToLoad-1);
    }

    const TapesCollectedByProfile = async () => {
        if (tapesCollectedList.length == 0 || tapesCollect[tapesCollectedPageToLoad-1]) {
            setTapesCollectedPage(tapesCollectedPageToLoad);
            setTotalTapesCollectedPages(0);
            setTapesCollectedLoading(false);
            return;
        }

        setTapesCollectedLoading(true);

        const page_size = 6;

        let tapes:VerifyPayload[] = [];
        const begin = page_size*(tapesCollectedPageToLoad-1)
        for (let i = begin; i < tapesCollectedList.length; i++) {
            const tapeId = tapesCollectedList[i];
            const res:DecodedIndexerOutput = await getTapes(
                {
                    tapeIds: [tapeId], 
                    currentPage: 1,
                    pageSize: 1,
                }
            );

            if (res.data.length == 0) continue;
            
            tapes.push(res.data[0])
        }

        const newUserMap:Record<string, User> = await getUsersFromTapes(tapes, userMap);
        if (Object.keys(newUserMap).length > 0) setUserMap({...userMap, ...newUserMap});

        // const res:DecodedIndexerOutput = await getTapes(
        //     {
        //         tapeIds: tapesCollectedList, 
        //         currentPage: tapesCollectedPageToLoad,
        //         pageSize: page_size,
        //         orderBy: "timestamp",
        //         orderDir: "desc"
        //     }
        // )
    
        //const new_total_pages = Math.ceil(res.total / page_size);
        const new_total_pages = Math.ceil(tapesCollectedList.length/page_size);
        if (totalTapesCollectedPages != new_total_pages) setTotalTapesCollectedPages(new_total_pages);

        //setTapesCollect([...tapesCollect, res.data]);
        setTapesCollect([...tapesCollect, tapes]);
        //setTapesCollectedPage({curr: tapesCollectedPageToLoad, atEnd: res.total <= tapesCollectedPageToLoad * page_size});
        setTapesCollectedPage(tapesCollectedPageToLoad);
        setTapesCollectedLoading(false);
    }

    const nextCollectedTapesPage = () => {
        setTapesCollectedPageToLoad(tapesCollectedPageToLoad+1);
    }

    const prevCollectedTapesPage = () => {
        setTapesCollectedPageToLoad(tapesCollectedPageToLoad-1);
    }


    useEffect(() => {
        TapesCreatedByProfile();
        getUserTapes(address).then(out => setTapesCollectedList(out.map((t,i) => t.slice(2))));
    }, [])

    useEffect(() => {
        TapesCollectedByProfile();
    }, [tapesCollectedList])


    useEffect(() => {
        TapesCreatedByProfile();
    }, [tapesCreatedPageToLoad])

    useEffect(() => {
        TapesCollectedByProfile();
    }, [tapesCollectedPageToLoad])


    return (
        <div>
            <div className="flex flex-col gap-4">
                <div className='w-full lg:w-[80%]'>
                        <h1 className={`text-2xl pixelated-font`}>Tapes Created</h1>
                </div>

                {
                    tapesCreatedLoading?
                        <Loading msg="Loading Created Tapes" />
                    :
                        <>
                            <div className="flex justify-center">
                                <div className="flex flex-wrap justify-center md:grid md:grid-cols-3 gap-4">
                                    {
                                        tapesCreated[tapesCreatedPage-1]?.map((tape, index) => {
                                            return (
                                                <TapeCard key={`${tapesCreatedPage}-${index}`} tapeInput={tape} creator={twitterInfo? twitterInfo:null} />
                                            )
                                        })
                                    }
                                </div>
                            </div>

                            {
                                tapesCreated.length == 0 || tapesCreated[0].length == 0?
                                    totalTapesCreatedPages != -1?
                                        <div className="text-center pixelated-font">No Tapes Created</div>
                                    :
                                        <></>
                                :
                                    <div className='flex justify-center items-center space-x-1'>
                                        <button disabled={disablePrevTapesCreatedPage} onClick={prevCreatedTapesPage} className={`border border-transparent ${disablePrevTapesCreatedPage? "":"hover:border-black"}`}>
                                            <NavigateBeforeIcon />
                                        </button>
                                        <span>
                                            {tapesCreatedPage} of {totalTapesCreatedPages}
                                        </span>
                                        <button disabled={disableNextTapesCreatedPage} onClick={nextCreatedTapesPage} className={`border border-transparent ${disableNextTapesCreatedPage? "":"hover:border-black"}`}>
                                            <NavigateNextIcon />                
                                        </button>
                                    </div>

                            }
                        </>
                }
            </div>

            <div className="flex flex-col gap-4">
                <div className='w-full lg:w-[80%]'>
                    <h1 className={`text-2xl pixelated-font`}>Tapes Collected</h1>
                </div>
                { 
                    tapesCollectedLoading?
                        <Loading msg="Loading Created Tapes" />
                    : <>
                        <div className="flex justify-center">
                            <div className="flex flex-wrap justify-center md:grid md:grid-cols-3 gap-4">
                                {
                                    tapesCollect[tapesCollectedPage-1]?.map((tape, index) => {
                                        return (
                                            <TapeCard key={`${tapesCollectedPage}-${index}`} tapeInput={tape} creator={userMap[tape._msgSender.toLowerCase()] || null} />
                                        )
                                    })
                                }
                            </div>
                        </div>

                        {
                            tapesCollect.length == 0 || tapesCollect[0].length == 0?
                                totalTapesCollectedPages != -1?
                                    <div className="text-center pixelated-font">No Tapes Collected</div>
                                :
                                    <></>
                            :
                                <div className='flex justify-center items-center space-x-1'>
                                    <button disabled={disablePrevTapesCollectedPage} onClick={prevCollectedTapesPage} className={`border border-transparent ${disablePrevTapesCollectedPage? "":"hover:border-black"}`}>
                                        <NavigateBeforeIcon />
                                    </button>
                                    <span>
                                        {tapesCollectedPage} of {totalTapesCollectedPages}
                                    </span>
                                    <button disabled={disableNextTapesCollectedPage} onClick={nextCollectedTapesPage} className={`border border-transparent ${disableNextTapesCollectedPage? "":"hover:border-black"}`}>
                                        <NavigateNextIcon />                
                                    </button>
                                </div>
                        } 
                    </>
                }
            </div>
        </div>
    )
}
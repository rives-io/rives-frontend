"use client"


import { useEffect, useState } from "react";
import { DecodedIndexerOutput } from "../backend-libs/cartesapp/lib";
import { getTapes } from "../utils/util";
import { VerifyPayload } from "../backend-libs/core/lib";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import TapeCard from "./TapeCard";
import Loading from "./Loading";


export default function CartridgeTapes({cartridgeId, ruleId}:{cartridgeId:string, ruleId?:string}) {
    const [tapes, setTapes] = useState<Array<Array<VerifyPayload>>>([]);
    const [tapesPage, setTapesPage] = useState(0);
        
    const [tapesPageToLoad, setTapesPageToLoad] = useState(1);
    const [totalTapesPages, setTotalTapesPages] = useState(-1);

    const [loading, setLoading] = useState(false);

    const [reload, setReload] = useState(0);

    const disablePrevPage = tapesPage == 1;
    const disableNextPage = tapesPage == totalTapesPages;

    const tapesByCartridge = async () => {
        if (tapes[tapesPageToLoad-1]) {
            setTapesPage(tapesPageToLoad);
            return;
        }

        setLoading(true);

        const page_size = 6;
        const res:DecodedIndexerOutput = await getTapes(
            {
                currentPage: tapesPageToLoad,
                pageSize: page_size,
                orderBy: "timestamp",
                orderDir: "desc",
                cartridgeId: cartridgeId,
                ruleId: ruleId
            }
        )
    
        const new_total_pages = Math.ceil(res.total / page_size);
        if (totalTapesPages != new_total_pages) setTotalTapesPages(new_total_pages);

        setTapes([...tapes, res.data]);
        setTapesPage(tapesPageToLoad);
        setLoading(false);
    }

    const nextTapesPage = () => {
        setTapesPageToLoad(tapesPageToLoad+1);
    }

    const prevTapesPage = () => {
        setTapesPageToLoad(tapesPageToLoad-1);
    }

    useEffect(() => {
        tapesByCartridge();
    }, [])

    useEffect(() => {
        console.log("rule changed");
        setTapes([]);
        setTapesPage(0);
        setTotalTapesPages(-1);
        
        if (tapesPageToLoad == 1) setReload(reload+1);
        else setTapesPageToLoad(1);

    }, [ruleId])

    useEffect(() => {
        console.log("running tapesByCartridge")
        tapesByCartridge();
    }, [tapesPageToLoad, reload])


    if (!ruleId) {
        return (
            <></>
        );
    }


    return (
        <div className="flex flex-col gap-4">
            {
                loading?
                    <div className="h-56">
                        <Loading msg="Loading Tapes" />
                    </div>
                :
                    <>
                        <div className="flex flex-wrap gap-4 justify-evenly md:justify-center">
                            {
                                tapes[tapesPage-1]?.map((tape, index) => {
                                    return (
                                        <TapeCard key={`${tapesPage}-${index}`} tapeInput={tape} />
                                    )
                                })
                            }

                        </div>

                        {
                            tapes.length == 0 || tapes[0].length == 0?
                                <></>
                            :
                                <div className='flex justify-center items-center space-x-1'>
                                    <button disabled={disablePrevPage} onClick={prevTapesPage} className={`border border-transparent ${disablePrevPage? "":"hover:border-black"}`}>
                                        <NavigateBeforeIcon />
                                    </button>
                                    <span>
                                        {tapesPage} of {totalTapesPages}
                                    </span>
                                    <button disabled={disableNextPage} onClick={nextTapesPage} className={`border border-transparent ${disableNextPage? "":"hover:border-black"}`}>
                                        <NavigateNextIcon />                
                                    </button>
                                </div>

                        }
                    </>
            }
        </div>
    )
}



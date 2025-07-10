"use client";
import { useState, useEffect, useRef, Fragment } from "react";

import { useSearchParams } from 'next/navigation'
import Image from "next/image";
import { Dialog, Transition } from '@headlessui/react';

import { Parser } from "expr-eval";
import { sendGAEvent } from '@next/third-parties/google';
import { ethers } from "ethers";
import { sha256 } from "js-sha256";

import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import rivesLogo from '../../public/logo.png';

import { envClient } from "../utils/clientEnv";
import { buildUrl, cartridgeIdFromBytes, generateEntropy, ruleIdFromBytes, getCartridgeInfo, getRuleInfo, timeToDateUTCString } from "@/app/utils/util";
import ErrorModal, { ERROR_FEEDBACK } from "@/app/components/ErrorModal";

import { getOutputs, rules } from "@/app/backend-libs/core/lib";
import Rivemu, { RivemuRef } from "@/app/components/Rivemu";
import { RuleInfo } from "@/app/backend-libs/core/ifaces";
import { sendScoreToB3 } from "./b3-contest-utils";

let canvasPlaying = false;


const getCartridgeData = async (cartridgeId:string): Promise<Uint8Array> => {
    const formatedCartridgeId = cartridgeId.substring(0, 2) === "0x"? cartridgeIdFromBytes(cartridgeId): cartridgeId;

    const response = await fetch(buildUrl(envClient.CARTRIDGES_URL, cartridgeId),
        {
            method: "GET",
            headers: {
                "Content-Type": "application/octet-stream",
            },
            mode: 'cors'
        }
    );
    const blob = await response.blob();
    const data = new Uint8Array(await blob.arrayBuffer());

    // const data = await cartridge(
    //     {
    //         id:formatedCartridgeId
    //     },
    //     {
    //         decode:true,
    //         decodeModel:"bytes",
    //         cartesiNodeUrl: envClient.CARTESI_NODE_URL
    //     }
    // );
    if (data.length > 0) return data;

    const out:Array<Uint8Array> = (await getOutputs(
        {
            tags: ['cartridge','cartridge_data',cartridgeId],
            type: 'report'
        },
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    )).data;
    if (out.length > 0) return out[0];

    throw new Error(`Cartridge ${formatedCartridgeId} not found!`);
}

const getRule = async (ruleId:string):Promise<RuleInfo> => {
    const formatedRuleId = ruleId;
    const data = await rules(
        {
            id:formatedRuleId,
            enable_deactivated: true,
            full:true
        },
        {
            decode:true,
            decodeModel:"RulesOutput",
            cartesiNodeUrl: envClient.CARTESI_NODE_URL
        }
    );
    
    if (data.total === 0 || data.data.length === 0) throw new Error(`Rule ${ruleId} not found!`);
    
    return data.data[0];
}

export default function NoSubmitRivemuPlayer(
        {rule_id}:
        {rule_id:string}) {
            
    const page = typeof window !== "undefined"? window.location.href:null;

    const searchParams = useSearchParams();
    const b3token = searchParams.get('token') || undefined;

    // rivemu state
    const [cartridgeData, setCartridgeData] = useState<Uint8Array>();
    const [rule, setRule] = useState<RuleInfo>();
    const [entropy, setEntropy] = useState<string>("");
    const [currScore, setCurrScore] = useState<number>();
    const [playing, setPlaying] = useState({isPlaying: false, playCounter: 0})
    const [loadingMessage, setLoadingMessage] = useState<string|undefined>("Initializing");
    const [errorMessage, setErrorMessage] = useState<string>();
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const [restarting, setRestarting] = useState(false);
    const [outhash, setOuthash] = useState<string|undefined>();
    const [finalScore, setFinalScore] = useState<number>();
    const [tape, setTape] = useState<Uint8Array>();

    const [errorFeedback, setErrorFeedback] = useState<ERROR_FEEDBACK>();

    const rivemuRef = useRef<RivemuRef>(null);

    useEffect(() => {
        console.log("Token from search params: ", b3token, rule_id); 
        let userAddress = "0x" + sha256(b3token || "").slice(0, 40); // token as address

        if (!b3token) {
            const error:ERROR_FEEDBACK = {
                severity: "alert",
                message: "You B3 token to submit your gameplay!",
                dismissible: true,
                dissmissFunction: () => setErrorFeedback(undefined)
            };
            setErrorFeedback(error);
        } else {

            const jwtSplitted = b3token.split(".");
            if (jwtSplitted.length < 3) {
                const error:ERROR_FEEDBACK = {
                    severity: "alert",
                    message: "Invalid jwt!",
                    dismissible: true,
                    dissmissFunction: () => setErrorFeedback(undefined)
                };
                setErrorFeedback(error);
            }
            const jwtHeader = JSON.parse(Buffer.from(jwtSplitted[0], "base64").toString('binary')); // decode header
            const jwtBody = JSON.parse(Buffer.from(jwtSplitted[1], "base64").toString('binary')); // decode header
            const jwtSecret = Buffer.from(jwtSplitted[2], "base64").toString('binary'); // decode header
            console.log(`Received B3 contest jwt: jwtHeader(${JSON.stringify(jwtHeader)}), jwtBody(${JSON.stringify(jwtBody)})`);

            if (!jwtHeader || !jwtBody || !jwtSecret || !jwtHeader.alg || jwtHeader.alg !== "HS256" ||  !jwtHeader.typ || jwtHeader.typ !== "JWT" || !jwtBody.address) {
                const error:ERROR_FEEDBACK = {
                    severity: "alert",
                    message: "Invalid B3 jwt!",
                    dismissible: true,
                    dissmissFunction: () => setErrorFeedback(undefined)
                };
                setErrorFeedback(error);
            }
            userAddress = jwtBody.address;
        }

        if (rule_id) {
            loadRule(rule_id,userAddress);
        }
        document.addEventListener("visibilitychange", (event) => {
            if (document.visibilityState == "hidden") {
                if (canvasPlaying) {
                    rivemuRef.current?.setSpeed(0);
                    setPaused(true);
                }
            }
        });

    }, []);

    const loadRule = (ruleId:string,userAddress:string) => {
        setLoadingMessage("Loading rule");
        getRule(ruleId).then((out: RuleInfo) => {
            if (!out) {
                setErrorMessage("Rule not found")
                return
            }
            setRule(out);
            setEntropy(generateEntropy(userAddress, out.id));
            setLoadingMessage("Loading cartridge");
            getCartridgeData(out.cartridge_id).then((data) => {
                if (!data) {
                    setErrorMessage("Cartridge not found")
                    return
                }
                setCartridgeData(data);
                setLoadingMessage(undefined);
            });
        });
    }

    if (errorMessage) {
        return (
            <span className="flex items-center justify-center h-lvh text-white">
                {errorMessage}
            </span>
        )
    }

    if (loadingMessage) {
        return (
            <div className="gameplay-screen flex flex-col items-center justify-center text-white">
                <Image className="animate-bounce" src={rivesLogo} alt='RiVES logo'/>
                <span>{loadingMessage}</span>
            </div>
        )
    }
    
    if (!(cartridgeData && rule)){
        return (
            <span className="flex items-center justify-center h-lvh text-white">
                No rule and cartridge
            </span>
        )
    }

    const parser = new Parser();
    const scoreFunctionEvaluator = rule?.score_function? parser.parse(rule.score_function):null;
    
    let decoder = new TextDecoder("utf-8");

    const rivemuOnFrame = function (
        outcard: ArrayBuffer,
        frame: number,
        cycles: number,
        fps: number,
        cpu_cost: number,
        cpu_speed: number,
        cpu_usage: number,
        cpu_quota: number
    ) {
        if (scoreFunctionEvaluator && decoder.decode(outcard.slice(0,4)) == 'JSON') {
            const outcard_str = decoder.decode(outcard);
            const outcard_json = JSON.parse(outcard_str.substring(4));
            setCurrScore(scoreFunctionEvaluator.evaluate(outcard_json));
        }

        if (page && page != window.location.href) {
            // rivemuRef will be null, call Rivemu directly
            
            // @ts-ignore:next-line
            Module.ccall('rivemu_stop')
        }
    };

    const rivemuOnBegin = function (width: number, height: number, target_fps: number, total_frames: number, info_data: Uint8Array) {
        console.log("rivemu_on_begin");
        canvasPlaying = true;
        setOuthash(undefined);
        setCurrScore(undefined);
        setFinalScore(undefined);
        setTape(undefined);
        if (rule?.score_function) {
            setCurrScore(0);
        }
        setRestarting(false);
    };

    const rivemuOnFinish = function (
        rivlog: ArrayBuffer,
        outcard: ArrayBuffer,
        outhash: string
    ) {
        rivemuRef.current?.stop();
        console.log("rivemu_on_finish")
        canvasPlaying = false;
        if (rule && !rule.deactivated && !restarting) {
            let score: number | undefined = undefined;
            if (scoreFunctionEvaluator && decoder.decode(outcard.slice(0,4)) == 'JSON') {
                const outcard_str = decoder.decode(outcard);
                const outcard_json = JSON.parse(outcard_str.substring(4));
                score = scoreFunctionEvaluator.evaluate(outcard_json);
                setFinalScore(score);
                setTape(new Uint8Array(rivlog))
                setOuthash(outhash);
            }
            if (document.fullscreenElement) document.exitFullscreen();
        }
        if (restarting)
            setPlaying({...playing, playCounter: playing.playCounter+1});
        else
            setPlaying({isPlaying:false, playCounter: playing.playCounter+1});
    };

    async function play() {
        const eventName = "Play";
        const eventLabel = `Play ${rule?.id}`
        sendGAEvent('event', eventName, { event_category: "Rivemu", event_label: eventLabel });

        setSpeed(1.0);
        setPaused(false);
        setRestarting(true);
        rivemuRef.current?.start();
        setPlaying({...playing, isPlaying: true});
    }

    async function pause() {
        if (playing.isPlaying) {
            if (paused){
                rivemuRef.current?.setSpeed(speed);
            } else {
                rivemuRef.current?.setSpeed(0);
            }
            setPaused(!paused);
        }
    }
      
    async function stop() {
        rivemuRef.current?.stop();
        setPlaying({...playing, isPlaying: false,});
    }

    return (
        <section className="flex flex-col items-center justify-center">
            <div>
                <div style={{justifyContent: "space-between"}} className='screen-controls flex items-center md:grid md:grid-cols-3 bg-gray-500 p-2'>
                    <div className="flex gap-2">
                        <button className="bg-gray-700 text-white border border-gray-700 hover:border-black"
                        title={"Play"}
                        onKeyDown={() => null} onKeyUp={() => null}
                        onClick={play}
                        onMouseDown={(event:any) => event.preventDefault()}>
                            <FiberManualRecordIcon/>
                        </button>
                        <button className="bg-gray-700 text-white border border-gray-700 hover:border-black"
                        title="Pause/Resume"
                        disabled={!playing.isPlaying}
                        onKeyDown={() => null} onKeyUp={() => null}
                        onClick={pause}
                        onMouseDown={(event:any) => event.preventDefault()}
                        >
                            <PauseIcon/>
                        </button>

                        <button className="bg-red-500 text-white border border-gray-700 hover:border-black"
                        title="Stop"
                        disabled={!playing.isPlaying}
                        onKeyDown={() => null} onKeyUp={() => null}
                        onClick={stop}
                        onMouseDown={(event:any) => event.preventDefault()}
                        >
                            <StopIcon/>
                        </button>

                    </div>

                    <div className={`pixelated-font text-center font-bold text-yellow-500 text-xs md:text-xl`}>
                        {currScore}
                    </div>

                    <div className="flex md:justify-end gap-2">

                        <button className="justify-self-end bg-gray-700 text-white border border-gray-700 hover:border-black"
                        title="Fullscreen"
                        disabled={!playing.isPlaying}
                        onKeyDown={() => null} onKeyUp={() => null}
                        onClick={rivemuRef.current?.fullScreen}
                        >
                            <FullscreenIcon/>
                        </button>
                    </div>

                </div>
                    
                <div className="relative">
                { !playing.isPlaying?
                    <button className={'absolute gameplay-screen text-gray-500 hover:text-white t-0 border border-gray-500'} onClick={play}
                    title={"Play"}>
                        <PlayArrowIcon className='text-7xl'/>
                    </button>
                : <></>
                }
                    <Rivemu ref={rivemuRef} cartridge_data={cartridgeData} args={rule.args} entropy={entropy}
                        in_card={rule.in_card ? ethers.utils.arrayify(rule.in_card) : new Uint8Array([])} 
                        rivemu_on_frame={rivemuOnFrame} rivemu_on_begin={rivemuOnBegin} rivemu_on_finish={rivemuOnFinish}
                    />
                </div>
            </div>
            <ScoreSubmitter jwt={b3token} score={finalScore} outhash={outhash} tape={tape} entropy={entropy} ruleId={rule.id}/>
            {errorFeedback ? <ErrorModal error={errorFeedback} /> : <></>}
        </section>
    )
}

enum MODAL_STATE {
    NOT_PREPARED,
    SUBMIT,
    SUBMITTING,
    SUBMITTED
}

function ScoreSubmitter({jwt,score,outhash,tape,entropy,ruleId}:{jwt?:string, score?:number, outhash?:string,tape?:Uint8Array,entropy?:string,ruleId?:string}) {

    // modal state variables
    const [modalState, setModalState] = useState({isOpen: false, state: MODAL_STATE.NOT_PREPARED});
    const [errorFeedback, setErrorFeedback] = useState<ERROR_FEEDBACK>();

    function closeModal() {
        setModalState({...modalState, isOpen: false})
    }
  
    function openModal() {
        setModalState({...modalState, isOpen: true})
    }

    useEffect(() => {
        if (modalState.isOpen) return; // do not open modal if already open
        if (!jwt || !score || !outhash || !tape || tape.length == 0 || !entropy || !ruleId) {
            setModalState({isOpen: false, state: MODAL_STATE.NOT_PREPARED});
            return;
        }
        // setModalState({isOpen: true, state: MODAL_STATE.SUBMIT});
        submitLog();
    }, [outhash, jwt, score])

    async function submitLog() {
        if (!jwt || !score || !outhash || !tape || tape.length == 0 || !entropy || !ruleId) {
            setErrorFeedback({message:"No gameplay data.", severity: "error", dismissible: true, dissmissFunction: () => setErrorFeedback(undefined)});
            return;
        }

        // submit the gameplay
        try {
            setModalState({isOpen: true, state: MODAL_STATE.SUBMITTING});
            const res = await sendScoreToB3(jwt, score, outhash,tape,entropy,ruleId)
            if (!res.success || res.error) {
                console.warn("Error submitting score: ", res.error);
                setModalState({...modalState, state: MODAL_STATE.SUBMIT});
                setErrorFeedback({message:"Couldn't submit score", severity: "error", dismissible: true, dissmissFunction: () => setErrorFeedback(undefined)});
                return;
            }

        } catch (error) {
            console.log(error)
            setModalState({...modalState, state: MODAL_STATE.SUBMIT});
            let errorMsg = (error as Error).message;
            setErrorFeedback({message:errorMsg, severity: "error", dismissible: true, dissmissFunction: () => setErrorFeedback(undefined)});
            return;
        }

        setModalState({isOpen: true, state: MODAL_STATE.SUBMITTED});
    }

    function submitModalBody() {
        let modalBodyContent:JSX.Element;

        if (modalState.state == MODAL_STATE.SUBMIT) {
            let submitText = "Submit";
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-gray-900 pixelated-font">
                        Submit your Score
                    </Dialog.Title>

                    <div className="mt-4 text-center">
                        <span className="pixelated-font text-2xl">Score: {score}</span>
                    </div>
    
                    <div className="flex pb-2 mt-4">
                        <button
                        className={`dialog-btn zoom-btn bg-red-400 text-black`}
                        type="button"
                        onClick={closeModal}
                        >
                            Cancel
                        </button>

                        <button
                        className={`dialog-btn zoom-btn bg-emerald-400 text-black`}
                        type="button"
                        onClick={submitLog}
                        >
                            {submitText}
                        </button>
                    </div>
                </>
            )
        } else if (modalState.state == MODAL_STATE.SUBMITTING) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 pixelated-font">
                        Submitting Gameplay
                    </Dialog.Title>
        
                    <div className="p-6 flex justify-center mt-4">
                        <div className='w-12 h-12 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
                    </div>

                </>
            )
        } else {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 pixelated-font">
                        Score Submitted!
                    </Dialog.Title>

                    <div className="mt-4 text-center">
                        <span className="pixelated-font text-2xl">Score: {score}</span>
                    </div>

                    <div className="mt-4 flex flex-col space-y-2">

                        <button className="dialog-btn zoom-btn bg-emerald-400 text-black"
                        onClick={closeModal}
                        >
                            Done
                        </button>
                    </div>
                </>
            )
        }

        return (
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-gray-500 p-4 shadow-xl transition-all flex flex-col items-center">
                {modalBodyContent}
            </Dialog.Panel>
        )
    }

    if (errorFeedback) {
        return <ErrorModal error={errorFeedback} />;
    }


    return (
        <>    
            <Transition appear show={modalState.isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/25" />
                    </Transition.Child>
            
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                {submitModalBody()}
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            {
                modalState.state != MODAL_STATE.NOT_PREPARED?  <>
                    <button className="zoom-btn dialog-btn fixed text-[10px] bg-rives-purple shadow right-5 bottom-40 z-20" onClick={() => {openModal()}}>
                        Open Submit
                    </button>
                    </>
                : 
                    <></> 
            }
        </>
    )
}

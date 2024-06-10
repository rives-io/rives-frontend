"use client"

import { Parser } from "expr-eval";
import { ethers } from "ethers";
import { useContext, useState, useEffect, useRef } from "react";
import { useConnectWallet } from '@web3-onboard/react';

import RestartIcon from '@mui/icons-material/RestartAlt';
import StopIcon from '@mui/icons-material/Stop';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import PauseIcon from '@mui/icons-material/Pause';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import FastForwardIcon from '@mui/icons-material/FastForward';
import { GIF_FRAME_FREQ, gameplayContext } from "../play/GameplayContextProvider";
import { sha256 } from "js-sha256";
import { envClient } from "../utils/clientEnv";
import { VerificationOutput, VerifyPayload, cartridge, getOutputs, rules } from "../backend-libs/core/lib";
import Rivemu, { RivemuRef } from "./Rivemu";
import { RuleInfo } from "../backend-libs/core/ifaces";
import { ContestStatus, formatBytes, getContestStatus, getContestStatusMessage } from "../utils/common";
import Image from "next/image";
import rivesLogo from '../../public/rives64px.png';


export interface TapeInfo {
    player?: string,
    timestamp?: string,
    size?: string,
    score?: string,
}


const getCartridgeData = async (cartridgeId:string) => {
    const formatedCartridgeId = cartridgeId.substring(0, 2) === "0x"? cartridgeId.slice(2): cartridgeId;
    const data = await cartridge(
        {
            id:formatedCartridgeId
        },
        {
            decode:true,
            decodeModel:"bytes",
            cartesiNodeUrl: envClient.CARTESI_NODE_URL,
            cache:"force-cache"
        }
    );
    
    if (data.length === 0) throw new Error(`Cartridge ${formatedCartridgeId} not found!`);
    
    return data;
}

export function generateEntropy(userAddress?:String, ruleId?:String): string {

    const hexRuleId = `0x${ruleId}`;
    if (!userAddress || userAddress.length != 42 || !ethers.utils.isHexString(userAddress) || !ethers.utils.isHexString(hexRuleId)) {
        return "";
    }

    const userBytes = ethers.utils.arrayify(`${userAddress}`);
    const ruleIdBytes = ethers.utils.arrayify(hexRuleId);

    var fullEntropyBytes = new Uint8Array(userBytes.length + ruleIdBytes.length);
    fullEntropyBytes.set(userBytes);
    fullEntropyBytes.set(ruleIdBytes, userBytes.length);
    return sha256(fullEntropyBytes);
}

const getRule = async (ruleId:string):Promise<RuleInfo> => {
    const formatedRuleId = ruleId;
    const data = await rules(
        {
            id:formatedRuleId
        },
        {
            decode:true,
            decodeModel:"RulesOutput",
            cartesiNodeUrl: envClient.CARTESI_NODE_URL,
            cache:"force-cache"
        }
    );
    
    if (data.total === 0 || data.data.length === 0) throw new Error(`Rule ${ruleId} not found!`);
    
    return data.data[0];
}

const getScore = async (tapeId:string):Promise<string> => {
    const out:Array<VerificationOutput> = (await getOutputs(
        {
            tags: ["score",tapeId],
            type: 'notice'
        },
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    )).data;
    if (out.length === 0) return "";
    return out[0].score.toString();
}

const getTapePayload = async (tapeId:string):Promise<VerifyPayload> => {
    const replayLogs:Array<VerifyPayload> = (await getOutputs(
        {
            tags: ["tape",tapeId],
            type: 'input'
        },
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    )).data;
    if (replayLogs.length === 0) throw new Error(`Tape ${tapeId} not found!`);
    return replayLogs[0];
}

function RivemuPlayer(
        {rule_id, tape_id}:
        {rule_id?:string, tape_id?:string}) {
    const {setGameplayOwner, setGameplayLog, setGifResolution, addGifFrame} = useContext(gameplayContext);

    const isTape = tape_id? true:false;
    const page = typeof window !== "undefined"? window.location.href:null;

    // rivemu state
    const [cartridgeData, setCartridgeData] = useState<Uint8Array>();
    const [rule, setRule] = useState<RuleInfo>();
    const [tape, setTape] = useState<VerifyPayload>();
    const [tapeInfo, setTapeInfo] = useState<TapeInfo>();
    const [entropy, setEntropy] = useState<string>("entropy");
    const [currScore, setCurrScore] = useState<number>();
    const [playing, setPlaying] = useState({isPlaying: false, playCounter: 0})
    const [currProgress, setCurrProgress] = useState<number>(0);
    const [skipToFrame, setSkipToFrame] = useState<number>();
    const [totalFrames, setTotalFrames] = useState<number>();
    const [lastFrameIndex, setLastFrameIndex] = useState<number>();
    const [loadingMessage, setLoadingMessage] = useState<string|undefined>("Initializing");
    const [errorMessage, setErrorMessage] = useState<string>();
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const [restarting, setRestarting] = useState(false);

    // signer
    const [{ wallet }] = useConnectWallet();
    const [signerAddress, setSignerAddress] = useState<string|null>(wallet? wallet.accounts[0].address.toLowerCase(): null);

    const rivemuRef = useRef<RivemuRef>(null);

    useEffect(() => {
        if (!isTape){
            if (!wallet) {
                setSignerAddress(null);
                if (!isTape && rule_id) setEntropy("entropy");
            }
            else {
                setSignerAddress(wallet.accounts[0].address.toLowerCase());
                if (rule_id) setEntropy(generateEntropy(wallet.accounts[0].address.toLowerCase(), rule_id));
            }
        }
    },[wallet]);

    useEffect(() => {
        if (rule_id) {
            loadRule(rule_id);
        }
        if (tape_id) {
            loadTape(tape_id, rule_id == undefined);
        }
        document.addEventListener("visibilitychange", (event) => {
            if (document.visibilityState == "hidden") {
                rivemuRef.current?.setSpeed(0);
                setPaused(true);
            }
          });
    }, []);

    const loadRule = (ruleId:string, currTapeInfo?: TapeInfo) => {
        setLoadingMessage("Loading rule");
        getRule(ruleId).then((out: RuleInfo) => {
            if (!out) {
                setErrorMessage("Rule not found")
                return
            }
            setRule(out);
            setLoadingMessage("Loading cartridge");
            getCartridgeData(out.cartridge_id).then((data) => {
                if (!data) {
                    setErrorMessage("Cartridge not found")
                    return
                }
                setCartridgeData(data);
                setLoadingMessage(undefined);
            });

            if (tape_id && [ContestStatus.INVALID,ContestStatus.VALIDATED].indexOf(getContestStatus(out)) > -1) {
                getScore(tape_id).then((out) => setTapeInfo({...currTapeInfo,score:out}))
            }
        });
    }

    const loadTape = (tapeId:string,loadRuleFromTape:boolean) => {
        setLoadingMessage("Loading tape");
        getTapePayload(tapeId).then((out: VerifyPayload) => {
            if (!out) {
                setErrorMessage("Tape not found")
                return
            }
            setTape(out);

            const player = `${out._msgSender.slice(0, 6)}...${out._msgSender.substring(out._msgSender.length-4,out._msgSender.length)}`;
            const timestamp = new Date(out._timestamp*1000).toLocaleDateString();
            const size = formatBytes(out.tape.length);
            const currTapeInfo: TapeInfo = {player,timestamp,size};

            setTapeInfo({...tapeInfo,...{player,timestamp,size}});
            setEntropy(generateEntropy(out._msgSender,out.rule_id.slice(2)));
            if (loadRuleFromTape) {
                loadRule(out.rule_id.slice(2),currTapeInfo)
            } else {
                setLoadingMessage(undefined);
            }
        });
    }

    const cstatus = rule ? getContestStatus(rule) : ContestStatus.INVALID;

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
        if (isTape && totalFrames && totalFrames != 0){
            if (skipToFrame) {
                setCurrProgress(Math.round(100 * skipToFrame/totalFrames));
                if (frame < skipToFrame) return;
                setSkipToFrame(undefined);
                rivemuRef.current?.setSpeed(speed);
            }
            setCurrProgress(Math.round(100 * frame/totalFrames));
        } else if (lastFrameIndex == undefined || frame >= lastFrameIndex + fps/GIF_FRAME_FREQ) {
            const canvas = document.getElementById("canvas");
            if (!canvas) return;

            const frameImage = (canvas as HTMLCanvasElement).toDataURL('image/jpeg');
            addGifFrame(frameImage);
            setLastFrameIndex(frame);
        }
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

    const rivemuOnBegin = function (width: number, height: number, target_fps: number, total_frames: number) {
        console.log("rivemu_on_begin");
        setCurrScore(undefined);
        if (rule?.score_function) {
            setCurrScore(0);
        }
        setCurrProgress(0);
        setLastFrameIndex(undefined);
        setGameplayLog(null);
        if (isTape && total_frames) setTotalFrames(total_frames);
        else {
            setGameplayOwner(signerAddress || "0x");
            setGifResolution(width, height);
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
        if (isTape && totalFrames && totalFrames != 0)
            setCurrProgress(100);
        if (!isTape && rule && signerAddress && !restarting) {
            let score: number | undefined = undefined;
            if (scoreFunctionEvaluator && decoder.decode(outcard.slice(0,4)) == 'JSON') {
                const outcard_str = decoder.decode(outcard);
                const outcard_json = JSON.parse(outcard_str.substring(4));
                score = scoreFunctionEvaluator.evaluate(outcard_json);
            }
            setGameplayLog(
                {
                    cartridge_id: rule.cartridge_id,
                    log: new Uint8Array(rivlog),
                    outcard: {
                        value: new Uint8Array(outcard),
                        hash: outhash
                    },
                    score,
                    rule_id: rule.id
                }
            );
            if (document.fullscreenElement) document.exitFullscreen();
        }
        if (restarting)
            setPlaying({...playing, playCounter: playing.playCounter+1});
        else
            setPlaying({isPlaying:false, playCounter: playing.playCounter+1});
    };

    async function play() {
        setSpeed(1.0);
        setPaused(false);
        setRestarting(true);
        setSkipToFrame(undefined);
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
            setSkipToFrame(undefined);
        }
    }

    async function resumeSpeed() {
        if (skipToFrame) {
            rivemuRef.current?.setSpeed(speed);
            setSkipToFrame(undefined);
        }
    }
    async function rivemuChangeSpeed() {
        let newSpeed = 1.0;
        if (speed >= 4.0) {
            newSpeed = 0.5;
        } else if (speed >= 2.0) {
            newSpeed = 4.0;
        } else if (speed >= 1.5) {
            newSpeed = 2.0;
        } else if (speed >= 1) {
            newSpeed = 1.5;
        } else if (speed >= 0.5) {
            newSpeed = 1.0;
        }
        setSpeed(newSpeed);
        if (!paused) {
            rivemuRef.current?.setSpeed(newSpeed);
        }
    }
      
    async function stop() {
        rivemuRef.current?.stop();
        setPlaying({...playing, isPlaying: false,});
    }

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        if (!isTape || !totalFrames) return;
        const valueToset = newValue as number > currProgress ? newValue as number : currProgress;
        setCurrProgress(valueToset);
    };

    const handleSliderChangeCommited = (event: React.SyntheticEvent | Event, newValue: number | number[]) => {
        if (!isTape || !totalFrames) return;
        setSkipToFrame(Math.round((newValue as number) * totalFrames/100));
        rivemuRef.current?.setSpeed(10);
    };
    return (
        <section className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center text-center">
                <span className="text-white" >Play mode: {rule?.name}</span>
                {isTape && tapeInfo ? 
                        <span className="text-xs text-white">
                            Tape from {tapeInfo.player} on {tapeInfo.timestamp} {tapeInfo.score ? "with score "+tapeInfo.score : ""} ({tapeInfo.size})
                        </span>
                    : 
                        <></>
                }
                {
                    !isTape && cstatus && cstatus != ContestStatus.INVALID?
                        <span className="text-xs text-white">Contest Status: {getContestStatusMessage(cstatus)}</span>
                    : 
                        <></>}
                
                { 
                            !rule_id? 
                                <span>&emsp;</span>
                            : 
                                currScore == undefined? 
                                    <span>&emsp;</span>
                                : 
                                    <span className={`text-white ${currScore > 1000000000? "text-xs":"text-sm"}`}>
                                        Score: {currScore}
                                    </span>
                }
            </div>
            <div>
                <div className='grid grid-cols-3 bg-gray-500 p-2 text-center screen-controls'>
                    <div className="flex justify-start gap-2">
                        <button className="justify-self-start bg-gray-700 text-white border border-gray-700 hover:border-black"
                        title={isTape ? "Restart" :"Record"}
                        onKeyDown={() => null} onKeyUp={() => null}
                        onClick={play}>
                            {isTape ? <RestartIcon/> : <FiberManualRecordIcon/>}
                        </button>
                        <button className="justify-self-end bg-gray-700 text-white border border-gray-700 hover:border-black"
                        title="Pause/Resume"
                        disabled={!playing.isPlaying}
                        onKeyDown={() => null} onKeyUp={() => null}
                        onClick={pause}
                        >
                            <PauseIcon/>
                        </button>

                        <button className="justify-self-end bg-red-500 text-white border border-gray-700 hover:border-black"
                        title="Stop"
                        disabled={!playing.isPlaying}
                        onKeyDown={() => null} onKeyUp={() => null}
                        onClick={stop}
                        >
                            <StopIcon/>
                        </button>

                    </div>

                    <div className="">
                        
                    </div>

                    <div className="flex justify-end gap-2">
                        <button className="justify-self-end bg-gray-700 text-white border border-gray-700 hover:border-black font-thin"
                        title="Change Speed"
                        disabled={!playing.isPlaying || !isTape}
                        onKeyDown={() => null} onKeyUp={() => null}
                        onClick={rivemuChangeSpeed}
                        >
                            <span>{speed.toFixed(1)}x</span>
                        </button>

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
                        <button className={'absolute gameplay-screen text-gray-500 hover:text-white t-0 backdrop-blur-sm border border-gray-500'} onClick={play}
                        title={isTape ? "Replay": "Record"}>
                            {
                                playing.playCounter === 0?
                                    <PlayArrowIcon className='text-7xl'/>
                                :
                                (isTape ? <RestartIcon className='text-7xl' /> : <PlayArrowIcon className='text-7xl'/>)
                            }
                            
                        </button>
                    : (paused ?     
                        <button className={'absolute gameplay-screen text-gray-500 hover:text-white t-0 backdrop-blur-sm border border-gray-500'} onClick={pause}>
                            <PlayArrowIcon className='text-7xl' />
                        </button>
                    : (skipToFrame ?     
                        <button className={'absolute gameplay-screen text-gray-500 hover:text-white t-0 backdrop-blur-md backdrop-opacity-40 border border-gray-500'} onClick={resumeSpeed}>
                            <FastForwardIcon className='text-7xl animate-pulse' />
                        </button>
                    : <></>))
                    }
                        <Rivemu ref={rivemuRef} cartridge_data={cartridgeData} args={rule.args} entropy={entropy}
                            tape={tape?.tape && tape.tape.length > 0 && ethers.utils.arrayify(tape.tape)}
                            in_card={rule.in_card && rule.in_card.length > 0 ? ethers.utils.arrayify(rule.in_card) : new Uint8Array([])} 
                            rivemu_on_frame={rivemuOnFrame} rivemu_on_begin={rivemuOnBegin} rivemu_on_finish={rivemuOnFinish}
                        />
                    </div>
                </div>
                {isTape ? 
                    <div className="screen-controls">
                    <Box sx={{ width: "100%'" }}>
                    <Slider
                        size="small"
                        aria-label="Progress"
                        valueLabelDisplay="auto"
                        value={currProgress}
                        onChange={handleSliderChange}
                        onChangeCommitted={handleSliderChangeCommited}
                    />
                    </Box>
                    </div>
                : <></>}
        </section>
    )
}

export default RivemuPlayer
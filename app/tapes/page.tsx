"use client"


import {  ethers } from "ethers";
import { useEffect, useState } from "react";
import { sha256 } from "js-sha256";
import { CartridgeInfo, RuleInfo } from "../backend-libs/core/ifaces";
import { cartridgeInfo, getOutputs, rules, RulesOutput, VerificationOutput, VerifyPayload } from "../backend-libs/core/lib";
import { envClient } from "../utils/clientEnv";
import { TapesRequest, calculateTapeId, getTapes } from "../utils/util";
import { formatBytes } from '../utils/common';
import { DecodedIndexerOutput } from "../backend-libs/cartesapp/lib";
import TapeCard from "../components/TapeCard";
import Loading from "../components/Loading";

const DEFAULT_PAGE_SIZE = 12


async function getScores(options:TapesRequest) {
  const res:DecodedIndexerOutput = await getOutputs(
    {
        tags: ["score"],
        type: 'notice',
        page: options.currentPage,
        page_size: options.pageSize,
        order_by: "timestamp",
        order_dir: "desc"
    },
    {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
  );
  const verificationINputs:Array<VerificationOutput> = res.data;

  return verificationINputs;
}

async function getRuleInfo(rule_id:string) {
  const rulesOutput: RulesOutput = (await rules({id:rule_id}, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}));
  return rulesOutput.data[0];
}

async function getGameInfo(cartridge_id:string) {
  const cartridgeWithInfo:CartridgeInfo = await cartridgeInfo({id:cartridge_id},{decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL});

  return cartridgeWithInfo;
}

interface TapesPagination extends TapesRequest {
  atEnd: boolean,
  fetching: boolean
}

export default function Tapes() {
  const [verificationInputs, setVerificationInputs] = useState<Array<VerifyPayload>|null>(null);
  const [gifs, setGifs] = useState<Record<string,string>>({});
  const [imgs, setImgs] = useState<Record<string,string>>({});
  const [cartridgeInfoMap, setCartridgeInfoMap] = useState<Record<string, CartridgeInfo>>({});
  const [ruleInfoMap, setRuleInfoMap] = useState<Record<string, RuleInfo>>({});
  const [tapesRequestOptions, setTapesRequestOptions] = useState<TapesPagination>({currentPage: 1, pageSize: DEFAULT_PAGE_SIZE, atEnd: false, fetching: false, orderBy: "timestamp", orderDir: "desc"});
  const [scores, setScores] = useState<Record<string, number|undefined>>({});

  // const { ref, inView, entry } = useInView({
  //   /* Optional options */
  //   threshold: 0,
  // });

  useEffect(() => {
    const getFirstPage = async () => {
      await nextPage();
    }

    getFirstPage();
  }, [])

  // if (inView) nextPage();

  async function nextPage() {
    if (tapesRequestOptions.fetching || tapesRequestOptions.atEnd) return;

    const newRequestOptions = {...tapesRequestOptions, fetching: true};
    setTapesRequestOptions(newRequestOptions);
    let res:DecodedIndexerOutput;
    try {
      res = await getTapes(tapesRequestOptions);
    } catch (error) {
      console.log(`Failed to fetch tapes!\n${(error as Error).message}`)
      setTapesRequestOptions({...tapesRequestOptions, fetching: false, atEnd: true});
      return;
    } 
    const tapesInputs = res.data;
    
    // let tapes:Set<string> = new Set();
    // let idToInfoMap:Record<string, CartridgeInfo> = {};
    // let idToRuleInfoMap:Record<string, RuleInfo> = {};

    // for (let i = 0; i < tapesInputs.length; i++) {
    //   const tapeInput: VerifyPayload = tapesInputs[i];

    //   tapes.add(getTapeId(tapeInput.tape));
    //   if (! (cartridgeInfoMap[tapeInput.rule_id] || idToInfoMap[tapeInput.rule_id] || idToRuleInfoMap[tapeInput.rule_id]) ) {

    //     try {
    //       idToRuleInfoMap[tapeInput.rule_id] = await getRuleInfo(tapeInput.rule_id.slice(2));
    //       idToInfoMap[tapeInput.rule_id] = await getGameInfo(idToRuleInfoMap[tapeInput.rule_id].cartridge_id);            
    //     } catch (error) {
    //       console.log((error as Error).message);
    //     }
    //   }
    // }

    // if (Object.keys(idToInfoMap).length > 0) setCartridgeInfoMap({...cartridgeInfoMap, ...idToInfoMap});
    // if (Object.keys(idToRuleInfoMap).length > 0) setRuleInfoMap({...ruleInfoMap, ...idToRuleInfoMap});

    // let promises:Array<Promise<any>> = [];
    // get tapes Images, GIFS, and Scores
    // const tapeList = Array.from(tapes);
    // promises.push(getTapesImages(tapeList));
    // promises.push(getTapesGifs(tapeList));
    // promises.push(getScores(tapesRequestOptions))

    // Promise.all(promises)
    // .then((values) => {
    //   // images
    //   let tapesImages:string[] = values[0];
    //   const newImgsRecord: Record<string,string> = {};
    //   for (var i = 0; i < tapeList.length; i++) {
    //     newImgsRecord[tapeList[i]] = tapesImages[i];
    //   }
    //   setImgs({...imgs, ...newImgsRecord});

    //   // GIFs
    //   let tapesGifs:string[] = values[1];
    //   let newGifsRecord: Record<string,string> = {};
    //   for (var i = 0; i < tapeList.length; i++) {
    //     newGifsRecord[tapeList[i]] = tapesGifs[i];
    //   }
    //   setGifs({...gifs, ...newGifsRecord});

    //   // score
    //   let tapesScores:VerificationOutput[] = values[2];
    //   let tapeId;
    //   let newScores:Record<string, number> = {};
    //   tapesScores.forEach((newScore) => {
    //     tapeId = newScore.tape_hash.substring(2);
    //     newScores[tapeId] = newScore.score;
    //   });

    //   setScores({...scores, ...newScores});
    // })
  //   .catch(console.log)
  //   .finally(() => {
  //     if (!verificationInputs) {
  //       setVerificationInputs(tapesInputs);
  //     } else {
  //       setVerificationInputs([...verificationInputs, ...tapesInputs]);
  //     }
      
  //     setTapesRequestOptions({...tapesRequestOptions, 
  //       currentPage: tapesRequestOptions.currentPage+1, 
  //       fetching: false,
  //       atEnd: res.total <= tapesRequestOptions.currentPage * tapesRequestOptions.pageSize
  //     });
  //   })

    if (!verificationInputs) {
      setVerificationInputs(tapesInputs);
    } else {
      setVerificationInputs([...verificationInputs, ...tapesInputs]);
    }
    
    setTapesRequestOptions({...newRequestOptions, 
      currentPage: newRequestOptions.currentPage+1, 
      fetching: false,
      atEnd: res.total <= newRequestOptions.currentPage * newRequestOptions.pageSize
    });

  }



  if (verificationInputs?.length == 0) {
    return (
      <main className="flex items-center justify-center h-lvh text-white">
        No Tapes Found
      </main>
    )
  }


  return (
    <main> 
      <section className="w-full flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {
            verificationInputs?.map((verificationInput, index) => {
              const cartridgeName = cartridgeInfoMap[verificationInput.rule_id]?.name;
              const ruleName = ruleInfoMap[verificationInput.rule_id]?.name;
              const user = verificationInput._msgSender;
              const player = `${user.slice(0, 6)}...${user.substring(user.length-4,user.length)}`;
              const timestamp = new Date(verificationInput._timestamp*1000).toLocaleDateString();
              // const tapeId = calculateTapeId(verificationInput.rule_id, verificationInput.tape);
              const size = formatBytes((verificationInput.tape.length -2 )/2);
              
              return (
                <TapeCard key={index} tapeInput={verificationInput} />
              )
               
            })
          }
          {
            tapesRequestOptions.fetching?
              <div className="col-span-full">
                <Loading msg={"Loading Tapes"} />
              </div>
            :
              <></>
          }

          {
            !verificationInputs || tapesRequestOptions.atEnd || tapesRequestOptions.fetching?
              <></>
            :
              <div className="col-span-full flex justify-center">
                <button className="bg-rives-purple p-3 text-center md:w-1/2 hover:scale-110"
                onClick={nextPage}
                disabled={tapesRequestOptions.fetching}
                >
                  {
                    tapesRequestOptions.fetching?
                      <div className="flex justify-center">
                        <div className='w-8 h-8 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
                      </div>
                    :
                      <span className="pixelated-font">
                        Show More
                      </span>
                  }
                </button>
              </div>

          }

        </div >  
      </section>
    </main>
  )
}

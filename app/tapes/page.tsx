"use client"


import {  ethers } from "ethers";
import { useEffect, useState } from "react";
import { sha256 } from "js-sha256";
import { CartridgeInfo, RuleInfo } from "../backend-libs/core/ifaces";
import { cartridgeInfo, getOutputs, rules, RulesOutput, VerificationOutput, VerifyPayload } from "../backend-libs/core/lib";
import { envClient } from "../utils/clientEnv";
import { TapesRequest, getTapes, timeToDateUTCString } from "../utils/util";
import { formatBytes } from '../utils/common';
import { DecodedIndexerOutput } from "../backend-libs/cartesapp/lib";
import TapeCard from "../components/TapeCard";
import Loading from "../components/Loading";

const DEFAULT_PAGE_SIZE = 12

function getTapeId(tapeHex: string): string {
  return sha256(ethers.utils.arrayify(tapeHex));
}



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

  useEffect(() => {
    const getFirstPage = async () => {
      await nextPage();
    }

    getFirstPage();
  }, [])


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
              const timestamp = timeToDateUTCString(verificationInput._timestamp*1000);
              const tapeId = getTapeId(verificationInput.tape);
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

import { type NextRequest } from 'next/server'
import { ethers } from "ethers";

import { envClient } from "../../utils/clientEnv";
import { VerifyPayload, cartridge, getOutputs, rules } from "../../backend-libs/core/lib";
import { RuleInfo } from '@/app/backend-libs/core/ifaces';
import { generateEntropy } from '@/app/components/RivemuPlayer';

type ResponseData = {
  message: string
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


export async function GET(request: NextRequest, { params }: { params: { tape_id: string }}) {
    const tapeId = params.tape_id;
    let data: Uint8Array = new Uint8Array();
    try {
      const tape = await getTapePayload(tapeId);
      const rule = await getRule(tape.rule_id);
      const abi = ethers.utils.defaultAbiCoder;
      const entropy = `0x${generateEntropy(tape._msgSender,rule.id)}`;

      data = ethers.utils.arrayify(abi.encode(
        ["bytes","string","bytes","bytes32"],
        [tape.tape,rule.args,rule.in_card,entropy]
      ));
    }
    catch (error) {
      console.log(error)
    }
    if (data.length == 0)
      return new Response(data,{
        status:404, 
        headers: {
          "Content-Type": "application/octet-stream",
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    return new Response(data,{
      status:200, 
      headers: {
        "Content-Type": "application/octet-stream",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
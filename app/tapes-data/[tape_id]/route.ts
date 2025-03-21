import { type NextRequest } from 'next/server'
import { ethers } from "ethers";

import { envClient } from "../../utils/clientEnv";
import { VerifyPayloadProxy, cartridge, formatInCard, getOutputs, rules } from "../../backend-libs/core/lib";
import { FormatInCardPayload, RuleInfo } from '@/app/backend-libs/core/ifaces';
import internal from 'stream';
import { ruleIdFromBytes, generateEntropy } from '@/app/utils/util';

type ResponseData = {
  message: string
}

const getRule = async (ruleId:string):Promise<RuleInfo> => {
  const formatedRuleId = ruleId;
  const data = await rules(
      {
          id:formatedRuleId,
          enable_deactivated: true
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

const getTapePayload = async (tapeId:string):Promise<VerifyPayloadProxy> => {
  const replayLogs:Array<VerifyPayloadProxy> = (await getOutputs(
      {
          tags: ["tape",tapeId],
          type: 'input'
      },
      {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
  )).data;
  if (replayLogs.length === 0) throw new Error(`Tape ${tapeId} not found!`);
  return replayLogs[0];
}

interface FullTapePayload {
  tape?: string,
  incard?: string,
  args?: string,
  entropy?: string
}

export async function GET(request: NextRequest, { params }: { params: { tape_id: string }}) {
    const tapeId = params.tape_id;
    // let data: Uint8Array = new Uint8Array();
    let data: FullTapePayload = {};
    try {
      const tape = await getTapePayload(tapeId);
      const rule = await getRule(ruleIdFromBytes(tape.rule_id));
      // const entropy = `0x${generateEntropy(tape._msgSender,rule.id)}`;
      const entropy = generateEntropy(tape._msgSender,rule.id);

      const inputData: FormatInCardPayload = {rule_id:rule.id};
      if (tape.incard && tape.incard > 0) inputData.in_card = ethers.utils.hexlify(tape.incard);
      if (tape.tapes && tape.tapes.length > 0) inputData.tapes = tape.tapes;
      const incard = await formatInCard(inputData, {
        cartesiNodeUrl: envClient.CARTESI_NODE_URL,
        decode:true,
        decodeModel:"bytes",
        method:"POST"
      });

      data = {
        entropy: entropy,
        tape: btoa(new Uint8Array(ethers.utils.arrayify(tape.tape)).reduce((data, byte) => data + String.fromCharCode(byte), '')),
        incard: btoa(new Uint8Array(ethers.utils.arrayify(incard)).reduce((data, byte) => data + String.fromCharCode(byte), '')),
        args: rule.args
      };
      // const abi = ethers.utils.defaultAbiCoder;
      // data = ethers.utils.arrayify(abi.encode(
      //   ["bytes","string","bytes","bytes32"],
      //   [tape.tape,rule.args,rule.in_card,entropy]
      // ));
    }
    catch (error) {
      console.log(error)
    }
    if (data.tape === undefined)
      return new Response(null,{
        status:404,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    return new Response(JSON.stringify(data),{
      status:200,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }

import { type NextRequest } from 'next/server'
import { ethers } from "ethers";

import { envClient } from "../../utils/clientEnv";
import { formatInCard } from "../../backend-libs/core/lib";
import { FormatInCardPayload } from '@/app/backend-libs/core/ifaces';
import { ruleIdFromBytes, generateEntropy, getRuleInfo, getTapes } from '@/app/utils/util';

interface FullTapePayload {
  tape?: string,
  incard?: string,
  args?: string,
  entropy?: string
}

export async function GET(request: NextRequest, { params }: { params: { tape_id: string }}) {
  const tapeId = params.tape_id;
  let data: FullTapePayload = {};
  try {
    const tapes = await getTapes({tapeIds:[tapeId],currentPage:1,pageSize:1});
    if (tapes.total == 0) throw new Error(`Tape ${tapeId} not found!`);
    const tape = tapes.data[0];
    const rule = await getRuleInfo(ruleIdFromBytes(tape.rule_id));
    if (!rule) throw new Error(`Rule ${tape.rule_id} not found!`);
    const entropy = generateEntropy(tape._msgSender,rule.id);

    const inputData: FormatInCardPayload = {rule_id:rule.id};
    if (tape.incard && tape.incard.length > 0) inputData.in_card = ethers.utils.hexlify(tape.incard);
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
      args: rule.args
    };
    if (incard) {
      data.incard = btoa(new Uint8Array(ethers.utils.arrayify(incard)).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    }
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

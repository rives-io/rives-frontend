import { type NextRequest } from 'next/server'
import { ethers } from "ethers";

import { envClient } from "../../utils/clientEnv";
import { formatInCard } from "../../backend-libs/core/lib";
import { FormatInCardPayload, RuleInfo } from '@/app/backend-libs/core/ifaces';
import { ruleIdFromBytes, getRuleInfo } from '@/app/utils/util';

interface FullTapePayload {
  tape?: string,
  incard?: string,
  args?: string,
  entropy?: string
}

export async function GET(request: NextRequest, { params }: { params: { rule_id: string }}) {
  const searchParams = request.nextUrl.searchParams;

  const ruleId = params.rule_id;
  let rule: RuleInfo|null = null;
  let data: FullTapePayload = {};
  try {
    rule = await getRuleInfo(ruleId);

    const inputData: FormatInCardPayload = {};
    const queryTapes = searchParams.getAll('tapes')
    const queryIncard = searchParams.get('incard')

    if (rule) inputData.rule_id = rule.id;
    if (queryIncard && queryIncard.length > 0) inputData.in_card = ethers.utils.hexlify(Uint8Array.from(atob(queryIncard), c => c.charCodeAt(0)));
    if (queryTapes && queryTapes.length > 0) inputData.tapes = queryTapes;
    const incard = await formatInCard(inputData, {
      cartesiNodeUrl: envClient.CARTESI_NODE_URL,
      decode:true,
      decodeModel:"bytes",
      method:"POST"
    });

    data = {};
    if (rule?.args) {
      data.args = rule.args;
    }
    if (incard) {
      data.incard = btoa(new Uint8Array(ethers.utils.arrayify(incard)).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    }
  }
  catch (error) {
    console.log(error)
  }
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

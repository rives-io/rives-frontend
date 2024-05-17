import { type NextRequest } from 'next/server'

import { envClient } from "../../utils/clientEnv";
import { cartridge } from "../../backend-libs/core/lib";

type ResponseData = {
  message: string
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


export async function GET(request: NextRequest, { params }: { params: { cartridge_id: string }}) {
    const cartridgeId = params.cartridge_id;
    let data: Uint8Array = new Uint8Array();
    try {
      data = await getCartridgeData(cartridgeId);
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
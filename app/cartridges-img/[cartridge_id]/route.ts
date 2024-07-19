import { type NextRequest } from 'next/server'

import { envClient } from "../../utils/clientEnv";
import { cartridgeInfo } from "../../backend-libs/core/lib";
import { CartridgeInfo } from '@/app/backend-libs/core/ifaces';

const getCartridgeImg = async (cartridgeId:string) => {
  const formatedCartridgeId = cartridgeId.substring(0, 2) === "0x"? cartridgeId.slice(2): cartridgeId;
  const cartridge:CartridgeInfo = await cartridgeInfo(
    {id: formatedCartridgeId},
    {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL}
  );
  
  if (!cartridge.cover) throw new Error(`Cartridge ${formatedCartridgeId} cover not found!`);
  
  return cartridge.cover;
}


export async function GET(request: NextRequest, { params }: { params: { cartridge_id: string }}) {
    const cartridgeId = params.cartridge_id;
    let cartridgeImg = "";
    
    try {
      cartridgeImg = await getCartridgeImg(cartridgeId);
    } 
    catch (error) {
      console.log(error)
    }
    
    if (cartridgeImg.length == 0)
      return new Response(cartridgeImg, {
        status:404, 
        headers: {
          "Content-Type": "application/octet-stream",
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
    
    const imageResp = Buffer.from(cartridgeImg, "base64");
    return new Response(imageResp, {
      status:200, 
      headers: {
        "Content-Length": `${imageResp.length}`,
        "Content-Type": "image/png",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
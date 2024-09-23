import { type NextRequest } from 'next/server';
import { getOlympicsData } from '@/app/utils/util';
import { notFound } from 'next/navigation';
import { getUsersByAddress, User } from '@/app/utils/privyApi';

export const revalidate = 10;

const sharp = require('sharp');
const bannerWidth = 1280;
const bannerHeight = 720;

function formatAddress(address:string) {
    return `${address.substring(0, 6)}...${address.substring(address.length-6)}`;
}

export async function GET(request: NextRequest, { params }: { params: { address: string }}) {
    const userAddress = params.address.toLowerCase();

    if (!userAddress.startsWith("0x") || userAddress.length != 42) {
        return notFound();
    }

    const userPromise = getUsersByAddress([userAddress]);
    const olympicsData = await getOlympicsData(userAddress);
    let userRank = 0;

    if (!olympicsData) {
        return notFound();
    }

    for (let i = 0; i < olympicsData.leaderboard.length; i++) {
        if (olympicsData.leaderboard[i].profile_address == userAddress) {
            userRank = i + 1;
            break;
        }
    }

    // DOOM Olympics Logo
    const resizedDoomLogoWidth = 512;
    const resizedDoomLogo = await sharp("./public/doom-olympics-logo.png").resize({ width: resizedDoomLogoWidth }).toBuffer();
    const resizedDoomLogoHeight = 384;
    const resizedDoomLogoPositionTop = bannerHeight/2 - resizedDoomLogoHeight/2;

    // RIVES Logo
    const resizedRIVESLogoWidth = 256;
    const resizedRIVESLogo = await sharp("./public/logo_cutted.png").resize({ width: resizedRIVESLogoWidth }).toBuffer();
    const resizedRIVESLogoHeight = 68;
    const resizedRIVESLogoPositionTop = resizedDoomLogoPositionTop - resizedRIVESLogoHeight/2 -10;
    const resizedRIVESLogoPositionLeft = resizedDoomLogoWidth/2 + 60 - resizedRIVESLogoWidth/2;

    // DOOM Olympics Text
    const doomOlympicsTextImg = await sharp({
        text: {
          text: `<span foreground="white">DOOM Olympics</span>`,
          fontfile: "./public/Silkscreen-Regular.ttf",
          font: "Silkscreen",
          rgba: true,
          width: 350,
          height: 64,
          channels: 4
        },
    }).png().toBuffer()
    const doomOlympicsTextPositionTop = bannerHeight/2 + resizedDoomLogoHeight/2 + 10;
    const doomOlympicsTextPositionLeft = resizedDoomLogoWidth/2 + 60 - 175; // Minus this text width

    
    // User Rank Text
    const rankTextImg = await sharp({
        text: {
          text: `<span foreground="white">#${userRank}</span>`,
          fontfile: "./public/Silkscreen-Regular.ttf",
          font: "Silkscreen",
          rgba: true,
          width: 500,
          height: 100,
          channels: 4
        },
    }).png().toBuffer()
    const rankTextPositionTop = bannerHeight/2 - 50;

    // user twitter text
    const userMap:Record<string, User> = JSON.parse(await userPromise);
    const user = userMap[userAddress];
    const userTextHeight = 32;
    const userTextImg = await sharp({
        text: {
          text: `<span foreground="white">${user? user.username: formatAddress(userAddress)}</span>`,
          rgba: true,
          width: 420,
          height: userTextHeight,
          channels: 4
        },
    }).png().toBuffer()
    const userTextPositionTop = bannerHeight/2 + 50 + 10;

    // user image
    let data:Uint8Array|string;
    if (!user) {
        data = "./public/default_profile.png"
    } else {
        try {
            let response = await fetch(user.picture_url,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "image/png",
                    },
                }
            );
            let blob = await response.blob();
            data = new Uint8Array(await blob.arrayBuffer());                
        } catch (error) {
            data = "./public/default_profile.png"
        }
    }
    const profileImg = await sharp(data).toBuffer();
    const profileImgWidth = 48;
    const profileImgPositionTop = userTextPositionTop + (userTextHeight - 48)/2;



    const bannerPng = await sharp({
        create: {
            width: bannerWidth,
            height: bannerHeight,
            channels: 4,
            background: "#8b5cf6" // backgroun is RIVES purple
        }
    })
    .composite([
        { input: resizedRIVESLogo, top: resizedRIVESLogoPositionTop, left: resizedRIVESLogoPositionLeft },
        { input: resizedDoomLogo, top: resizedDoomLogoPositionTop, left: 60 },
        { input: doomOlympicsTextImg, top: doomOlympicsTextPositionTop, left: doomOlympicsTextPositionLeft },
        { input: rankTextImg, top: rankTextPositionTop, left: 800 },
        { input: userTextImg, top: userTextPositionTop, left: 800 + profileImgWidth + 8},
        { input: profileImg, top: profileImgPositionTop, left: 800 },
      ])
    .png()
    .toBuffer();
    
    return new Response(bannerPng as any, {
        status:200, 
        headers: {
            "Content-Length": `${bannerPng.length}`,
            "Content-Type": "image/png",
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    })
  }
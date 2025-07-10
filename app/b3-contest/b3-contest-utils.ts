"use server"
import {envServer} from "@/app/utils/serverEnv";
import { sha256 } from "js-sha256";
import * as crypto from 'crypto';
import { verifyGameplay } from "../backend-libs/core/lib";
import { envClient } from "../utils/clientEnv";
import { VerifyGameplayPayload } from "../backend-libs/core/ifaces";
import { ethers } from "ethers";

const md5 = (contents: string) => crypto.createHash('md5').update(contents).digest("hex");

const b3ContestUrl = "https://api.basement.fun/launcher";

export async function sendScoreToB3(jwt: string, score:number, outhash:string,tape:Uint8Array,entropy:string,ruleId:string) {
    if (!jwt || !score || !outhash || !tape || tape.length == 0 || !entropy || !ruleId) {
        const msg = `Error posting score to B3 contest: not a valid gameplay: score(${score}), outhash(${outhash}), tapeLength(${tape.length}), entropy(${entropy}), jwt(${jwt})`;
        console.log(msg)
        return {error: msg, success: false};
    }
    const jwtSplitted = jwt.split(".");
    if (jwtSplitted.length < 3) {
        const msg = `Error posting score to B3 contest: invalid jwt: ${jwt}`;
        console.log(msg)
        return {error: msg, success: false};
    }
    const jwtHeader = JSON.parse(Buffer.from(jwtSplitted[0], "base64").toString('binary')); // decode header
    const jwtBody = JSON.parse(Buffer.from(jwtSplitted[1], "base64").toString('binary')); // decode header
    const jwtSecret = Buffer.from(jwtSplitted[2], "base64").toString('binary'); // decode header

    // console.log(`Received B3 contest jwt: jwtHeader(${JSON.stringify(jwtHeader)}), jwtBody(${JSON.stringify(jwtBody)})`);
    if (!jwtHeader || !jwtBody || !jwtSecret || !jwtHeader.alg || jwtHeader.alg !== "HS256" ||  !jwtHeader.typ || jwtHeader.typ !== "JWT" || !jwtBody.address) {
        const msg = `Error posting score to B3 contest: invalid jwt: ${jwt}`;
        console.log(msg)
        return {error: msg, success: false};
    }

    const inputData: VerifyGameplayPayload = {
        rule_id: ruleId,
        outcard_hash: outhash,
        tape: ethers.utils.hexlify(tape),
        entropy: entropy,
        claimed_score: score,
    };
    const verifyResult = await verifyGameplay(inputData,
        {
            cartesiNodeUrl: envClient.CARTESI_NODE_URL,
            decode:true,
            decodeModel:"GameplayVerificationOutput",
            method:"POST"
    });

    if (!verifyResult.tape_id) {
        const msg = `Error posting score to B3 contest: invalid tape: ${verifyResult}`;
        console.log(msg)
        return {error: msg, success: false};
    }
    // console.log(`Verified gameplay: score(${verifyResult.score}), tapeId(${verifyResult.tape_id}), ruleId(${verifyResult.rule_id}), catridgeId(${verifyResult.cartridge_id})`);


    console.log(`Posting score to B3 contest: score(${score}), outhash(${outhash}), tapeLength(${tape.length}), entropy(${entropy}), jwt(${jwt})`);
    const headers = new Headers();
    // service method to call
    headers.set("Content-Type", "application/json");
    headers.set("X-Service-Method", "setUserScore");
    if (envServer.B3_GAME_SECRET && envServer.B3_GAME_SECRET !== "" && envServer.B3_GAME_SECRET !== "null") {
        const requestNonce = sha256(jwt+entropy+outhash);
        const requestSignature = md5(requestNonce + md5(envServer.B3_GAME_SECRET));
        // console.log(`Posting score to B3 contest secrets: requestNonce(${requestNonce}), requestSignature(${requestSignature})`);
        // a random string, identifier for the specific request. (we recommend up to 32 randomly selected characters)
        headers.set("X-Request-Nonce", requestNonce);
        // this is the MD5 hash of the nonce prepended to the md5 of the game's secret ( = MD5(nonce + MD5(gameSecret))
        headers.set("X-Request-Signature", requestSignature);
    }
    const body = JSON.stringify({
        "launcherJwt": jwt,
        "nonce": outhash,
        "score": score
    });
    try {
        const response = await fetch(b3ContestUrl, {
            method: "POST",
            headers: headers,
            body: body
        });
        // console.log(`Response of B3 contest score post:`,response);
        if (!response.ok) {
            const msg = `Error "${response.statusText}" posting score to B3 contest: ${await response.text()}`;
            console.log(msg);
            console.log(`Error posting score to B3 contest headers: ${JSON.stringify(Object.fromEntries(headers))}`);
            console.log(`Error posting score to B3 contest body: ${body}`);
            return {error: msg, success: false};
        }
        return await response.json();
    } catch (e) {
        const msg = `Error posting score to B3 contest: ${e instanceof Error ? e.message : e}`;
        console.log(msg)
        console.log(`Error posting score to B3 contest headers: ${JSON.stringify(Object.fromEntries(headers))}`);
        console.log(`Error posting score to B3 contest body: ${body}`);
        return {error: msg, success: false};
    }
}

"use server"
import {envServer} from "@/app/utils/serverEnv";
import { sha256 } from "js-sha256";
import * as crypto from 'crypto';

const md5 = (contents: string) => crypto.createHash('md5').update(contents).digest("hex");

const b3ContestUrl = "https://api.basement.fun/launcher";

export async function sendScoreToB3(jwt: string, score:number, outhash:string,tape:Uint8Array,entropy:string,ruleId:string) {
    if (!jwt || !score || !outhash || !tape || tape.length == 0 || !entropy || !ruleId) {
        const msg = `Error posting score to B3 contest: not a valid gameplay: score(${score}), outhash(${outhash}), tapeLength(${tape.length}), entropy(${entropy}), jwt(${jwt})`;
        console.log(msg)
        return {error: msg, success: false};
    }
    console.log(`Posting score to B3 contest: score(${score}), outhash(${outhash}), tapeLength(${tape.length}), entropy(${entropy}), jwt(${jwt})`);
    const headers = new Headers();
    // service method to call
    headers.set("X-Service-Method", "setUserScore");
    if (envServer.B3_GAME_SECRET) {
        const requestNonce = sha256(jwt+entropy+outhash);
        const requestSignature = md5(requestNonce + md5(envServer.B3_GAME_SECRET));
        console.log(`Posting score to B3 contest secrets: requestNonce(${requestNonce}), requestSignature(${requestSignature})`);
        // a random string, identifier for the specific request. (we recommend up to 32 randomly selected characters)
        headers.set("X-Request-Nonce", requestNonce);
        // this is the MD5 hash of the nonce prepended to the md5 of the game's secret ( = MD5(nonce + MD5(gameSecret))
        headers.set("X-Request-Signature", requestSignature);
    }
    try {
        const response = await fetch(b3ContestUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                "launcherJwt": jwt,
                "nonce": outhash,
                "score": score
            })
        });
        if (!response.ok) {
            const msg = `Error "${response.statusText}" posting score to B3 contest: ${await response.text()}`;
            console.log(msg);
            return {error: msg, success: false};
        }
        return await response.json();
    } catch (e) {
        const msg = `Error posting score to B3 contest: ${e instanceof Error ? e.message : e}`;
        console.log(msg)
        return {error: msg, success: false};
    }
}

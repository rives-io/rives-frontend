"use server"
import {envServer} from "@/app/utils/serverEnv";
import { envClient } from "./clientEnv";


const privy_url = "https://auth.privy.io/api/v1/users/search";

export interface User {
    username:string,
    name:string,
    picture_url:string
}


export async function getUsersByAddress(addressList:Array<string>) {
    const res = await fetch(privy_url, {
        method: 'POST',
        headers: {
            'privy-app-id': envClient.PRIVY_APP_ID,
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${envClient.PRIVY_APP_ID}:${envServer.PRIVY_APP_SECRET}`)
        },
        body: JSON.stringify({
            'walletAddresses': addressList
        }),
        next: {revalidate: 300}
    });
    
    const users = await res.json();

    const userMap = buildUserAddressMap(users.data);
    return JSON.stringify(userMap);
}

function buildUserAddressMap(users:Array<any>) {
    let user;
    let userMap:Record<string, User> = {};

    if (!users) return userMap;

    for (let i = 0; i < users.length; i++) {
        user = users[i];

        let wallet_account;
        let twitter_account;
        let account;

        for (let j = 0; j < user["linked_accounts"].length; j++) {
            account = user["linked_accounts"][j];
            
            if (account.type == "wallet") {
                wallet_account = account;
            } else if (account.type == "twitter_oauth") {
                twitter_account = account;
            }
        }

        if (! (wallet_account && twitter_account)) continue;

        userMap[wallet_account.address.toLowerCase()] = {
            username: twitter_account.username,
            name: twitter_account.name,
            picture_url: twitter_account.profile_picture_url
        }
    }

    return userMap;
}

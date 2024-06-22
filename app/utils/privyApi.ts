"use server"
import {envServer} from "@/app/utils/serverEnv";


const privy_url = "https://auth.privy.io/api/v1/users/search";

export async function getUsersByAddress(addressList:Array<string>) {
    const res = await fetch(privy_url, {
        method: 'POST',
        headers: {
            'privy-app-id': envServer.PRIVY_APP_ID,
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${envServer.PRIVY_APP_ID}:${envServer.PRIVY_APP_SECRET}`)
        },
        body: JSON.stringify({
            'walletAddresses': addressList
        })
    });
    
    const users = await res.json();
    return JSON.stringify(users);
}

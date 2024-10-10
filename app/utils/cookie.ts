"use server"


import { cookies } from 'next/headers';



export async function setCookie(name:string, value:string) {
    const month_ms = 60 * 60 * 24 * 30 * 1000;
    cookies().set(name, value, {expires: Date.now() + month_ms, domain: ".rives.io"});
}
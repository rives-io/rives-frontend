"use server"


import { SignJWT, jwtVerify } from "jose";
import { envServer } from "./app/utils/serverEnv";

const key = new TextEncoder().encode(envServer.INVITE_CODE_KEY);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}
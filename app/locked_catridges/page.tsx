import { envClient } from "@/app/utils/clientEnv";
import { CartridgeInfo, CartridgesPayload } from "../backend-libs/core/ifaces";
import { cartridges } from "../backend-libs/core/lib";
import { Metadata } from "next";
import Link from "next/link";
import { timeToDateUTCString } from "../utils/util";

export const revalidate = 0 // revalidate always

export const metadata: Metadata = {
  title: 'Contests',
  description: 'Contests',
}

const getLockedCartridges = async () => {
  const inputPayload: CartridgesPayload = {
    locked: true,
    enable_non_primary:true,
    order_by:"created_at",
    order_dir:"desc"
  };
  
  return (await cartridges(inputPayload, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true})).data;
}

export default async function LockedCartridges() {
    const lockedCartridges = await getLockedCartridges();

    return (
        <main>
            <section className="flex justify-center grid grid-cols-1 gap-2">
                <div className="grid grid-cols-5 gap-2">
                    <div>#</div>
                    <div>Id</div>
                    <div>Name</div>
                    <div>Created At</div>
                    <div>User Address</div>
                </div>
                {
                    lockedCartridges.map((cartridge: CartridgeInfo, index: number) => {
                        return (
                            <Link className="grid grid-cols-5 gap-2" href={`/cartridges/${cartridge.id}`}>
                                <div>{index+1}</div>
                                <div>{cartridge.id}</div>
                                <div>{cartridge.name}</div>
                                <div>{timeToDateUTCString(cartridge.created_at)}</div>
                                <div>{cartridge.user_address}</div>
                            </Link>
                        )
                    })
                }
            </section>
        </main>
    )
}

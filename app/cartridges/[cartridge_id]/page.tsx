import { cartridgeInfo, rules } from "@/app/backend-libs/core/lib";
import { CartridgeInfo, RuleInfo } from '@/app/backend-libs/core/ifaces';
import { envClient } from "@/app/utils/clientEnv";
import CartridgePage from "@/app/components/CartridgePage";

export default async function Cartridge({ params }: { params: { cartridge_id: string } }) {
    const cartridge:CartridgeInfo = await cartridgeInfo(
        {id:params.cartridge_id},
        {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    );

    const cartridgeRules:RuleInfo[] = (await rules(
        {cartridge_id: cartridge.id},
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}
    )).data;


    return (
        <CartridgePage cartridge={cartridge} rulesInfo={cartridgeRules} ></CartridgePage>
    )
}

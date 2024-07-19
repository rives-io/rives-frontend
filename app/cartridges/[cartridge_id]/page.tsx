import { cartridgeInfo, rules } from "@/app/backend-libs/core/lib";
import { CartridgeInfo, RuleInfo } from '@/app/backend-libs/core/ifaces';
import { envClient } from "@/app/utils/clientEnv";
import CartridgePage from "@/app/components/CartridgePage";

export async function generateMetadata({ params }: { params: { cartridge_id: string } }) {
    const cartridge:CartridgeInfo = await cartridgeInfo(
        {id:params.cartridge_id},
        {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    );

    const cartridgeCoverUrl = `/cartridges-img/${params.cartridge_id}`;
    const desc = `RIVES - ${cartridge.name}`;

    return {
        openGraph: {
            images: [cartridgeCoverUrl], 
            siteName: 'rives.io',
            title: 'RIVES',
            description: desc,
        },
        twitter: {
            images: [cartridgeCoverUrl],
            title: 'RIVES',
            description: desc,
            card: 'summary',
            creator: '@rives_io',
        },
    }
}

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

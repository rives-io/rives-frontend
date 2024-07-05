import { CartridgeInfo, RuleInfo } from '@/app/backend-libs/core/ifaces';
import { cartridgeInfo, getOutputs, rules, VerifyPayload } from '@/app/backend-libs/core/lib';
import ContestCard from '@/app/components/ContestCard';
import RivemuPlayer from '@/app/components/RivemuPlayer';
import TapeAssetsAndStats from '@/app/components/TapeAssetsAndStats';
import { envClient } from '@/app/utils/clientEnv';
import { User, getUsersByAddress } from '@/app/utils/privyApi';
import { getTapeName } from '@/app/utils/util';
import Link from 'next/link';
import { notFound } from 'next/navigation';


export async function generateMetadata({ params }: { params: { tape_id: string } }) {
    const imageUrl = `${envClient.GIF_SERVER_URL}/images/${params.tape_id}`;
    return {
        openGraph: {
            images: [imageUrl], 
            siteName: 'rives.io',
            title: 'RIVES',
            description: 'RiscV Verifiable Entertainment System',
        },
        // icons: {
        //     icon: imageUrl,
        //     shortcut: imageUrl,
        //     apple: imageUrl,
        // },
        twitter: {
            images: [imageUrl], 
            title: 'RIVES',
            description: 'RiscV Verifiable Entertainment System',
            card: 'summary',
            creator: '@rives_io',
        },
    }
}

export default async function Tape({ params }: { params: { tape_id: string } }) {
    let res = (await getOutputs(
        {
            tags: ["tape", params.tape_id],
        },
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    ));

    if (res.data.length == 0) return notFound();
    
    const tape:VerifyPayload = res.data[0];

    const userMap:Record<string,User> = JSON.parse(await getUsersByAddress([tape._msgSender]));
    const user = userMap[tape._msgSender.toLowerCase()];
    res = await rules({id: tape.rule_id.substring(2)}, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true});
    const contest:RuleInfo = res.data[0];

    const cartridgePromise = cartridgeInfo({id: contest.cartridge_id}, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true});
    const tapeNamePromise = getTapeName(params.tape_id);
    
    let tapeCartridge:CartridgeInfo;
    let tapeName:string|null;
    [tapeCartridge, tapeName] = await Promise.all([cartridgePromise, tapeNamePromise]);

    return (
        <main className="grid grid-cols-1 justify-items-center justify-center w-full gap-4 px-4 md:px-0 ">
            <RivemuPlayer tape_id={params.tape_id}/>

            <div className='w-full md:w-2/3 flex flex-col gap-4'>
                <div className='flex flex-wrap gap-4'>
                    <div className='flex flex-col w-fit'>
                        <h1 className={`pixelated-font text-2xl md:text-5xl truncate`} title={tape.tape_id}>
                            {
                                tapeName?
                                    tapeName
                                :
                                    params.tape_id.substring(0, 20)
                            }
                        </h1>
                        <span className='text-sm md:text-base truncate'>
                        {
                            !user?
                                tape._msgSender
                            :
                                <Link href={`/profile/${tape._msgSender}`} className='flex items-center gap-2 w-fit hover:underline'>
                                    <img width={48} height={48} src={user? user.picture_url:""} className='rounded-full' alt='Nop' />
                                    <span title={tape._msgSender}>{user.name}</span>
                                </Link>
                        }
                        </span>
                        <span>Cartrige: {tapeCartridge.name}</span>
                    </div>

                    {/* <div className='justify-center md:justify-end flex-1 self-center text-black flex gap-2'>
                        <button className='bg-[#e04ec3] p-2 text-center font-bold w-32 h-10 hover:scale-105'>
                            ${0.09} Sell
                        </button>

                        <button className='bg-[#53fcd8] p-2 text-center font-bold w-32 h-10 hover:scale-105'>
                            ${0.1} Buy
                        </button>
                    </div> */}
                </div>
                <TapeAssetsAndStats tape_id={params.tape_id} />


                <div>
                    <div>
                        Date: {new Date(tape._timestamp *1000).toLocaleString()}
                    </div>

                    <div>
                        Rule: {contest.name}
                    </div>

                    <div>
                        Score: {Number(tape.claimed_score._hex)}
                    </div>

                </div>

                <div className='flex justify-center'>
                    <ContestCard contest={{...contest, prize: ""}} cartridge={tapeCartridge} />
                </div>
            </div>
        </main>
    )
}

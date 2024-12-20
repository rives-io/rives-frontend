import { CartridgeInfo, RuleInfo } from '@/app/backend-libs/core/ifaces';
import { cartridgeInfo, getOutputs, rules, VerificationOutput, VerifyPayloadProxy } from '@/app/backend-libs/core/lib';
import ContestCard from '@/app/components/ContestCard';
import RivemuPlayer from '@/app/components/RivemuPlayer';
import TapeAssetsAndStats from '@/app/components/TapeAssetsAndStats';
import TapeTitle from '@/app/components/TapeTitle';
import { envClient } from '@/app/utils/clientEnv';
import { User, getUsersByAddress } from '@/app/utils/privyApi';
import { getTapeName, ruleIdFromBytes, tapeIdFromBytes, timeToDateUTCString } from '@/app/utils/util';
import { ethers } from 'ethers';
import Link from 'next/link';
import WarningIcon from '@mui/icons-material/Warning';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { tape_id: string } }) {
    const imageUrl = `${envClient.GIF_SERVER_URL}/images/${params.tape_id}`;
    const tapeName = await getTapeName(params.tape_id);
    let title = tapeName? `${tapeName} | RIVES`:`${params.tape_id} | RIVES`;
    const desc = tapeName? `Tape "${tapeName}"`:`Tape "${params.tape_id}"`;

    return {
        title: title,
        openGraph: {
            images: [imageUrl],
            title: title,
            description: desc
        },
        twitter: {
            images: [imageUrl], 
            title: title,
            card: 'summary',
            creator: '@rives_io',
            description: desc
        },
    }
}

// const getScore = async (tapeId:string):Promise<string> => {
//     const out:Array<VerificationOutput> = (await getOutputs(
//         {
//             tags: ["score",tapeId],
//             type: 'notice'
//         },
//         {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
//     )).data;
//     if (out.length === 0) return "";
//     return out[0].score.toString();
// }
export default async function Tape({ params }: { params: { tape_id: string } }) {
    let res = (await getOutputs(
        {
            tags: ["tape", params.tape_id],
        },
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    ));

    if (res.data.length == 0) {
        return (
            <main className='flex justify-center items-center gap-2 px-4 h-svh text-center'>
                <WarningIcon className='text-yellow-400' />
                <p className='pixelated-font text-xl'>The requested tape is still being processed or does not exist.</p>
                <WarningIcon className='text-yellow-400' />
            </main>
        );
    }
    
    const tape:VerifyPayloadProxy = res.data[0];
    let inputTapesIdArray:Array<string> = Array.from(tape.tapes, tapeIdFromBytes);
    const getInputTapesNames = async (ids:Array<string>) => {
        let promises:Array<Promise<string|null>> = [];

        for (let i = 0; i < ids.length; i++) {
            promises.push(getTapeName(ids[i]));
        }

        const inputTapesNames = await Promise.all(promises);
        return inputTapesNames;
    }

    const userMap:Record<string,User> = JSON.parse(await getUsersByAddress([tape._msgSender]));
    const user = userMap[tape._msgSender.toLowerCase()];
    res = await rules({id: ruleIdFromBytes(tape.rule_id), enable_deactivated: true}, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true});
    const contest:RuleInfo = res.data[0];

    const cartridgePromise = cartridgeInfo({id: contest.cartridge_id}, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true});
    const tapeNamePromise = getTapeName(params.tape_id);
    const inputTapeNamesPromise = getInputTapesNames(inputTapesIdArray);
    
    let score:string|undefined = undefined;
    if (contest.score_function) {
        const out:Array<VerificationOutput> = (await getOutputs(
            {
                tags: ["score",params.tape_id],
                type: 'notice'
            },
            {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
        )).data;
        if (out.length != 0) score = ethers.utils.formatUnits(out[0].score.toString(), 0);
    }

    let tapeCartridge:CartridgeInfo;
    let tapeName:string|null;
    let inputTapesNames:Array<string|null>;
    [tapeCartridge, tapeName, inputTapesNames] = await Promise.all([cartridgePromise, tapeNamePromise, inputTapeNamesPromise]);

    if (!tapeCartridge.primary && tapeCartridge.primary_id) {
        tapeCartridge = await cartridgeInfo(
            {id: tapeCartridge.primary_id}, 
            {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}
        );
    }

    return (
        <main>
            <section className='flex flex-col items-center gap-4'>
                <RivemuPlayer tape_id={params.tape_id}/>

                <div className='w-full flex flex-col gap-4'>
                    <div className='flex flex-wrap gap-4'>
                        <div className='flex flex-col w-fit'>
                            <TapeTitle tapeId={params.tape_id} tapeName={tapeName} />
                            <span className='text-sm md:text-base truncate'>
                            {
                                !user?
                                    <div>
                                        <span className='pixelated-font me-2'>By:</span>
                                        <Link href={`/profile/${tape._msgSender}`}
                                        className='hover:underline text-rives-purple pixelated-font break-all'
                                        >
                                            {tape._msgSender}
                                        </Link>
                                    </div>
                                :
                                    <Link href={`/profile/${tape._msgSender}`} className='flex items-center gap-2 w-fit hover:underline'>
                                        <img width={48} height={48} src={user? user.picture_url:""} className='rounded-full' alt='' />
                                        <span title={tape._msgSender}>{user.name}</span>
                                    </Link>
                            }
                            </span>
                        </div>
                    </div>
                    <TapeAssetsAndStats tape_id={params.tape_id} />

                    <div className='flex flex-col'>
                        <h2 className={`pixelated-font text-3xl`}>Overview</h2>
                        <div className="grid grid-cols-2 w-fit">
                            <span className="text-gray-400">Cartrige</span>
                            <Link className='text-rives-purple hover:underline' href={`/cartridges/${tapeCartridge.id}`}>{tapeCartridge.name}</Link>

                            <span className="text-gray-400">Date</span>
                            <span>{timeToDateUTCString(tape._timestamp)}</span>

                            <span className="text-gray-400">Rule</span>
                            {contest.name}

                            { 
                                score?
                                    <>
                                        <span className="text-gray-400">Score</span>
                                        {score}
                                    </>
                                :
                                    <></>
                            }

                            {
                                inputTapesIdArray.length == 0?
                                    <></>
                                :
                                    <>
                                        <span className="text-gray-400">Input Tapes</span>
                                        <span className='flex gap-2'>
                                            {
                                                inputTapesIdArray.map((id, index) => {
                                                    return (
                                                        <Link key={id} href={`/tapes/${id}`}
                                                        className='text-rives-purple hover:underline'>
                                                            {
                                                                inputTapesNames[index]? inputTapesNames[index]: `${id.substring(0, 20)}...`
                                                            }
                                                        </Link>
                                                    )
                                                })
                                            }
                                        </span>
                                    </>
                            }
                        </div>
                    </div>


                    <div className='flex justify-center'>
                        <ContestCard contest={contest} cartridge={tapeCartridge} />
                    </div>
                </div>
            </section>
        </main>
    )
}

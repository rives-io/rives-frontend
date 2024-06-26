import RivemuPlayer from '@/app/components/RivemuPlayer';
import TapeAssetManager from '@/app/components/TapeAssetManager';
import { envClient } from '@/app/utils/clientEnv';


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
    return (
        <main className="flex items-center justify-center">
        {/* <main className="flex grid grid-cols-1 justify-items-center justify-center my-20"> */}
            <RivemuPlayer tape_id={params.tape_id}/>
            <TapeAssetManager tape_id={params.tape_id}/>
        </main>
    )
}

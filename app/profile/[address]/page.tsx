import { User, getUsersByAddress } from "@/app/utils/privyApi";
import ProfileNavigation from "@/app/components/ProfileNavigation";
import ProfileOptions from "@/app/components/ProfileOptions";
import ProfileSummary from "@/app/components/ProfileSummary";
import TapeFeesManager from "@/app/components/TapeFeeManager";
import CartridgeFeesManager from "@/app/components/CartridgeFeeManager";


export async function generateMetadata({ params }: { params: { address: string } }) {
    const userMap:Record<string, User> = JSON.parse(await getUsersByAddress([params.address]));
    const twitterInfo = userMap[params.address.toLowerCase()];
  
    const title = twitterInfo? `${twitterInfo.name} | RIVES`:`${params.address.toLowerCase()} | RIVES`;
    const desc = twitterInfo? `Profile "${twitterInfo.name}"`:`Profile "${params.address.toLowerCase()}"`;
  
    return {
      title: title,
      openGraph: {
            siteName: 'rives.io',
            title: title,
            description: desc
      },
      twitter: {
            title: title,
            card: 'summary',
            creator: '@rives_io',
            description: desc
      },
    }
}


export default async function ProfilePage({ params }: { params: { address: string } }) {
    const userMap:Record<string, User> = JSON.parse(await getUsersByAddress([params.address]));
    const twitterInfo = userMap[params.address.toLowerCase()];
    
    
    return (
        <main className="w-full flex flex-col items-center gap-8 px-4 md:px-0">
            <div className="flex flex-wrap gap-8 items-center justify-center">
                <div className="flex flex-col gap-2">
                    <ProfileOptions address={params.address} twitterInfo={twitterInfo} />
                    <TapeFeesManager address={params.address} />
                    <CartridgeFeesManager address={params.address} />
                </div>
                <ProfileSummary address={params.address} />
            </div>
            
            <div className="w-full md:w-2/3 flex flex-col gap-2">
                <ProfileNavigation address={params.address} />
            </div>

        </main>
    )
}


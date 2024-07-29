import { User, getUsersByAddress } from "@/app/utils/privyApi";
import ProfileNavigation from "@/app/components/ProfileNavigation";
import ProfileOptions from "@/app/components/ProfileOptions";
import ProfileSummary from "@/app/components/ProfileSummary";
import TapeFeesManager from "@/app/components/TapeFeeManager";
import CartridgeFeesManager from "@/app/components/CartridgeFeeManager";


export async function generateMetadata({ params }: { params: { address: string } }) {
    const userMap:Record<string, User> = JSON.parse(await getUsersByAddress([params.address]));

    const profileAddr = params.address.toLowerCase();
    const twitterInfo = userMap[profileAddr];
  
    const shareTitle = twitterInfo? `${twitterInfo.name} | RIVES`:`${profileAddr} | RIVES`;
    const desc = twitterInfo? `Profile "${twitterInfo.name}"`:`Profile "${profileAddr}"`;
  
    return {
      title: twitterInfo? twitterInfo.name:profileAddr,
      openGraph: {
            siteName: 'rives.io',
            title: shareTitle,
            description: desc
      },
      twitter: {
            title: shareTitle,
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
                <ProfileNavigation address={params.address} twitterInfo={twitterInfo} />
            </div>

        </main>
    )
}


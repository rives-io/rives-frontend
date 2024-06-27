import { User, getUsersByAddress } from "@/app/utils/privyApi";
import ProfileNavigation from "@/app/components/ProfileNavigation";
import ProfileOptions from "@/app/components/ProfileOptions";
import ProfileSummary from "@/app/components/ProfileSummary";



export default async function ProfilePage({ params }: { params: { address: string } }) {
    const userMap:Record<string, User> = JSON.parse(await getUsersByAddress([params.address]));
    const twitterInfo = userMap[params.address.toLowerCase()];
    
    
    return (
        <main className="w-full flex flex-col items-center gap-8 px-4 md:px-0">
            <div className="flex flex-wrap gap-8 items-center justify-center">
                <ProfileOptions address={params.address} twitterInfo={twitterInfo} />
                <ProfileSummary />
            </div>
            
            <div className="w-full md:w-2/3 flex flex-col gap-2">
                <ProfileNavigation address={params.address} />
            </div>

        </main>
    )
}

import { User, getUsersByAddress } from "@/app/utils/privyApi";
import ProfileNavigation from "@/app/components/ProfileNavigation";
import ProfileOptions from "@/app/components/ProfileOptions";



export default async function ProfilePage({ params }: { params: { address: string } }) {
    const userMap:Record<string, User> = JSON.parse(await getUsersByAddress([params.address]));
    const twitterInfo = userMap[params.address.toLowerCase()];
    
    
    return (
        <main className="w-full flex flex-col items-center gap-8 px-4 md:px-0">
            <div className="flex flex-wrap gap-8 items-center justify-center">
                <ProfileOptions address={params.address} twitterInfo={twitterInfo} />

                <div id="profile_portfolio">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-4 bg-[#403f47] flex flex-col">
                            <span>Portfolio Value</span>
                            <span>250 USD</span>
                        </div>

                        <div className="p-4 bg-[#403f47] flex flex-col">
                            <span>Cartridges Created</span>
                            <span>2</span>
                        </div>

                        <div className="p-4 bg-[#403f47] flex flex-col">
                            <span>Tapes Created</span>
                            <span>2</span>
                        </div>

                        <div className="p-4 bg-[#403f47] flex flex-col">
                            <span>Cartridges Collected</span>
                            <span>2</span>
                        </div>

                        <div className="p-4 bg-[#403f47] flex flex-col ">
                            <span>Tapes Collected</span>
                            <span>2</span>
                        </div>

                        <div className="p-4 bg-[#403f47] flex flex-col ">
                            <span>Rives Points</span>
                            <span>1234</span>
                        </div>
                    </div>
                </div>

            </div>
            
            <div className="w-full md:w-2/3 flex flex-col gap-2">
                <ProfileNavigation address={params.address} />
            </div>

        </main>
    )
}


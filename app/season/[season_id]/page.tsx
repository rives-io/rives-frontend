import { tapes } from "@/app/backend-libs/core/lib";
import SeasonBanner, { seasonDetails } from "@/app/components/SeasonBanner";
import SeasonTabs from "@/app/components/SeasonTabs";
import { envClient } from "@/app/utils/clientEnv";
import { getUsersByAddress, User } from "@/app/utils/privyApi";
import { getOlympicsData } from "@/app/utils/util";

export const revalidate = 0 // revalidate data always


export default async function SeasonPage({ params }: { params: { season_id: string } }) {
    const season_id = params.season_id;
    let season_details:seasonDetails|undefined = undefined;
    const data = await getOlympicsData("");


    let addresses:Array<string> = [];
    if (data) {
        let contestsSubmissionPromises:Array<Promise<any>> = [];
        for (let i = 0; i < data.contests.length; i++) {
            contestsSubmissionPromises.push(
                tapes(
                    {rule_id: data.contests[i].contest_id, page: 1, page_size: 0}, 
                    {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}
                )
            );
        }

        for (let i = 0; i < data.leaderboard.length; i++) {
            const item = data.leaderboard[i];
            addresses.push(item.profile_address);
        }

        const res = await Promise.all(contestsSubmissionPromises);
        season_details = {
            contests: data.contests,
            submissions: res.reduce((accumulator, currentValue) => accumulator + currentValue.total, 0)
        }
    }

    const addressUsersMap:Record<string, User> = JSON.parse(await getUsersByAddress(addresses));

    return (
        <main>
            <section className='grid gap-8 items-center'>
                <SeasonBanner season_id={season_id} details={season_details} />

                {
                    !data?
                        <></>
                    :
                        <SeasonTabs data={data} addressUsersMap={addressUsersMap}/>
                }
            </section>
        </main>
    )
}
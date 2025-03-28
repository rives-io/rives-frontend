"use client"


import { useEffect, useState } from "react";
import { getAchievements, getProfileAchievementsSummary } from "../utils/util";
import Image from "next/image";
import { Achievement, ProfileAchievementAggregated } from "../utils/common";

function UserAchievements({address}:{address:string}) {
    const [achievementsList, setAchievementsList] = useState<Array<Achievement>|null|undefined>(undefined);
    const [userAchievements, setUserAchievements] = useState<Array<ProfileAchievementAggregated>|null|undefined>(undefined);
    const [achievementHover, setAchievementHover] = useState(-1);

    useEffect(() => {
        getAchievements().then(setAchievementsList);
        getProfileAchievementsSummary(address).then(setUserAchievements);
    }, [])

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-black flex flex-col px-6 pb-4 w-fit">
                <h2 className="py-2 text-center">Achievements</h2>

                <div className="grid grid-cols-4 gap-2">
                    {/* list achievements onwed */}
                    {
                        userAchievements?.map((userAchievement, index) => {
                            const i = achievementsList?.findIndex(achievement => userAchievement.ca_slug === achievement.slug);
                            if (i == undefined) return <></>;

                            return (
                                <Image 
                                onClick={() => setAchievementHover(i)} // for mobile
                                onMouseOver={() => setAchievementHover(i)} 
                                onMouseLeave={() => setAchievementHover(-1)}
                                key={`${userAchievement.ca_slug}-${index}`}
                                src={`data:image/png;base64,${userAchievement.image_data}`}
                                width={48}
                                height={48}
                                alt=""
                                />
                            )
                        })
                    }

                    {/* list the rest of the achievements */}
                    {
                        achievementsList?.map((achievement, index) => {
                            const i = userAchievements?.findIndex(userAchievement => achievement.slug == userAchievement.ca_slug);
                            if (i == undefined || i > -1) return <></>;

                            return <Image 
                            onClick={() => setAchievementHover(index)} // for mobile
                            onMouseOver={() => setAchievementHover(index)} 
                            onMouseLeave={() => setAchievementHover(-1)}
                            className="grayscale"
                            key={`${achievement.slug}-${index}`}
                            src={`data:image/png;base64,${achievement.image_data}`}
                            width={48}
                            height={48}
                            alt=""
                            />
                        })
                    }
                </div>
            </div>

            {
                achievementHover == -1?
                    <></>
                :
                    <div className="bg-black flex gap-2 p-2 w-[264px]">
                        <div className="flex-shrink-0">
                            <Image
                            src={`data:image/png;base64,${achievementsList![achievementHover].image_data}`}
                            width={64}
                            height={64}
                            alt=""
                            />
                        </div>

                        <div className="flex flex-col">
                            <span>{achievementsList![achievementHover].name}</span>
                            {/* <span className="text-xs mb-1">{achievementsList![achievementHover].points} points</span> */}
                            <p className="text-xs">
                                {achievementsList![achievementHover].description}
                            </p>
                        </div>
                    </div>
            }

        </div>
    )
}

export default UserAchievements

"use client"


import { useState } from 'react'
import { OlympicData, PlayerOlympicData } from '../utils/common';
import { User } from '../utils/privyApi';
import Link from 'next/link';
import Image from 'next/image';
import rivesCheck from "@/public/default_profile.png";
import PlayArrow from '@mui/icons-material/PlayArrow';
import React from 'react';



function SeasonLeaderboard({data, addressUsersMap}:{data:OlympicData, addressUsersMap:Record<string, User>}) {
  const [expandedRow, setExpandedRow] = useState("");


  function handleExpandRow(player_addr:string) {
    if (player_addr == expandedRow) {
      setExpandedRow("");
    } else {
      setExpandedRow(player_addr)
    }
  }

  function tableRowDesktopScreen(player:PlayerOlympicData, rank:number) {
    const playerKey = `player-${rank}`;
    const user = addressUsersMap[player.profile_address.toLowerCase()];
    const cols = 1+1+data.contests.length;

    return (
      <React.Fragment key={player.profile_address}>
        <tr className={`${expandedRow == player.profile_address? "bg-rives-purple":""} hover:bg-rives-purple hover:cursor-pointer`} 
        onClick={() => handleExpandRow(player.profile_address)}> 
          <td className='pixelated-font px-2 text-center'>
              {rank}
          </td>

          <td className='px-2 flex items-center gap-2'>
            {
              !user?
                  <>
                      <Image width={24} height={24} src={rivesCheck} className='rounded-full pixelated-img' alt='' />
                      <span className=' pixelated-font' title={player.profile_address}>
                          {player.profile_address.substring(0,6)+"..."+player.profile_address.substring(player.profile_address.length-4,player.profile_address.length)}
                      </span>
                  </>
              :
                  <>
                      <img width={24} height={24} src={user.picture_url.replace("normal", "mini")} className='rounded-full pixelated-img' alt='' />
                      <span className=' pixelated-font' title={player.profile_address}>
                          {user.name}
                      </span>
                  </>
            }
          </td>

          {
              data.contests.map((contest, index) => {
                  const player_contest = player.contests[contest.contest_id];

                  if (!player_contest) {
                      return (
                          <td key={`${playerKey}-${contest.contest_id}`} className='pixelated-font px-2 text-center'>
                              -
                          </td>
                      )
                  }

                  return (
                      <td key={`${playerKey}-${contest.contest_id}`} className='px-2 text-center'>
                        <span className='break-all pixelated-font' title={`score: ${player_contest.score}`}>
                            {player_contest.rank}
                        </span>
                      </td>
                  )
              })
          } 
        </tr>

        <tr key={`${player.profile_address}-1`} className={`${expandedRow == player.profile_address? "":"hidden"}`}>
          <td></td> 
          
          <td className='p-2 ' colSpan={cols-1}>
            <div className='flex justify-center items-center gap-4'>
              <div className='grid items justify-items-center gap-2 h-fit'>
                {
                  !user?
                      <>
                          <Image width={73} height={73} src={rivesCheck} className='rounded-full pixelated-img' alt='' />
                          <span className='pixelated-font' title={player.profile_address}>
                              {player.profile_address.substring(0,6)+"..."+player.profile_address.substring(player.profile_address.length-4,player.profile_address.length)}
                          </span>
                      </>
                  :
                      <>
                          <img width={73} height={73} src={user.picture_url.replace("normal", "bigger")} className='rounded-full pixelated-img' alt='' />
                          <span className='pixelated-font' title={player.profile_address}>
                              {user.name}
                          </span>
                      </>
                }
              </div>


              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th className='pixelated-font px-2'>Name</th>
                    <th className='pixelated-font px-2 text-start'>Rank</th>
                    <th className='pixelated-font px-2 text-start'>Points</th>
                    <th className='pixelated-font px-2 text-start'>Score</th>
                    <th className='pixelated-font px-2 text-start'>Date</th>
                    <th className='pixelated-font px-2 text-start'>Watch</th>
                  </tr>
                </thead>

                <tbody>
                  {
                      data.contests.map((contest, index) => {
                        const player_contest = player.contests[contest.contest_id];

                        if (!player_contest) {
                          return (
                            <tr key={`details-${contest.contest_id}`}>
                              <td className='pixelated-font px-2'>Contest {index+1}</td>
                              <td className='pixelated-font px-2'>{contest.name}</td>
                              <td className='pixelated-font px-2'>-</td>
                              <td className='pixelated-font px-2'>-</td>
                              <td className='pixelated-font px-2'>-</td>
                              <td className='pixelated-font px-2'>-</td>
                              <td className='pixelated-font px-2'>-</td>
                            </tr>
                          )
                      }
                        
                        return (
                          <tr key={`details-${contest.contest_id}`}>
                              <td className='pixelated-font px-2'>Contest {index+1}</td>
                              <td className='pixelated-font px-2'>{contest.name}</td>
                              <td className='pixelated-font px-2'>{player_contest.rank}</td>
                              <td className='pixelated-font px-2'>{player_contest.points}</td>
                              <td className='pixelated-font px-2'>{player_contest.score}</td>
                              <td className='pixelated-font px-2'>-</td>
                              <td>
                                <Link href={`/tapes/${player_contest.tape_id}`} className='pixelated-font px-2 hover:text-rives-purple'>
                                  <PlayArrow />
                                </Link>
                              </td>
                          </tr>
                        );
                      })
                  } 
                </tbody>
              </table>
            </div>

          </td>
        </tr>
      </React.Fragment>
    )
  }

  return (
    <table className="w-full">
        <thead className="text-xsuppercase sticky top-0 w-full min-h-fit h-12">
            <tr className='bg-black'>
                <th scope="col" className='pixelated-font px-2 text-center'>
                    Rank
                </th>
                <th scope="col" className='pixelated-font px-2 text-center'>
                    Player
                </th>

                {
                    data.contests.map((contest, index) => {
                        return (
                            <th key={contest.contest_id} scope="col" className='px-2'>
                                <Link href={`/contests/${contest.contest_id}`} 
                                className='block pixelated-font text-center hover:text-rives-purple'>
                                    {/* {contest.name} */}
                                    Contest {index + 1}
                                </Link>
                            </th>
                        )
                    })
                }

            </tr>
        </thead>

        <tbody className='text-xs'>
          {
              data.leaderboard.map((player, index) => {
                  return tableRowDesktopScreen(player, index+1);
              })
          }
        </tbody>
    </table>
  )
}

export default SeasonLeaderboard
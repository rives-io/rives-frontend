import { RuleInfo } from "../backend-libs/core/ifaces";

export const SOCIAL_MEDIA_HASHTAGS = ["rives"];

export interface OlympicData {
  contests:Array<{contest_id:string, name:string}>,
  leaderboard:Array<PlayerOlympicData>
}

export interface PlayerOlympicData {
  profile_address:string,
  total_points:number,
  total_score:number,
  contests:{[contest_id: string]: {score:number, rank:number, points:number, tape_id:string}}
}

export interface ContestDetails {
  id:string,
  name:string,
  description:string,
  created_at:string,
  start:string,
  end:string,
  cartridge_id:string,
  sponsor_name:string,
  sponsor_image_data:string,
  sponsor_image_type:string,
  prize:string,
  achievements: Array<Achievement>
}

export interface Achievement {
  slug:string,
  name:string,
  description:string,
  points:number,
  image_data:string,
  image_type:string
}

export interface ProfileAchievementAggregated {
  ca_slug:string,
  latest:string, //"2024-08-08T16:20:11.787Z"
  total_points:number,
  count:number,
  name:string,
  description:string,
  image_data:string,
  image_type:string
}

export enum ContestStatus {
  IN_PROGRESS,
  NOT_INITIATED,
  // VALIDATED,
  FINISHED,
  INVALID,
}

export const getContestStatus = (rule: RuleInfo): ContestStatus => {
  if (rule.start == undefined || rule.end == undefined) return ContestStatus.INVALID;
  const currentTs = Math.floor((new Date()).valueOf()/1000);
  if (currentTs < rule.start) return ContestStatus.NOT_INITIATED;
  if (currentTs < rule.end) return ContestStatus.IN_PROGRESS;
  // if (rule.n_tapes == rule.n_verified) return ContestStatus.VALIDATED;
  return ContestStatus.FINISHED
}

export const getContestStatusMessage = (status: ContestStatus): string => {
  switch (status) {
    case ContestStatus.IN_PROGRESS:
      return "Open";
    case ContestStatus.NOT_INITIATED:
      return "Upcomming";
    case ContestStatus.FINISHED:
    // case ContestStatus.VALIDATED:
      return "Finished";
  
    default:
      return "";
  }
}

export const formatBytes = (bytes: number,decimals?:number): string => {
  if(bytes == 0) return '0 Bytes';
  var k = 1024,
      dm = decimals || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
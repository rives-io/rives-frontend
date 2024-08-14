/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface _Master_ {
  TapeAward: TapeAward;
  CartridgeInfo: CartridgeInfo;
  SetInternalVerifyLock: SetInternalVerifyLock;
  VerifyPayloadProxy: VerifyPayloadProxy;
  CartridgesOutput: CartridgesOutput;
  GetCartridgeTagsPayload: GetCartridgeTagsPayload;
  CartridgePayload: CartridgePayload;
  CartridgeEvent: CartridgeEvent;
  SetOperatorPayload: SetOperatorPayload;
  UpdateRivosPayload: UpdateRivosPayload;
  GetRulesPayload: GetRulesPayload;
  GetRuleTagsPayload: GetRuleTagsPayload;
  CartridgeRemoved: CartridgeRemoved;
  GetTapesPayload: GetTapesPayload;
  CleanTapesPayloadProxy: CleanTapesPayloadProxy;
  CartridgesPayload: CartridgesPayload;
  TapesOutput: TapesOutput;
  RuleDataProxy: RuleDataProxy;
  ExternalVerificationPayloadProxy: ExternalVerificationPayloadProxy;
  CartridgePayloadSplittable: CartridgePayloadSplittable;
  CartridgeAuthorsOutput: CartridgeAuthorsOutput;
  SetUnlockedCartridgePayloadProxy: SetUnlockedCartridgePayloadProxy;
  InsertCartridgePayloadProxy: InsertCartridgePayloadProxy;
  TransferCartridgePayloadProxy: TransferCartridgePayloadProxy;
  AwardWinnerTapesPayloadProxy: AwardWinnerTapesPayloadProxy;
  RuleCreated: RuleCreated;
  EmptyClass: EmptyClass;
  FormatInCardPayload: FormatInCardPayload;
  RuleTagsOutput: RuleTagsOutput;
  GetCartridgeAuthorsPayload: GetCartridgeAuthorsPayload;
  VerificationOutput: VerificationOutput;
  RemoveCartridgePayloadProxy: RemoveCartridgePayloadProxy;
  RulesOutput: RulesOutput;
  CartridgeTagsOutput: CartridgeTagsOutput;
}
export interface TapeAward {
  version: string;
  cartridge_id: string;
  cartridge_input_index: number;
  cartridge_user_address: string;
  user_address: string;
  timestamp: number;
  score: number;
  rule_id: string;
  rule_input_index: number;
  tape_id: string;
  tape_input_index: number;
  rank: number;
}
export interface CartridgeInfo {
  id: string;
  name: string;
  user_address: string;
  input_index?: number;
  authors?: string[];
  info?: InfoCartridge;
  original_info?: InfoCartridge;
  created_at: number;
  updated_at: number;
  cover?: string;
  active?: boolean;
  unlocked?: boolean;
  primary?: boolean;
  primary_id?: string;
  last_version?: string;
  versions?: string[];
  tapes?: string[];
  tags?: string[];
}
export interface InfoCartridge {
  name?: string;
  summary?: string;
  description?: string;
  version?: string;
  status?: string;
  tags?: string[];
  authors?: Author[];
  links?: string[];
  tapes?: string[];
}
export interface Author {
  name: string;
  link: string;
}
export interface SetInternalVerifyLock {
  lock: boolean;
}
export interface VerifyPayloadProxy {
  rule_id: string;
  outcard_hash: string;
  tape: string;
  claimed_score: number;
  tapes: string[];
  in_card: string;
}
export interface CartridgesOutput {
  data: CartridgeInfo[];
  total: number;
  page: number;
}
export interface GetCartridgeTagsPayload {
  name?: string;
}
export interface CartridgePayload {
  id: string;
}
export interface CartridgeEvent {
  version: string;
  cartridge_id: string;
  cartridge_input_index: number;
  cartridge_user_address: string;
  timestamp: number;
}
export interface SetOperatorPayload {
  new_operator_address: string;
}
export interface UpdateRivosPayload {
  data: string;
}
export interface GetRulesPayload {
  cartridge_id?: string;
  id?: string;
  ids?: string[];
  active_ts?: number;
  has_start?: boolean;
  has_end?: boolean;
  created_by?: string;
  name?: string;
  page?: number;
  page_size?: number;
  order_by?: string;
  order_dir?: string;
  tags?: string[];
  tags_or?: boolean;
  full?: boolean;
}
export interface GetRuleTagsPayload {
  name?: string;
  cartridge_id?: string;
}
export interface CartridgeRemoved {
  cartridge_id: string;
  timestamp: number;
}
export interface GetTapesPayload {
  cartridge_id?: string;
  rule_id?: string;
  id?: string;
  user_address?: string;
  ids?: string[];
  timestamp_lte?: number;
  timestamp_gte?: number;
  rank_lte?: number;
  rank_gte?: number;
  page?: number;
  page_size?: number;
  order_by?: string;
  order_dir?: string;
  tags?: string[];
  tags_or?: boolean;
  full?: boolean;
}
export interface CleanTapesPayloadProxy {
  rule_id: string;
}
export interface CartridgesPayload {
  name?: string;
  author?: string;
  tags?: string[];
  ids?: string[];
  user_address?: string;
  page?: number;
  page_size?: number;
  order_by?: string;
  order_dir?: string;
  get_cover?: boolean;
  tags_or?: boolean;
  full?: boolean;
  enable_inactive?: boolean;
  enable_non_primary?: boolean;
  locked?: boolean;
}
export interface TapesOutput {
  data: TapeInfo[];
  total: number;
  page: number;
}
export interface TapeInfo {
  id: string;
  cartridge_id: string;
  rule_id: string;
  user_address: string;
  timestamp: number;
  input_index?: number;
  score?: number;
  rank?: number;
  verified?: boolean;
  in_card?: string;
  data?: string;
  out_card?: string;
  tapes?: string[];
}
export interface RuleDataProxy {
  cartridge_id: string;
  name: string;
  description: string;
  args: string;
  in_card: string;
  score_function: string;
  start: number;
  end: number;
  tags: string[];
  tapes: string[];
  allow_tapes: boolean;
  allow_in_card: boolean;
  save_tapes: boolean;
  save_out_cards: boolean;
}
export interface ExternalVerificationPayloadProxy {
  tape_ids: string[];
  scores: number[];
  error_codes: number[];
  outcards: string[];
}
export interface CartridgePayloadSplittable {
  id: string;
  part?: number;
}
export interface CartridgeAuthorsOutput {
  authors: string[];
}
export interface SetUnlockedCartridgePayloadProxy {
  ids: string[];
  unlocks: boolean[];
}
export interface InsertCartridgePayloadProxy {
  data: string;
}
export interface TransferCartridgePayloadProxy {
  id: string;
  new_user_address: string;
}
export interface AwardWinnerTapesPayloadProxy {
  rule_id: string;
  tapes_to_award: number;
}
export interface RuleCreated {
  rule_id: string;
  created_by: string;
  created_at: number;
}
export interface EmptyClass {}
export interface FormatInCardPayload {
  rule_id?: string;
  cartridge_id?: string;
  in_card?: string;
  tapes?: string[];
}
export interface RuleTagsOutput {
  tags: string[];
}
export interface GetCartridgeAuthorsPayload {
  name?: string;
}
export interface VerificationOutput {
  version: string;
  cartridge_id: string;
  cartridge_input_index: number;
  cartridge_user_address: string;
  user_address: string;
  timestamp: number;
  score: number;
  rule_id: string;
  rule_input_index: number;
  tape_id: string;
  tape_input_index: number;
  error_code: number;
  tapes: string[];
}
export interface RemoveCartridgePayloadProxy {
  id: string;
}
export interface RulesOutput {
  data: RuleInfo[];
  total: number;
  page: number;
}
export interface RuleInfo {
  id: string;
  name: string;
  description: string;
  cartridge_id: string;
  created_by: string;
  created_at: number;
  input_index?: number;
  args: string;
  in_card: string;
  score_function: string;
  start?: number;
  end?: number;
  tags: string[];
  allow_tapes?: boolean;
  allow_in_card?: boolean;
  save_tapes?: boolean;
  save_out_cards?: boolean;
  tapes?: string[];
}
export interface CartridgeTagsOutput {
  tags: string[];
}

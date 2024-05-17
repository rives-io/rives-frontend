/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface _Master_ {
  InsertCartridgePayload: InsertCartridgePayload;
  GetRuleTagsPayload: GetRuleTagsPayload;
  VerifyPayload: VerifyPayload;
  CartridgesOutput: CartridgesOutput;
  RemoveCartridgePayload: RemoveCartridgePayload;
  RuleCreated: RuleCreated;
  CartridgePayloadSplittable: CartridgePayloadSplittable;
  GetRulesPayload: GetRulesPayload;
  VerificationOutput: VerificationOutput;
  CartridgePayload: CartridgePayload;
  RuleData: RuleData;
  RuleTagsOutput: RuleTagsOutput;
  EmptyClass: EmptyClass;
  CartridgeInfo: CartridgeInfo;
  RulesOutput: RulesOutput;
  CartridgesPayload: CartridgesPayload;
  CartridgeRemoved: CartridgeRemoved;
  ExternalVerificationPayload: ExternalVerificationPayload;
  CartridgeInserted: CartridgeInserted;
}
export interface InsertCartridgePayload {
  data: string;
}
export interface GetRuleTagsPayload {
  cartridge_id?: string;
}
export interface VerifyPayload {
  rule_id: string;
  outcard_hash: string;
  tape: string;
  claimed_score: number;
}
export interface CartridgesOutput {
  data: CartridgeInfo[];
  total: number;
  page: number;
}
export interface CartridgeInfo {
  id: string;
  name: string;
  user_address: string;
  authors: string[];
  info?: InfoCartridge;
  created_at: number;
  cover?: string;
}
export interface InfoCartridge {
  name: string;
  summary?: string;
  description?: string;
  version?: string;
  status?: string;
  tags: string[];
  authors?: Author[];
  url?: string;
}
export interface Author {
  name: string;
  link: string;
}
export interface RemoveCartridgePayload {
  id: string;
}
export interface RuleCreated {
  rule_id: string;
  created_by: string;
  created_at: number;
}
export interface CartridgePayloadSplittable {
  id: string;
  part?: number;
}
export interface GetRulesPayload {
  cartridge_id?: string;
  id?: string;
  ids?: string[];
  active_ts?: number;
  name?: string;
  page?: number;
  page_size?: number;
}
export interface VerificationOutput {
  version: string;
  cartridge_id: string;
  cartridge_input_index: number;
  user_address: string;
  timestamp: number;
  score: number;
  rule_id: string;
  rule_input_index: number;
  tape_hash: string;
  tape_input_index: number;
  error_code: number;
}
export interface CartridgePayload {
  id: string;
}
export interface RuleData {
  cartridge_id: string;
  name: string;
  description: string;
  args: string;
  in_card: string;
  score_function: string;
  start: number;
  end: number;
  tags: string[];
}
export interface RuleTagsOutput {
  tags: string[];
}
export interface EmptyClass {}
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
  args: string;
  in_card: string;
  score_function: string;
  n_tapes: number;
  n_verified: number;
  start?: number;
  end?: number;
  tags: string[];
}
export interface CartridgesPayload {
  name?: string;
  authors?: string[];
  tags?: string[];
  page?: number;
  page_size?: number;
  get_cover?: boolean;
}
export interface CartridgeRemoved {
  cartridge_id: string;
  timestamp: number;
}
export interface ExternalVerificationPayload {
  user_addresses: string[];
  rule_ids: string[];
  tape_hashes: string[];
  tape_input_indexes: number[];
  tape_timestamps: number[];
  scores: number[];
  error_codes: number[];
}
export interface CartridgeInserted {
  cartridge_id: string;
  user_address: string;
  timestamp: number;
}

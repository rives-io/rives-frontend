/* eslint-disable */
/**
 * This file was automatically generated by cartesapp.template_generator.
 * DO NOT MODIFY IT BY HAND. Instead, run the generator,
 */
import { ethers, Signer, ContractReceipt } from "ethers";

import { 
    advanceInput, inspect, 
    AdvanceOutput, InspectOptions, AdvanceInputOptions, GraphqlOptions,
    EtherDepositOptions, ERC20DepositOptions, ERC721DepositOptions,
    Report as CartesiReport, Notice as CartesiNotice, Voucher as CartesiVoucher, Input as CartesiInput,
    advanceDAppRelay, advanceERC20Deposit, advanceERC721Deposit, advanceEtherDeposit,
    queryNotice, queryReport, queryVoucher
} from "cartesi-client";


import Ajv from "ajv"
import addFormats from "ajv-formats"

import { 
    genericAdvanceInput, genericInspect, IOType, Models,
    IOData, Input, Output, Event, ContractCall, InspectReport, 
    MutationOptions, QueryOptions, 
    CONVENTIONAL_TYPES, decodeToConventionalTypes
} from "../cartesapp/utils"

import * as ifaces from "./ifaces";


/**
 * Configs
 */

const ajv = new Ajv();
addFormats(ajv);
ajv.addFormat("biginteger", (data) => {
    const dataTovalidate = data.startsWith('-') ? data.substring(1) : data;
    return ethers.utils.isHexString(dataTovalidate) && dataTovalidate.length % 2 == 0;
});
const MAX_SPLITTABLE_OUTPUT_SIZE = 4194247;

/*
 * Mutations/Advances
 */


/*
 * Queries/Inspects
 */

export async function indexerQuery(
    inputData: ifaces.IndexerPayload,
    options?:QueryOptions
):Promise<InspectReport|any> {
    const route = 'indexer/indexer_query';
    const data: IndexerPayload = new IndexerPayload(inputData);
    const output: InspectReport = await genericInspect<ifaces.IndexerPayload>(data,route,options);
    if (options?.decode) { return decodeToModel(output,options.decodeModel || "json"); }
    return output;
}




/**
 * Models Decoders/Exporters
 */

export function decodeToModel(data: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport | CartesiInput, modelName: string): any {
    if (modelName == undefined)
        throw new Error("undefined model");
    if (CONVENTIONAL_TYPES.includes(modelName))
        return decodeToConventionalTypes(data.payload,modelName);
    const decoder = models[modelName].decoder;
    if (decoder == undefined)
        throw new Error("undefined decoder");
    return decoder(data);
}

export function exportToModel(data: any, modelName: string): string {
    const exporter = models[modelName].exporter;
    if (exporter == undefined)
        throw new Error("undefined exporter");
    return exporter(data);
}

export class IndexerPayloadInput extends Input<ifaces.IndexerPayload> { constructor(data: CartesiInput) { super(models['IndexerPayload'],data); } }
export function decodeToIndexerPayloadInput(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport | CartesiInput): IndexerPayloadInput {
    return new IndexerPayloadInput(output as CartesiInput);
}

export class IndexerPayload extends IOData<ifaces.IndexerPayload> { constructor(data: ifaces.IndexerPayload, validate: boolean = true) { super(models['IndexerPayload'],data,validate); } }
export function exportToIndexerPayload(data: ifaces.IndexerPayload): string {
    const dataToExport: IndexerPayload = new IndexerPayload(data);
    return dataToExport.export();
}
export class IndexerOutput extends Output<ifaces.IndexerOutput> { constructor(output: CartesiReport | InspectReport) { super(models['IndexerOutput'],output); } }
export function decodeToIndexerOutput(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport | CartesiInput): IndexerOutput {
    return new IndexerOutput(output as CartesiReport);
}


/**
 * Model
 */

export const models: Models = {
    'IndexerPayload': {
        ioType:IOType.queryPayload,
        abiTypes:[],
        params:['tags', 'type', 'msg_sender', 'timestamp_gte', 'timestamp_lte', 'module', 'input_index', 'dapp_address', 'order_by', 'order_dir', 'page', 'page_size'],
        decoder: decodeToIndexerPayloadInput,
        exporter: exportToIndexerPayload,
        validator: ajv.compile<ifaces.IndexerPayload>(JSON.parse('{"title": "IndexerPayload", "type": "object", "properties": {"tags": {"type": "array", "items": {"type": "string"}}, "type": {"type": "string"}, "msg_sender": {"type": "string"}, "timestamp_gte": {"type": "integer"}, "timestamp_lte": {"type": "integer"}, "module": {"type": "string"}, "input_index": {"type": "integer"}, "dapp_address": {"type": "string"}, "order_by": {"type": "string"}, "order_dir": {"type": "string"}, "page": {"type": "integer"}, "page_size": {"type": "integer"}}}'))
    },
    'IndexerOutput': {
        ioType:IOType.report,
        abiTypes:[],
        params:['data', 'total', 'page'],
        decoder: decodeToIndexerOutput,
        validator: ajv.compile<ifaces.IndexerOutput>(JSON.parse('{"title": "IndexerOutput", "type": "object", "properties": {"data": {"type": "array", "items": {"$ref": "#/definitions/OutputIndex"}}, "total": {"type": "integer"}, "page": {"type": "integer"}}, "required": ["data", "total", "page"], "definitions": {"OutputIndex": {"title": "OutputIndex", "type": "object", "properties": {"type": {"type": "string"}, "module": {"type": "string"}, "class_name": {"type": "string"}, "input_index": {"type": "integer"}, "output_index": {"type": "integer"}, "dapp_address": {"type": "string"}}, "required": ["type", "module", "class_name", "input_index"]}}}'))
    },
    };
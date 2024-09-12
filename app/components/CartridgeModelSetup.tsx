"use client"


import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';

import { extractTxError, formatCartridgeIdToBytes, getChain } from "../utils/util";
import { createPublicClient, encodeAbiParameters, encodeFunctionData, erc20Abi, formatUnits, getContract, GetContractReturnType, http, parseAbi, parseAbiParameters, parseUnits, PublicClient, WalletClient } from "viem";

import { envClient } from "../utils/clientEnv";
import { VerificationOutput, getOutputs, CartridgeEvent } from "../backend-libs/core/lib";
import { CartridgeInfo as Cartridge } from '../backend-libs/core/ifaces';


import cartridgeAbiFile from "@/app/contracts/Cartridge.json"
import React, { Fragment, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import ErrorModal, { ERROR_FEEDBACK } from "./ErrorModal";
import { getCartridgeBondInfo, getCartridgeOwner, getSubmissionModelActive, getSubmitPrice, getTapeSubmissionModelAddress, getTapeSubmissionModelFromAddress, setupTapeSubmission, TAPE_SUBMIT_MODEL, worldAbi, ZERO_ADDRESS, } from "../utils/assets";
import { Dialog, Transition } from "@headlessui/react";
import { Input } from '@mui/base/Input';
import CartridgeCard from "./CartridgeCard";
import Link from "next/link";

const cartridgeAbi = cartridgeAbiFile;
const chain = getChain(envClient.NETWORK_CHAIN_ID);
const publicClient = createPublicClient({
    chain: chain,
    transport: http(),
});


enum BC_MODEL {
    NOT_DEFINED,
    STANDARD,
    FREE,
    FIXED,
    EXISTING,
};

enum MODAL_STATE {
    NOT_PREPARED,
    SUBMITTING,
    SUBMITTED,
}

function CartridgeModelSetup({cartridgeId, reloadFn, cancelFn}:{cartridgeId:string, reloadFn():void, cancelFn():void}) {
    const {user, ready, authenticated, connectWallet, login} = usePrivy();
    const {wallets} = useWallets();

    const [cartridgeOwner, setCartridgeOwner] = useState<String>();
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [reload,setReload] = useState<number>(0);
    
    // cartridge Marketplace State
    const [cartridgeExists, setCartridgeExists] = useState<boolean>();

    const [tapeSubmitModel, setTapeSubmitModel] = useState<TAPE_SUBMIT_MODEL>();
    const [selectedTapeSubmitModel, setSelectedTapeSubmitModel] = useState<TAPE_SUBMIT_MODEL>();
    // const [currentTapeSubmissionModel, setCurrentTapeSubmissionModel] = useState<[string,string]>();
    const [tapeSubmissionModelConfig, setTapeSubmissionModelConfig] = useState<string>();
    const [selectedBCModel, setSelectedBCModel] = useState<BC_MODEL>();

    const [priceValue,setPriceValue] = useState<string>('1');
    const [currencyToken,setCurrencyToken] = useState<`0x${string}`>(`0x${ZERO_ADDRESS.slice(2)}`);
    const [decimals,setDecimals] = useState<number>(18);
    const [symbol,setSymbol] = useState<string>("ETH");
    const [currencyError,setCurrencyError] = useState<string>();
    const [currentModelInfo,setCurrentModelInfo] = useState<string>();
    const [automaticTapeSales, setAutomaticTapeSales] = useState<boolean>(false);
    const [freeModelActive, setFreeModelActive] = useState<boolean>(false);
    const [ownershipModelActive, setOwnershipModelActive] = useState<boolean>(false);
    const [feeModelActive, setFeeModelActive] = useState<boolean>(false);
    
    // contract instance used for execute view functions (contract.read.method)
    const [cartridgeContractReading, setCartridgeContractReading] = useState<GetContractReturnType<typeof cartridgeAbi.abi, PublicClient | WalletClient>>();
    const [worldContractReading, setWorldContractReading] = useState<GetContractReturnType<typeof worldAbi, PublicClient | WalletClient>>();
    const [erc20Contract, setErc20Contract] = useState<GetContractReturnType<typeof erc20Abi, PublicClient | WalletClient>>();

    // Modal State
    const [errorFeedback, setErrorFeedback] = useState<ERROR_FEEDBACK>();
    const [modalState, setModalState] = useState({isOpen: false, state: MODAL_STATE.NOT_PREPARED});

    const cartridgeIdB32 = formatCartridgeIdToBytes(cartridgeId).slice(2);
    const userAddress = (ready && authenticated)? user?.wallet?.address.toLowerCase(): "";
    const isOperator = envClient.OPERATOR_ADDR?.toLowerCase() == userAddress;


    useEffect(() => {
        if (cartridgeIdB32) {
            // getCartridgeInsetOutput(cartridgeIdB32).then((out) => setCartridgeOutput(out))
            getCartridgeOwner(cartridgeIdB32).then(addr => {
                if (addr) {
                    setCartridgeOwner(addr);
                    setIsOwner(cartridgeOwner?.toLowerCase() == userAddress);
                }
            });
        }

        publicClient.getCode({
            address: envClient.WORLD_ADDRESS as `0x${string}`
        }).then((bytecode) => {
            if (!bytecode || bytecode == '0x') {
                console.log("Couldn't get world contract")
                return;
            }

            const contract = getContract({
                address: envClient.WORLD_ADDRESS as `0x${string}`,
                abi: worldAbi,
                client: publicClient,
            });
            setWorldContractReading(contract);

            getCartridgeModelInfo(contract);
        });

        publicClient.getCode({
            address: envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`
        }).then((bytecode) => {
            if (!bytecode || bytecode == '0x') {
                console.log("Couldn't get cartridge contract")
                return;
            }

            const contract = getContract({
                address: envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`,
                abi: cartridgeAbi.abi,
                client: publicClient,
            });
            setCartridgeContractReading(contract);

            getCartridgeMarketInfo(contract);
        });
    }, [])

    useEffect(() => {
        if (worldContractReading)
            getCartridgeModelInfo(worldContractReading);
        if (cartridgeContractReading)
            getCartridgeMarketInfo(cartridgeContractReading);
    }, [reload])

    async function getCartridgeModelInfo(contract:GetContractReturnType<typeof worldAbi, PublicClient | WalletClient>) {
        const model = (await contract.read.getTapeSubmissionModel([`0x${cartridgeIdB32}`])) as [string,string];

        setTapeSubmitModel(getTapeSubmissionModelFromAddress(model[0]));
        getCurrentModelInfo(model);

        setFreeModelActive(await getSubmissionModelActive(TAPE_SUBMIT_MODEL.FREE));
        setOwnershipModelActive(await getSubmissionModelActive(TAPE_SUBMIT_MODEL.OWNERSHIP));
        setFeeModelActive(await getSubmissionModelActive(TAPE_SUBMIT_MODEL.FEE));
    }

    async function getCartridgeMarketInfo(contract:GetContractReturnType<typeof cartridgeAbi.abi, PublicClient | WalletClient>) {
        const exists = (await contract.read.exists([`0x${cartridgeIdB32}`])) as boolean;
        setCartridgeExists(exists);

        if (!exists) return;

        const bondInfo = await getCartridgeBondInfo(`0x${cartridgeIdB32}`, false);
        if (!bondInfo) return;

    }

    async function getCurrentModelInfo(currentTapeSubmissionModel: [string,string]) {
        if (!currentTapeSubmissionModel) return;
        let modelInfoText: string |undefined = undefined;
        const model = getTapeSubmissionModelFromAddress(currentTapeSubmissionModel[0]);
        if (model == TAPE_SUBMIT_MODEL.FREE) {
            modelInfoText = "Free";
        } else if (model == TAPE_SUBMIT_MODEL.OWNERSHIP) {
            modelInfoText = "Cartridge Ownership";
        } else if (model == TAPE_SUBMIT_MODEL.FEE) {
            const submitPrice = await getSubmitPrice(currentTapeSubmissionModel[1]);
            let priceText:string = "";
            if (submitPrice) {
                priceText = ` (${parseFloat(
                    formatUnits(submitPrice.value, submitPrice.decimals))
                    .toLocaleString("en", {minimumFractionDigits: 6,})} ${submitPrice.symbol})`;
            }
            modelInfoText = `Submit Fee${priceText}`;
        } else {
            return;
        }
        setCurrentModelInfo(`Current Model: ${modelInfoText}`);
    }
    //
    // User Actions
    //

    function userReady() {
        if (!ready) return null;

        if (!user) {
            setErrorFeedback({
                message:"Login first", 
                severity: "warning", 
                dismissible: true, 
                dissmissFunction: () => {
                    login(); 
                    setErrorFeedback(undefined)
                }
            });
            return null;
        }

        const wallet = wallets.find((wallet) => wallet.address === user!.wallet!.address);
        if (!wallet) {
            setErrorFeedback({
                message:`Connect wallet ${user!.wallet!.address}`, 
                severity: "warning", 
                dismissible: true, 
                dissmissFunction: () => {
                    connectWallet(); 
                    setErrorFeedback(undefined)
                }
            });
            return null;
        }

        return wallet;
    }

    function setSelectedModel(e: React.ChangeEvent<HTMLInputElement>) {
        const model: TAPE_SUBMIT_MODEL = TAPE_SUBMIT_MODEL[e.target.value as keyof typeof TAPE_SUBMIT_MODEL];
        if (model == TAPE_SUBMIT_MODEL.FREE) {
            setTapeSubmissionModelConfig('0x');
        } else if (model == TAPE_SUBMIT_MODEL.FEE) {
            setFeeModelConfig(priceValue);
        } else if (model == TAPE_SUBMIT_MODEL.OWNERSHIP) {
            if (cartridgeExists) {
                setSelectedBCModel(BC_MODEL.EXISTING);
                setBCModelConfig(BC_MODEL.EXISTING,priceValue,automaticTapeSales);
            } else {
                setTapeSubmissionModelConfig(undefined);
            }
        } else { 
            setTapeSubmissionModelConfig(undefined);
        }
        setSelectedTapeSubmitModel(model);
    }

    function setBCModel(e: React.ChangeEvent<HTMLInputElement>) {
        const model: BC_MODEL = BC_MODEL[e.target.value as keyof typeof BC_MODEL];
        setSelectedBCModel(model);
        setBCModelConfig(model,priceValue,automaticTapeSales);
    }

    function setAutoTape() {
        setBCModelConfig(selectedBCModel,priceValue,!automaticTapeSales);
        setAutomaticTapeSales(!automaticTapeSales);
    }

    function setBCModelConfig(model: BC_MODEL| undefined, value: string|undefined, autoTape: boolean) {
        const autoTapeSales = autoTape ? BigInt(1) : BigInt(0);
        if (model == BC_MODEL.STANDARD) {
            const payload = encodeFunctionData({
                abi: cartridgeAbi.abi,
                functionName: 'setCartridgeParams',
                args:[`0x${cartridgeIdB32}`]
            });

            const encodedConfig = encodeAbiParameters(
                parseAbiParameters('address,bytes,uint256'),
                [
                    envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`,
                    payload,
                    autoTapeSales
                ]
            );

            setTapeSubmissionModelConfig(encodedConfig);
        } else if (model == BC_MODEL.FREE) {
            
            const wallet = userReady();
            if (!wallet) {
                setErrorFeedback({message:"You must connect your wallet", severity: "error", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
                return;
            }

            const payload = encodeFunctionData({
                abi: cartridgeAbi.abi,
                functionName: 'setCartridgeParamsCustom',
                args:[`0x${cartridgeIdB32}`, 0, [10000,'0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'], [0,0], true,wallet.address]
            });

            const encodedConfig = encodeAbiParameters(
                parseAbiParameters('address,bytes,uint256'),
                [
                    envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`,
                    payload,
                    autoTapeSales
                ]
            );
            setTapeSubmissionModelConfig(encodedConfig);
        } else if (model == BC_MODEL.FIXED) {

            // const value = priceValue; // '0x1c6bf52634000'
            if (value) {
                const formattedValue = parseUnits(value,decimals);

                const payload = encodeFunctionData({
                    abi: cartridgeAbi.abi,
                    functionName: 'setCartridgeParamsCustom',
                    args: [`0x${cartridgeIdB32}`, formattedValue, ['0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'], [0], false, ZERO_ADDRESS]
                });

                const encodedConfig = encodeAbiParameters(
                    parseAbiParameters('address,bytes,uint256'),
                    [
                        envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`,
                        payload,
                        autoTapeSales
                    ]
                );

                setTapeSubmissionModelConfig(encodedConfig);
            }
        } else if (model == BC_MODEL.EXISTING) {

            const encodedConfig = encodeAbiParameters(
                parseAbiParameters('address,bytes,uint256'),
                [
                    envClient.CARTRIDGE_CONTRACT_ADDR as `0x${string}`,
                    '0x',
                    autoTapeSales
                ]
            );
            setTapeSubmissionModelConfig(encodedConfig);
        } else {
            setTapeSubmissionModelConfig(undefined);
        }

    }

    function setFeeModelConfig(value: string|undefined) {
        if (value) {

            const formattedValue = parseUnits(value,decimals);
            const encodedConfig = encodeAbiParameters(
                parseAbiParameters('address,uint256'),
                [
                   currencyToken, // currency token
                   formattedValue
                ]
            );

            setTapeSubmissionModelConfig(encodedConfig);
        } else {
            setTapeSubmissionModelConfig(undefined);
        }
    }

    function changePrice(value:string) {
        if (!value) return;
        const val = parseFloat(value);
        if (val < 0) {
            setPriceValue('0');
            return;
        }
        setPriceValue(value);

        if (selectedTapeSubmitModel == TAPE_SUBMIT_MODEL.OWNERSHIP) {
            setBCModelConfig(selectedBCModel,value,automaticTapeSales);
        } else if (selectedTapeSubmitModel == TAPE_SUBMIT_MODEL.FEE) {
            setFeeModelConfig(value);
        }
        
    }

    async function changeToken(value:string) {
        if (!value.startsWith("0x") || value.length != 42) return;
        const token: `0x${string}` = `0x${value.slice(2)}`;
        setCurrencyError(undefined);
        if (token == ZERO_ADDRESS) {
            setDecimals(18);
            setSymbol("ETH");
            setCurrencyToken(token);
        } else {
            try {
                const decimalsOut: number = await publicClient.readContract({
                    address: token,
                    abi: erc20Abi,
                    functionName: "decimals",
                    args: []
                });
                const symbolOut: string = await publicClient.readContract({
                    address: token,
                    abi: erc20Abi,
                    functionName: "symbol",
                    args: []
                });
                setDecimals(decimalsOut);
                setSymbol(symbolOut);
                setCurrencyToken(token);
            } catch (error) {
                console.log(error)
                setCurrencyError("Invalid token");
                return;
            }
        }
        if (priceValue) changePrice(priceValue);
    }

    async function setupSubmissionModel() {
        const wallet = userReady();
        if (!wallet) return;

        if (!selectedTapeSubmitModel) return;

        const modelAddr = getTapeSubmissionModelAddress(selectedTapeSubmitModel as TAPE_SUBMIT_MODEL);
        if (!modelAddr) return;
        if (!tapeSubmissionModelConfig) return;

        setModalState({isOpen:true, state: MODAL_STATE.SUBMITTING});
        try {
            await setupTapeSubmission(cartridgeId, modelAddr,tapeSubmissionModelConfig, wallet);
            setModalState({...modalState, state: MODAL_STATE.SUBMITTED});
            setReload(reload+1);
            reloadFn();
        } catch (error) {
            console.log(error)
            let errorMsg = (error as Error).message;
            if (errorMsg.toLowerCase().indexOf("user rejected") > -1) errorMsg = "User rejected tx";
            else errorMsg = extractTxError(errorMsg);
            setErrorFeedback({message:errorMsg, severity: "error", dismissible: true, dissmissFunction:()=>setErrorFeedback(undefined)});
            setModalState({isOpen:false, state: MODAL_STATE.NOT_PREPARED});
        }
    }

    //
    // Modal Functions
    //
    function closeModal() {
        setModalState({...modalState, isOpen: false});
    }
    
    function submitModalBody() {
        let modalBodyContent:JSX.Element = <></>;
        if(modalState.state == MODAL_STATE.SUBMITTING) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-gray-900 pixelated-font">
                        Submitting Transaction
                    </Dialog.Title>
        
                    <div className="p-6 flex justify-center mt-4">
                        <div className='w-12 h-12 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
                    </div>

                </>
            );
        } else if (modalState.state == MODAL_STATE.SUBMITTED) {
            modalBodyContent = (
                <>
                    <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-gray-900 pixelated-font mb-6">
                        Submission model Set
                    </Dialog.Title>

                    <div className="flex pb-2 mt-4">
                        <button className="dialog-btn bg-red-400 text-black zoom-btn"
                        onClick={closeModal}
                        >
                            Close
                        </button>
                    </div>                    
                </>
            );
        }
        return (
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-gray-500 p-4 shadow-xl transition-all flex flex-col items-center">
                {modalBodyContent}
            </Dialog.Panel>
        )
    }

    if (errorFeedback) {
        return <ErrorModal error={errorFeedback} />;
    }

    if (!isOperator && !isOwner)
        return <></>;
    
    //
    // JSX
    //
    function setupSubmissionOptions(model: TAPE_SUBMIT_MODEL|undefined) {
        if (!model) return (<></>);
        if (model == TAPE_SUBMIT_MODEL.FREE) {
            return (<></>);
        }
        if (model == TAPE_SUBMIT_MODEL.OWNERSHIP) {
            if (cartridgeExists) {
                return (<>
                    <span>Bonding Curve already configured</span>
                    <FormControlLabel control={
                        <Switch checked={automaticTapeSales} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoTape()}/>
                            } label="Automatic Tape Sales" />
                </>);
            }
            return (<>
            
                <FormControl>
                    <FormLabel id="demo-radio-buttons-group-label" focused={false}>Bonding Curve Model</FormLabel>
                    <RadioGroup
                        aria-labelledby="demo-radio-buttons-group-label"
                        defaultValue={BC_MODEL[BC_MODEL.NOT_DEFINED]}
                        onChange={setBCModel}
                        name="radio-buttons-group"
                        row
                    >
                        <FormControlLabel value={BC_MODEL[BC_MODEL.STANDARD]} control={<Radio />} label="Standard" 
                            title="Setup standard recommended bonding curve model"  />
                        <FormControlLabel value={BC_MODEL[BC_MODEL.FREE]} control={<Radio />} label="Free" 
                            title="Setup bonding curve model value to zero" />
                        <FormControlLabel value={BC_MODEL[BC_MODEL.FIXED]} control={<Radio />} label="Fixed" 
                            title="Setup fixed price bonding curve model" />
                    </RadioGroup>
                </FormControl>

                {selectedBCModel == BC_MODEL.FIXED ? <div className="mt-4 text-center grid grid-cols-1 gap-2">
                    <TextField id="price" label={`Cartridge Price (${symbol})`} type="number" value={priceValue} onChange={(e) => changePrice(e.target.value)} 
                        variant='outlined' focused color='info' />
                    <TextField id="price" label="Token" value={currencyToken} onChange={(e) => changeToken(e.target.value)} 
                        variant='outlined' focused color='info' helperText={currencyError} />
                    {/* <span className="place-self-start">Cartridge Price</span>
                    <Input className="text-black" aria-label="Price" placeholder="value" type="number" value={priceValue} onChange={(e) => changePrice(e.target.value)} /> */}
                </div> : <></>}
                <FormControlLabel control={
                    <Switch checked={automaticTapeSales} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoTape()}/>
                        } label="Automatic Tape Sales" />
            </>);
        }
        if (model == TAPE_SUBMIT_MODEL.FEE) {
            return (<>
                <div className="mt-4 text-center grid grid-cols-1 gap-2">
                    <TextField id="price" label="Submit Fee" type="number" value={priceValue} onChange={(e) => changePrice(e.target.value)} color='info' />
                    <TextField id="price" label="Token" value={currencyToken} onChange={(e) => changeToken(e.target.value)} 
                        variant='outlined' color='info' helperText={currencyError} />
                    {/* <span className="place-self-start">Submit Fee</span>
                    <Input className="text-black" aria-label="Fee" placeholder="value" type="number" value={priceValue} onChange={(e) => changePrice(e.target.value)} /> */}
                </div>
            </>);
        }
        return (<></>);
    }

    return (
        <>
            <Transition appear show={modalState.isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-20" onClose={closeModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        {submitModalBody()}
                    </Transition.Child>
                    </div>
                </div>
                </Dialog>
            </Transition>

            <div className="grid grid-cols-1 gap-2">
                {currentModelInfo}
                <FormControl>
                    {/* <FormLabel id="demo-radio-buttons-group-label">Tape Submission Model</FormLabel> */}
                    <RadioGroup
                        aria-labelledby="demo-radio-buttons-group-label"
                        defaultValue={TAPE_SUBMIT_MODEL[TAPE_SUBMIT_MODEL.NOT_DEFINED]}
                        onChange={setSelectedModel}
                        name="radio-buttons-group"
                    >
                        { freeModelActive? <FormControlLabel value={TAPE_SUBMIT_MODEL[TAPE_SUBMIT_MODEL.FREE]} control={<Radio />} label="Free" 
                            title="Users can submit tapes for free"  /> : <></>}
                        { ownershipModelActive? <FormControlLabel value={TAPE_SUBMIT_MODEL[TAPE_SUBMIT_MODEL.OWNERSHIP]} control={<Radio />} label="Cartridge Ownership" 
                            title="Users must own cartridge asset to submit tapes" /> : <></>}
                        { feeModelActive? <FormControlLabel value={TAPE_SUBMIT_MODEL[TAPE_SUBMIT_MODEL.FEE]} control={<Radio />} label="Submission Fee" 
                            title="Users must pay a fee each time to submit tapes" /> : <></>}
                    </RadioGroup>
                </FormControl>
                {setupSubmissionOptions(selectedTapeSubmitModel)}
            </div>

            <div className="flex pb-2 mt-4">
                        <button
                        className={`dialog-btn zoom-btn bg-red-400 text-black`}
                        type="button"
                        onClick={cancelFn}
                        >
                            Cancel
                        </button>
                        <button
                        title={"Set Tape Submission Model"} 
                        disabled={!selectedTapeSubmitModel || !tapeSubmissionModelConfig}
                        className={`dialog-btn zoom-btn bg-emerald-400 text-black`}
                        type="button"
                        onClick={setupSubmissionModel}
                        >
                            Ok
                        </button>
                    </div>
        </>
    )
}

export default CartridgeModelSetup
import { str, envsafe, url } from 'envsafe';


export const envClient = envsafe({
  DAPP_ADDR: str({
    input: process.env.NEXT_PUBLIC_DAPP_ADDR,
    desc: "Cartesi DApp ETH address."
  }),
  CARTESI_NODE_URL: url({
    input: process.env.NEXT_PUBLIC_CARTESI_NODE_URL,
    desc: "Cartesi Node URL."
  }),
  NETWORK_CHAIN_ID: str({
    input: process.env.NEXT_PUBLIC_NETWORK_CHAIN_ID,
    desc: "Network ChainId (in hex) where the Cartesi DApp was deployed."
  }),
  GIF_SERVER_URL: url({
    input: process.env.NEXT_PUBLIC_GIF_SERVER_URL,
    desc: "GIF Server URL."
  }),
  TAPE_CONTRACT_ADDR: str({
    input: process.env.NEXT_PUBLIC_TAPE_CONTRACT,
    desc: "Tape asset ETH address."
  }),
  CARTRIDGE_CONTRACT_ADDR: str({
    input: process.env.NEXT_PUBLIC_CARTRIDGE_CONTRACT,
    desc: "Cartridge asset ETH address."
  }),
  OPERATOR_ADDR: str({
    input: process.env.NEXT_PUBLIC_OPERATOR_ADDR,
    desc: "Operator ETH address."
  }),
  ASSETS_BLOCK: str({
    input: process.env.NEXT_PUBLIC_ASSETS_BLOCK,
    desc: "(Earliest) assets deployment block number (hex)."
  }),
  DEPLOYMENT_URL: url({
    input: process.env.NEXT_PUBLIC_DEPLOYMENT_URL,
    desc: "Deployment URL for the frontend. It is used to compose the openGraph URL of images."
  }),
  WORLD_ADDRESS: str({
    input: process.env.NEXT_PUBLIC_WORLD_ADDRESS,
    desc: "Mud world ETH address."
  }),
  AGGREGATOR: url({
    input: process.env.NEXT_PUBLIC_AGGREGATOR,
    desc: "Aggregator URL."
  })
})
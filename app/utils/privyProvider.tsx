'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import {SmartWalletsProvider} from '@privy-io/react-auth/smart-wallets';

import { getChain } from './util';
import { envClient } from './clientEnv';

export default function PrivyProviders({children}: {children: React.ReactNode}) {
  const chain = getChain(envClient.NETWORK_CHAIN_ID);

  return (
    <PrivyProvider
      appId={envClient.PRIVY_APP_ID}
      config={{
        // Customize Privy's appearance in your app
        appearance: {
          theme: 'light',
          accentColor: '#676FFF'
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: 'all-users',
        },
        defaultChain: chain,
        //loginMethods: ["wallet"],
        supportedChains: [chain]
      }}
    >
      <SmartWalletsProvider>
        {children}
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}
import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/app/components/Navbar';
import Footer from './components/Footer';
import PrivyProviders from './utils/privyProvider';
import { envClient } from './utils/clientEnv';
import { cookies } from "next/headers";
import { GoogleAnalytics } from '@next/third-parties/google'
import GAConsent from './components/GAConsent';


export const metadata: Metadata = {
  metadataBase: new URL(envClient.DEPLOYMENT_URL),
  title: {
    template: "%s | RIVES",
    default: "RIVES"
  },
  description: 'RISC-V Verifiable Entertainment System',

}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const consent = cookies().get("ga_consent");

  return (
    <html lang="en-US">
      <body>
        <PrivyProviders>
          <Navbar></Navbar>
          {children}
          <Footer></Footer>
        </PrivyProviders>

        {
          !consent?
            <GAConsent />
          :
            consent.value == "accepted"?
              <GoogleAnalytics gaId={envClient.GOOGLE_ANALYTICS_MEASUREMENT_ID} />
            :
              <></>
        }
      </body>
    </html>
  )
}

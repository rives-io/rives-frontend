import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/app/components/Navbar';
import Footer from './components/Footer';
import PrivyProviders from './utils/privyProvider';

export const metadata: Metadata = {
  title: 'RIVES',
  description: 'RiscV Verifiable Entertainment System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en-US">
      <body>
        <PrivyProviders>
          <Navbar></Navbar>
          {children}
          <Footer></Footer>
        </PrivyProviders>
      </body>
    </html>
  )
}

import { Metadata } from "next";
import CartridgesList from "../components/CartridgesList";


export const metadata: Metadata = {
  title: 'Cartridges',
  description: 'Cartridges',
}

export default async function Cartridges() {
    return (
      <main className="w-full flex justify-center">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
				<CartridgesList />
			</div>
      </main>
    )
  }

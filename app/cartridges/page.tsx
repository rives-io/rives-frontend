import { Metadata } from "next";
import CartridgesList from "../components/CartridgesList";


export const metadata: Metadata = {
  title: 'Cartridges',
  description: 'Cartridges',
}

export default async function Cartridges() {
    return (
      <main>
        <section className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <CartridgesList />
          </div>
        </section>
      </main>
    )
  }

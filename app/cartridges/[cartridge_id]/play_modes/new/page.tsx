import RulesEditor from "@/app/components/RulesEditor";

export default async function NewRule({ params }: { params: { cartridge_id: string } }) {
    return (
        <main>
            <RulesEditor cartridge_id={params.cartridge_id} ></RulesEditor>
        </main>
    )
}

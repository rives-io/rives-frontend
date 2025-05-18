import RulesEditor from "@/app/components/RulesEditor";

export default async function EditRule({ params }: { params: { cartridge_id: string, rule_id: string } }) {
    return (
        <main>
            <RulesEditor cartridge_id={params.cartridge_id} rule_id={params.rule_id}></RulesEditor>
        </main>
    )
}

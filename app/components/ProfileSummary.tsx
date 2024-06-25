

export default function ProfileSummary() {

    // fetch info to build profile summary

    return (
        <div id="profile_portfolio">
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-4 bg-rives-gray flex flex-col">
                    <span>Portfolio Value</span>
                    <span>250 USD</span>
                </div>

                <div className="p-4 bg-rives-gray flex flex-col">
                    <span>Cartridges Created</span>
                    <span>2</span>
                </div>

                <div className="p-4 bg-rives-gray flex flex-col">
                    <span>Tapes Created</span>
                    <span>2</span>
                </div>

                <div className="p-4 bg-rives-gray flex flex-col">
                    <span>Cartridges Collected</span>
                    <span>2</span>
                </div>

                <div className="p-4 bg-rives-gray flex flex-col ">
                    <span>Tapes Collected</span>
                    <span>2</span>
                </div>

                <div className="p-4 bg-rives-gray flex flex-col ">
                    <span>Rives Points</span>
                    <span>1234</span>
                </div>
            </div>
        </div>
    );
}
"use client"

import AddIcon from '@mui/icons-material/Add';

export default function NewContestCard({cartridgeId}:{cartridgeId:string}) {
    
    return (
        <div className="relative w-[352px] h-60" title='Create Play Mode'>
            <div
            onClick={() => window.open(`/cartridges/${cartridgeId}/play_modes/new`, "_self")}
            className={`h-full bg-black p-4 flex flex-col gap-2 text-start border border-transparent hover:border-white hover:cursor-pointer flex items-center justify-center`}>
                <AddIcon className='text-5xl' />
        </div></div>
    );
}
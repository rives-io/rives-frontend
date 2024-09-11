"use client"

import WarningIcon from '@mui/icons-material/Warning';
import { usePrivy } from '@privy-io/react-auth';

function OlumpicsPageMsg() {
    const {ready, authenticated, user, linkTwitter} = usePrivy();

    if (!ready) {
        return <></>;
    }

    if (!user || (authenticated && user?.twitter)) {
        return <></>;
    }
    
    return (
        <div className='flex gap-2 justify-center text-center'>
            <WarningIcon className='text-yellow-500' />
            <div>
                <button onClick={linkTwitter} className='text-rives-purple hover:underline'>Link your twitter</button> to be eligible for prizes.
            </div>
            <WarningIcon className='text-yellow-500' />
        </div>
    )
}

export default OlumpicsPageMsg
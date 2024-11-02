"use client"

import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function TapeTitle({tapeName,tapeId}:{tapeId:string,tapeName:string|null}) {
    
    return (
        <h1 className={`pixelated-font text-2xl md:text-5xl truncate cursor-pointer active:bg-violet-700`} title={tapeId}
            onClick={() => navigator.clipboard.writeText(tapeId)} >
        {
            tapeName?
                tapeName
            :
                `${tapeId.substring(0, 8)}...${tapeId.substring(48, 64)}`
        }
        &ensp;<ContentCopyIcon />
    </h1>
    )
}
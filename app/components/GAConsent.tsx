"use client"


import React from 'react'
import { setCookie } from '../utils/cookie';

function GAConsent() {
    const message = "We use cookies to provide you with the best possible experience. They also allow us to analyze user behavior in order to constantly improve the website for you."
    console.log("GAConsent loaded");

    function accept() {
        setCookie("ga_consent", "accepted");
    }

    function refuse() {
        setCookie("ga_consent", "denied");
    }

    return (
        <div className='w-full h-fit p-2 fixed bottom-0 bg-gray-500 grid gap-4'>
            <div className='text-center'>
                {message}
            </div>

            <div className='flex justify-center gap-2'>
                <button className='bg-red-400 p-2 hover:bg-red-600' onClick={refuse}>
                    Refuse
                </button>
    
                <button className='bg-green-400 p-2 hover:bg-green-600' onClick={accept}>
                    Accept
                </button>
            </div>
        </div>
    )
}

export default GAConsent
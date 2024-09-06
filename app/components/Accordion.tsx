"use client"


import { Disclosure } from '@headlessui/react'
import ExpandLessIcon from '@mui/icons-material/ExpandLess';


function Accordion({items}:{items:Array<{title:string, content:string}>}) {
  return (
        <div className="mx-auto w-full bg-black text-black p-2">
            {
                items.map((item, index) => {
                    return (
                        <Disclosure key={index} as="div" className={`${index != items.length-1? "mb-2":""}`}>
                            {({ open }) => (
                            <>
                                <Disclosure.Button 
                                className="flex w-full justify-between bg-white px-4 py-2 text-left font-medium hover:text-rives-purple hover:bg-gray-200">
                                    <span className='pixelated-font'>{item.title}</span>
                                    <ExpandLessIcon
                                        className={`${open ? 'rotate-180 transform':''} h-5 w-5`}
                                    />
                                </Disclosure.Button>

                                <Disclosure.Panel className="p-2 text-white">
                                    <pre style={{whiteSpace: "pre-wrap", fontFamily: 'Iosevka Web'}}>
                                        {item.content}
                                    </pre>
                                </Disclosure.Panel>
                            </>
                            )}
                        </Disclosure>          
                    )
                })
            }
        </div>
  )
}

export default Accordion
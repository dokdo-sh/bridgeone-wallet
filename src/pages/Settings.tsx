
import React, { useState } from 'react';
import { BiNetworkChart } from 'react-icons/bi';
import { BsFillLockFill, BsGearFill, BsInfoCircle } from 'react-icons/bs';
import { About } from '../components/settings/About';
import { General } from '../components/settings/General';
import { Networks } from '../components/settings/Networks';
import { SecurityAndPrivacy } from '../components/settings/SecurityAndPrivacy';

export function Settings(props: {goTo: (page:string) => void}) {
    const [page, setPage] = useState("home");
    return (
        <div>
            {page == "home" && <>
            <div className="font-black text-3xl px-5 py-8 border-b border-dark-tertiary">Settings</div>
            <div className='divide-y divide-dark-tertiary'>
            {/* <div className='py-3 text-xl px-5 hover:bg-dark-hoverish select-none cursor-pointer flex items-center' onClick={() => setPage("general")}>
                <BsGearFill className='inline-flex mr-2 p-1 text-3xl'/>General
            </div> */}
            {/* <div className='py-3  text-xl px-5 hover:bg-dark-hoverish select-none cursor-pointer flex items-center' onClick={() => setPage("security")}>
                <BsFillLockFill className='inline-flex mr-2 p-1 text-3xl'/>Security and privacy
            </div> */}
            
            <div className='py-3  text-xl px-5 hover:bg-dark-hoverish select-none cursor-pointer flex items-center' onClick={() => setPage("networks")}>
                <BiNetworkChart className='inline-flex mr-2 p-1 text-3xl'/>Networks
            </div>
            <div className='py-3  text-xl px-5 hover:bg-dark-hoverish select-none cursor-pointer flex items-center' onClick={() => setPage("about")}>
                <BsInfoCircle className='inline-flex mr-2 p-1 text-3xl'/>About
            </div>
            </div>
            </>}
            {page == "general" && <General goBack={() => {setPage("home")}}/>}
            {page == "security" && <SecurityAndPrivacy goBack={() => {setPage("home")}}/>}
            {page == "networks" && <Networks goBack={() => {setPage("home")}}/>}
            {page == "about" && <About goBack={() => {setPage("home")}}/>}
        </div>
    )
}
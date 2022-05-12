import React from 'react';
import {BsArrowUpRight, BsArrowDown} from 'react-icons/bs';
import {MdHowToVote} from 'react-icons/md';
declare var browser:any;
export function Wallet(props: {goTo: (page:string) => void}) {
    return ( <div className="Wallet">
        <div className="flex border-b border-gray-200 h-16">
          <div className="text-xs border border-gray-200 w-fit h-fit m-3 font-light rounded p-1 cursor-pointer hover:bg-secondary">Not connected</div>
          <div className="text-center rounded hover:bg-secondary my-1 p-1 text-sm font-light cursor-pointer" onClick={() => browser.storage.local.remove("login")}>
            <span>Account 1</span>
            <br />
            <span>{/* {browser.storage.local.get("welcome").then((welcome:string) => (welcome))} */}</span>
          </div>
          <div className="grow"></div>
          <div onClick={() => props.goTo("settings")}>...</div>
        </div>
        <div>
          <div className="mt-4">
            <div className="mx-auto w-fit rounded-full border border-gray-200">
              <img src="/isotype_circle.png" className="h-12"alt="" />
            </div>
            <div className="mx-auto w-fit font-semibold text-2xl mt-3">
              10.003 SXP
            </div>
            <div className="mx-auto w-fit flex space-x-6 py-3">
              <div className="cursor-pointer">
                <div className="rounded-full bg-greenish hover:bg-dark-greenish p-2 text-white text-lg ease-in duration-100" /* onClick={() => {browser.storage.local.set({welcome: "welcome"})}} */>
                  <BsArrowDown/>
                </div>
                <div className="text-greenish">Buy</div>
              </div>
              <div className="cursor-pointer">
                <div className="rounded-full bg-greenish hover:bg-dark-greenish p-2 text-white text-lg ease-in duration-100">
                <BsArrowUpRight/>
                </div>
                <div className="text-greenish">Send</div>
              </div>
              <div className="cursor-pointer">
                <div className="rounded-full bg-greenish hover:bg-dark-greenish p-2 text-white text-lg ease-in duration-100">
                <MdHowToVote/>
                </div>
                <div className="text-greenish">Vote</div>
              </div>
            </div>
            <div>
              <div className="mt-1 drop-shadow-lg">
                <div className="py-3 cursor-pointer border-greenish ease-in duration-100">Transactions</div>
              </div>
              <div className="h-48"></div>
            </div>
          </div>
        </div>
  </div>);
}
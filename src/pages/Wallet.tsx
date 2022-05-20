import { useEffect, useState } from "react";
import { BiImport, BiWallet } from "react-icons/bi";
import {MdHowToVote} from 'react-icons/md'
import {FiSend} from 'react-icons/fi';
import {
  BsFillGridFill,
  BsFillLockFill,
  BsFillPeopleFill,
  BsGearFill,
} from "react-icons/bs";
import Armor from "../Armor";
import { WalletModal } from "../components/wallet/WalletModal";
import { WalletTransactions } from "../components/wallet/WalletTransactions";
import { Home } from "../components/wallet/Home";
import { Contacts } from "./Contacts";
import { Settings } from "./Settings";
export const Wallet = (props: { goTo: (page: string) => void }) => {
  const [mode, setMode] = useState("home")
  return (
    <>
    <div className="pt-1  sm:flex-col-reverse sm:border sm:border-dark-secondary sm:rounded-lg sm:w-2/3 sm:mx-auto sm:m-16">
      <div className="min-h-screen">
      {mode == "home" && <Home goTo={props.goTo}/>}
      {mode == "contacts" && <Contacts goTo={props.goTo}/>}
      {mode == "settings" && <Settings goTo={props.goTo}/>}
      </div>
      </div>
      <div className="bg-dark-tertiary sticky bottom-0 w-screen">
        <div className="mx-auto flex w-fit h-16 ">
          <div className="px-5 grid place-items-center">
            <img src="/isotype_circle.png" alt="logo" className="w-8 m-auto" />
          </div>
          <div className={`hover:bg-dark-secondary text-center w-20 px-3 py-2 select-none cursor-pointer ${mode == 'home'? 'bg-dark-secondary' : ''}`}  onClick={() => setMode('home')}>
            <BiWallet className="text-2xl mx-auto" />
            <div className="text-sm mt-1">Wallet</div>
          </div>
          <div className={`hover:bg-dark-secondary text-center w-20 px-3 py-2 select-none cursor-pointer ${mode == 'contacts'? 'bg-dark-secondary' : ''}`}  onClick={() => setMode('contacts')}>
            <BsFillPeopleFill className="text-2xl mx-auto" />
            <div className="text-sm mt-1">Contacts</div>
          </div>
          <div className={`hover:bg-dark-secondary text-center w-20 px-3 py-2 select-none cursor-pointer ${mode == 'settings'? 'bg-dark-secondary' : ''}`} onClick={() => setMode('settings')}>
            <BsGearFill className="text-2xl mx-auto" />
            <div className="text-sm mt-1">Settings</div>
          </div>
        </div>
      </div>
      </>
  );
};

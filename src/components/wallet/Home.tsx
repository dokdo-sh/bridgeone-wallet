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
import Armor from "../../Armor";
import { WalletTransactions } from "./WalletTransactions";
import { WalletSelect } from "./WalletSelect";
import { Modal } from "../ui/Modal";
import { Vote } from "./Vote";
import { Deposit } from "./Deposit";
import { Send } from "./Send";
import solar from "../../wallets/solar";
import browser from 'webextension-polyfill'
function useForceUpdate(){
  const [value, setValue] = useState(0);
  return () => setValue(value => value + 1);
}
export const Home = (props: { goTo: (page: string) => void }) => {
    const [currentWallet, setCurrentWallet] = useState(undefined);
    const [balance, setBalance] = useState(0);
    
    const [showWallets, setShowWallets] = useState(false);
    const [showVote, setShowVote] = useState(false);
    const [showDeposit, setShowDeposit] = useState(false);
    const [showSend, setShowSend] = useState(false);

    useEffect(() => {
        
      loadWallet()

    },[])

    function loadWallet() {

      Armor.currentWallet().then((cw:solar) => {
        setCurrentWallet(cw);
        getBalance(cw);
        setInterval(getBalance, 600000);
      })
    }

    function getBalance(wallet:solar = currentWallet) {
      wallet.getBalance().then((bal:number) => {
            setBalance(bal/100000000);
        });
    }
    if (currentWallet) {return (
        <>
        <div className="flex border-b border-dark-secondary pb-2">
          <div className="w-fit px-6 py-3">
            <BsFillGridFill className="hover:text-greenish cursor-pointer text-sm" onClick={() => {setShowWallets(true)}}/>
          </div>
          <div className="grow sm:mx-auto sm:grow-0 w-fit rounded-lg   text-center select-none   cursor-pointer text-xs rounded-full hover:bg-dark-hoverish px-2 py-1" onClick={() => navigator.clipboard.writeText(currentWallet.address)}>
            <div>{currentWallet.name}</div>
            <div className="font-mono text-greenish">
              {currentWallet.address}
            </div>
          </div> 
          <div className="w-fit px-4 py-3">
            {/* <BsFillLockFill className="hover:text-greenish cursor-pointer text-sm" title="Lock" onClick={() => {Armor.logout();props.goTo("login");}}/> */}
          </div>
        </div>
        <div className="bg-greenish text-white text-sm py-1 px-4">
          <div className="rounded-full border border-white py-1 px-2 cursor-pointer ease-in duration-200 hover:border-dark-greenish hover:bg-dark-greenish w-fit" onClick={() => browser.tabs.create({url: `${currentWallet.network.explorer_url}/wallets/${currentWallet.address}`})}>View on Explorer</div>
        </div>
      <div className="py-6 text-center">
        <div>
          <img
            src={`/blockchains/${currentWallet.network.logo}`}
            alt="logo"
            className="w-16 mx-auto py-3"
          />
        </div>
        <div className="text-3xl font-black">{balance} {currentWallet.network.ticker}</div>
      </div>
      <div className="w-fit mx-auto flex gap-2 py-3">
        <div className="rounded-full border border-dark-secondary px-3 py-1 hover:bg-greenish select-none cursor-pointer" onClick={() => setShowDeposit(true)}>
          {" "}
          <BiImport className="inline-block pb-1 text-xl"/> Deposit
        </div>
        <div className="rounded-full border border-dark-secondary px-3 py-1 hover:bg-greenish select-none cursor-pointer" onClick={() => setShowSend(true)}>
          {" "}
          <FiSend className="inline-block pb-1 text-xl" /> Send
        </div>
        <div className="rounded-full border border-dark-secondary px-3 py-1 hover:bg-greenish select-none cursor-pointer" onClick={() => setShowVote(true)}>
          {" "}
          <MdHowToVote className="inline-block pb-1 text-xl" /> Vote
        </div>
      </div>
      <div className="w-full mx-auto border-b border-dark-secondary">
        <div className="py-2 px-4 border-b-2 border-greenish w-fit select-none cursor-pointer hover:border-dark-greenish hover:text-gray-200 font-black">
          Transactions
        </div>
      </div>
        <div className=""><WalletTransactions currentWallet={currentWallet}/></div>
        
        <Modal setShow={setShowWallets} show={showWallets} title="Select a wallet">
            <WalletSelect goTo={props.goTo} reload={loadWallet} setShow={setShowWallets}/>
        </Modal>
        <Modal setShow={setShowVote} show={showVote} title="Vote for a delegate">
            <Vote currentWallet={currentWallet} setShow={setShowVote} show={showVote} />
        </Modal>
        <Modal setShow={setShowSend} show={showSend} title="Send a transaction">
            <Send currentWallet={currentWallet} setShow={setShowSend} show={showSend}/>
        </Modal>
        <Modal setShow={setShowDeposit} show={showDeposit} title="Deposit SXP">
            <Deposit currentWallet={currentWallet}/>
        </Modal>
        </>
    )} else {
      return <div></div>
    }
}

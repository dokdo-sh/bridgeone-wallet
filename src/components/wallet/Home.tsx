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
import { WalletModal } from "./WalletModal";
import { Modal } from "../ui/Modal";
import { Vote } from "./Vote";
import { Deposit } from "./Deposit";
import { Send } from "./Send";


export const Home = (props: { goTo: (page: string) => void }) => {
    const currentWallet = Armor.currentWallet();
    const [balance, setBalance] = useState(0);
    
    const [showWallets, setShowWallets] = useState(false);
    const [showVote, setShowVote] = useState(false);
    const [showDeposit, setShowDeposit] = useState(false);
    const [showSend, setShowSend] = useState(false);

    useEffect(() => {
        getBalance();
        setInterval(getBalance, 600000);
    })

    function getBalance() {
        currentWallet.getBalance().then((bal:number) => {
            setBalance(bal/100000000);
        });
    }
    return (
        <>
        <div className="flex border-b border-dark-secondary pb-2">
          <div className="w-fit px-6 py-3">
            <BsFillGridFill className="hover:text-greenish cursor-pointer text-sm" onClick={() => {setShowWallets(true)}}/>
          </div>
          <div className="grow sm:mx-auto sm:grow-0 w-fit rounded-lg   text-center select-none   cursor-pointer text-xs rounded-full hover:bg-dark-hoverish px-2 py-1">
            <div>{currentWallet.name}</div>
            <div className="font-mono text-greenish">
              {currentWallet.address}
            </div>
          </div>
          <div className="w-fit px-4 py-3">
            <BsFillLockFill className="hover:text-greenish cursor-pointer text-sm" title="Lock" onClick={() => {props.goTo("login")}}/>
          </div>
        </div>
      <div className="py-6 text-center">
        <div>
          <img
            src="/blockchains/solar.png"
            alt="logo"
            className="w-16 mx-auto py-3"
          />
        </div>
        <div className="text-3xl font-black">{balance} SXP</div>
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
        <div className=""><WalletTransactions/></div>
        <WalletModal setShow={setShowWallets} show={showWallets}/>
        <Modal setShow={setShowVote} show={showVote} title="Vote for a delegate">
            <Vote/>
        </Modal>
        <Modal setShow={setShowSend} show={showSend} title="Send a transaction">
            <Send/>
        </Modal>
        <Modal setShow={setShowDeposit} show={showDeposit} title="Deposit SXP">
            <Deposit/>
        </Modal>
        </>
    );
}

import moment from "moment";
import { useEffect, useState } from "react";
import { BsClock, BsClockFill, BsReceipt } from "react-icons/bs";
import Armor from "../../Armor";
import solar from "../../wallets/solar";
import { Modal } from "../ui/Modal";
import { Transaction } from "./Transaction";

export const WalletTransactions = (props:{currentWallet: solar}) => {
  const [currentWallet, setCurrentWallet] = useState(undefined)

  useEffect(() => {
    setCurrentWallet(props.currentWallet)
    props.currentWallet.getLatestTransactions()
    .then((transactions: any) => {
      setTransactions(transactions);
    })
    .catch(() => {});
     
  },[props.currentWallet]);
  const [transactions, setTransactions] = useState(undefined);
  const [showTransaction, setShowTransaction] = useState(false);
  const [modalTx, setModalTx] = useState("");

  if (transactions == undefined) {
    return <div className="min-h-full">Loading</div>;
  } else {
    return (
      <div className="sm:h-1/2 overflow-y-auto h-[200px]">
        {transactions.map((transaction: any) => (
          <div className="py-3 px-2 items-center hover:bg-dark-hoverish cursor-pointer select-none" onClick={() => {setModalTx(transaction.id);setShowTransaction(true)}}>
            <div className="flex align-middle items-center">
              <BsReceipt className="inline-flex text-greenish hover:text-dark-greenish cursor-pointer mr-3" />
              <div>
                  {transaction.type == 3 && transaction.typeGroup == 1 &&
                    <div>
                      <div>Switched vote</div>
                      <div className="text-gray-400 text-xs"><BsClock className="inline-block"/> {moment(transaction.timestamp.human).fromNow()}</div>
                    </div>
                  }
                  {transaction.type == 6 && transaction.typeGroup == 1 &&
                    <div>
                      {transaction.sender == currentWallet.address && 
                        <div>
                          <div>Sent {transaction.asset.transfers.map((payment:any) => {return payment.amount as number}).reduce((a:number,b:number)=>{return (+a)+(+b)})/100000000} SXP</div>
                        <div>to {transaction.asset.transfers.length} recipients</div>
                        </div>
                      }
                      {transaction.sender != currentWallet.address && 
                        <div>Received {transaction.asset.transfers.map((payment:any) => {if (payment.recipientId == currentWallet.address) {return payment.amount as number} else {return 0}}).reduce((a:number,b:number)=>{return (+a)+(+b)})/100000000} SXP</div>
                      }
                      <div className="text-gray-400 text-xs"><BsClock className="inline-block"/> {moment(transaction.timestamp.human).fromNow()}</div>                      
                    </div>
                  }
                  {transaction.type == 0 && transaction.typeGroup == 1 &&
                    <div>
                      <div>{transaction.sender == currentWallet.address? "Sent" : "Received"} {transaction.amount/100000000} SXP</div>
                    <div className="text-gray-400 text-xs"><BsClock className="inline-block"/> {moment(transaction.timestamp.human).fromNow()}</div>
                    </div>
                  }
              </div>
              </div>
              
          </div>
        ))}
        <Modal title="Transaction" show={showTransaction} setShow={setShowTransaction}>
            <Transaction txId={modalTx}/>
        </Modal>
      </div>
    );
  }
};

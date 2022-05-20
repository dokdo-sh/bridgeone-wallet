import moment from "moment";
import { useEffect, useState } from "react";
import { BsClock, BsClockFill, BsReceipt } from "react-icons/bs";
import Armor from "../../Armor";
import solar from "../../wallets/solar";
import { Modal } from "../ui/Modal";

export const WalletTransactions = () => {
  const currentWallet: solar = Armor.currentWallet();
  const [transactions, setTransactions] = useState(undefined);
  const [showTransaction, setShowTransaction] = useState(false);
  const [modalTx, setModalTx] = useState("");
  useEffect(() => {
    currentWallet
      .getLatestTransactions()
      .then((transactions: any) => {
        setTransactions(transactions);
      })
      .catch(() => {});
  },[]);

  if (transactions == undefined) {
    return <div className="min-h-full">Loading</div>;
  } else {
    return (
      <div className="sm:h-1/2 overflow-y-auto">
        {transactions.map((transaction: any) => (
          <div className="py-3 px-2 items-center hover:bg-dark-hoverish cursor-pointer select-none" onClick={() => {setModalTx(transaction.id);setShowTransaction(true)}}>
            <div className="flex align-middle items-center">
              <BsReceipt className="inline-flex text-greenish hover:text-dark-greenish cursor-pointer mr-3" />
              <div>
                <div className="">Sent {transaction.asset == undefined && transaction.amount / 100000000} {transaction.asset != undefined && transaction.asset.payments != undefined && transaction.asset.payments.map((payment:any) => {return payment.amount as number}).reduce((a:number,b:number)=>{return (+a)+(+b)})/100000000} SXP</div>
                <div className="text-gray-400 text-xs"><BsClock className="inline-block"/> {moment(transaction.timestamp.human).fromNow()}</div>
            {transaction.asset == undefined && (
              <div className="">
                {" "}
                to{" "}
                <span className="text-greenish hover:underline">{`${transaction.recipient.substr(
                  0,
                  7
                )}...${transaction.recipient.substr(27, 7)}`}</span>
              </div>
            )}
            {transaction.asset != undefined &&
              transaction.asset.payments != undefined && (
                <div className="">
                  {" "}
                  to{" "}
                  <span className="text-greenish hover:underline">
                    {transaction.asset.payments.length} recipients
                  </span>
                </div>
              )}</div>
              </div>
              
          </div>
        ))}
        <Modal title="Transaction" show={showTransaction} setShow={setShowTransaction}>
            {modalTx}
        </Modal>
      </div>
    );
  }
};

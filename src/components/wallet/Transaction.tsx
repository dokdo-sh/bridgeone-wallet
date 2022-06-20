import { useEffect, useState } from "react";
import Armor from "../../Armor";
import solar from "../../wallets/solar";
declare var browser:any;
export const Transaction = (props: {txId:string}) => {
    const [transaction, setTransaction] = useState(undefined)

    const [currentWallet, setCurrentWallet] = useState(undefined)

    useEffect(() => {
    
      Armor.currentWallet().then((cw:solar) => {
        setCurrentWallet(cw);
      });
       
    },[]);

    useEffect(() => {
        if (currentWallet) {
            currentWallet.getTransaction(props.txId).then((tx:any) => {
                setTransaction(tx);
            })
        }
    },[props.txId])

   if (currentWallet && transaction) {return (
        <div>
                    <div className=" text-white text-sm py-1 px-4">
          <div className="rounded-full border border-dark-secondary py-1 px-2 cursor-pointer ease-in duration-200 hover:border-dark-hoverish hover:bg-dark-hoverish w-fit" onClick={() => browser.tabs.create({url: `${currentWallet.network.explorer_url}/transactions/${props.txId}`})}>View on Explorer</div>
        </div>
            <div className="py-2">
            <div className="text-gray-400 text-sm">
                Transaction id
            </div>
            <div className="text-xs break-words text-greenish py-1 px-1">{props.txId}</div>
            </div>

            <div className="py-2">
            <div className="text-gray-400 text-sm">
                Block id
            </div>
            <div className="text-xs break-words text-greenish py-1 px-1">{transaction.blockId}</div>
            </div>
            
            <div className="py-2">
            <div className="text-gray-400 text-sm">
                Transaction Type
            </div>
            <div className="text-xs break-words text-greenish py-1 px-1">{transaction.type}</div>
            </div>

            <div className="py-2">
            <div className="text-gray-400 text-sm">
                Transaction Type Group
            </div>
            <div className="text-xs break-words text-greenish py-1 px-1">{transaction.typeGroup}</div>
            </div>

            <div className="py-2">
            <div className="text-gray-400 text-sm">
                Sender
            </div>
            <div className="text-xs break-words text-greenish py-1 px-1">{transaction.sender}</div>
            </div>

            {transaction.type == 6 && transaction.typeGroup == 1 && <div className="py-2">
            <div className="text-gray-400 text-sm">
                Recipients
                <div className="m-1 p-2 bg-dark-tertiary text-xs">
                {transaction.asset.payments.map((payment:any) => (
                    <div>
                        <div className="text-greenish">{payment.recipientId}</div>
                        <div className="pl-5">{payment.amount/100000000} SXP</div>
                    </div>
                ))} SXP
                </div>
            </div>
            <div className="text-xs break-words text-greenish py-1 px-1">{transaction.recipient}</div>
            </div>}
            {transaction.type == 0 && transaction.typeGroup == 1 && <div className="py-2">
            <div className="text-gray-400 text-sm">
                Recipient
            </div>
            <div className="text-xs break-words text-greenish py-1 px-1">{transaction.recipient}</div>
            </div>}
            
            <div className="py-2">
            <div className="text-gray-400 text-sm">
                Amount
            </div>
            <span className="break-words py-1 px-1">{transaction.amount/100000000} {currentWallet.network.ticker}</span>
            </div>

            <div className="py-2">
            <div className="text-gray-400 text-sm">
                Nonce
            </div>
            <div className="text-xs break-words text-greenish py-1 px-1">{transaction.nonce}</div>
            </div>

            <div className="py-2">
            <div className="text-gray-400 text-sm">
                Confirmations
            </div>
            <div className="text-xs break-words text-greenish py-1 px-1">{transaction.confirmations}</div>
            </div>
            
            {transaction.vendorField && <div className="py-2">
            <div className="text-gray-400 text-sm">
                Vendorfield
            </div>
            <div className="py-2 px-2 my-1 rounded bg-dark-secondary">{transaction.vendorField}</div>
            </div>}
        </div>
    )}  else { 
        return (
            <div></div>
        )
    }
}
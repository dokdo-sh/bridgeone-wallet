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
                <div className="m-1 p-2 bg-dark-tertiary text-xs rounded">
                {transaction.asset.transfers.map((payment:any) => (
                    <div>
                        <div className="text-greenish">{payment.recipientId}</div>
                        <div className="pl-5">{payment.amount/100000000} SXP</div>
                    </div>
                ))}
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
            {console.log(transaction.asset.votes)}
            {transaction.type == 2 && transaction.typeGroup == 2 && Object.keys(transaction.asset.votes).length == 0 &&
            <div className="py-2">
            <div className="text-gray-400 text-sm">
                Voted for
            </div>
            <span className="break-words py-1 px-1">Cancelled vote</span>
            </div>
            }
                        {transaction.type == 2 && transaction.typeGroup == 2 && Object.keys(transaction.asset.votes).length > 0 &&
            <div className="py-2">
            <div className="text-gray-400 text-sm">
                Voted for
            </div>
            <div className="m-1 p-2 bg-dark-tertiary text-xs rounded">
                {Object.keys(transaction.asset.votes).map((vv) => (
                    <div className="flex flex-row">
                    <div className="text-greenish px-3">{vv}</div>
                    <div className="pl-5">{transaction.asset.votes[vv]}%</div>
                </div>
                ))}
            </div>
            </div>
            }
 {(transaction.type != 2 && transaction.typeGroup != 2) &&
            <div className="py-2">
            <div className="text-gray-400 text-sm">
                Amount
            </div>
            <span className="break-words py-1 px-1">{transaction.amount/100000000} {currentWallet.network.ticker}</span>
            </div>}

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
            
            {transaction.memo && <div className="py-2">
            <div className="text-gray-400 text-sm">
                Memo
            </div>
            <div className="py-2 px-2 my-1 rounded bg-dark-secondary">{transaction.memo}</div>
            </div>}
        </div>
    )}  else { 
        return (
            <div></div>
        )
    }
}

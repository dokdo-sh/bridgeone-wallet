import { useEffect, useState } from "react";
import { BiCopy } from "react-icons/bi";
import QRCode from "react-qr-code";
import Armor from "../../Armor";
import solar from "../../wallets/solar";

export const Deposit = (props:{currentWallet: solar}) => {
    const [currentWallet, setCurrentWallet] = useState(undefined)

    useEffect(() => {
      setCurrentWallet(props.currentWallet);
    }, [props.currentWallet])

    if (currentWallet) {
      return (
        <div>
          <div className="py-4 px-10">
              You can scan the QR code or click on the address below to copy it.
          </div>
            <div className="w-fit mx-auto p-6 bg-white my-6"><QRCode value={currentWallet.address} size={150}/></div>
            
            <div className="grow w-fit rounded-lg   text-center select-none   cursor-pointer text-sm rounded-full hover:bg-dark-hoverish px-2 py-1 mx-auto">
            <div className="font-mono text-greenish">
            <BiCopy className="text-gray-300 inline-block"/>  {currentWallet.address}
            </div>
          </div>
          <div className="py-4 px-10"> Be aware that transactions can take up to some minutes to get confirmed.</div>
        </div>
    );
    } else {
      return <div></div>
    }
}

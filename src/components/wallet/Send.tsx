import { useEffect, useState } from "react";
import { FiSend } from "react-icons/fi";
import Armor from "../../Armor";
import solar from "../../wallets/solar";
import { Button } from "../ui/Button";
import { Recipients } from "./Recipients";

export const Send = (props:{currentWallet: solar, show: boolean, setShow: (b:boolean) => void}) => {
  const [currentWallet, setCurrentWallet] = useState(undefined)

  useEffect(() => {
  
    setCurrentWallet(props.currentWallet);
     
  },[props.currentWallet]);

  const [vendorfield, setVendorfield] = useState("");
  const [fee, setFee] = useState("0.03")
  const [recipients, setRecipients] = useState([])
  const [sendEnabled, setSendEnabled] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(true);
  const [password, setPassword] = useState("");


  function login() {
    Armor.validPassword(password).then((value:boolean) => {
      if (value == true) {
        setWrongPassword(false);
      } else {
        setWrongPassword(true);
      }
    })
  }

  useEffect(() => {
    login()
  }, [password])

  useEffect(() => {
    validateSend(fee,recipients)
  }, [wrongPassword])

  function getData() {
    (currentWallet as solar).sendTransaction({recipients:recipients,fee:fee,vendorField:vendorfield},password)
    props.setShow(false);
  }

  function onRecipientsChange(recipients:any[]) {
    setRecipients(recipients);
    validateSend(fee, recipients);
  }

  function validateSend(fees:string, recipients: any[]) {
    if (Number(fees) > 0 && recipients.length > 0 && wrongPassword == false) {setSendEnabled(true)} else {setSendEnabled(false)}
  }

  if (currentWallet && props.show) { return (
    <div>
      <div>
      <div className="py-1">
        <div className="text-gray-300 text-sm">Sender</div>
        <div className="font-mono text-greenish py-2">
          {currentWallet.address}
        </div>
      </div>

    <Recipients onChange={onRecipientsChange}/>

      <div className="py-3">
        <div className="text-gray-300 text-sm">Memo (optional)</div>
        <textarea className="w-full p-3 mt-2 h-24 bg-dark-secondary rounded-lg outline-greenish" value={vendorfield} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {setVendorfield(e.currentTarget.value)}} maxLength={255} />
        <div className="text-gray-400 text-xs text-right">
          {vendorfield.length}/255 characters
        </div>
      </div>
      <div className="py-3">
        <div className="text-gray-300 text-sm">Fee</div>
        <div><input type="text" className="bg-dark-secondary dark:bg-dark-tertiary rounded dark:text-white dark:border-0 px-3 py-2 w-36 mt-1 text-white text-center text-sm" value={fee.toString()} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFee(e.currentTarget.value);validateSend(e.currentTarget.value, recipients)
            }}/> {currentWallet.network.ticker}</div>
            <div className="text-sm text-gray-400">Transaction may fail with a low fee</div>
      </div>
      <div className="w-full py-3">
            Password
            <br />
            <input
        type="password"
        maxLength={64}
        className="rounded w-full bg-dark-secondary dark:bg-dark-secondary dark:text-white dark:border-0 px-3 py-2  mt-1 text-white"
        value={password}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {setPassword(event.currentTarget.value);}}
      />
            </div>
            {wrongPassword && <div className="w-fit pb-4 pt-1 mx-auto text-center text-red-400">Wrong password</div>}
      <div className="py-3 px-16">
        <Button className="" onClick={getData} disabled={!sendEnabled} > <div className="flex items-center space-x-3 mx-auto w-fit"> <FiSend/> <span>Send</span></div> </Button>
      </div>
      </div>
    </div>
  );} else {
    return <div></div>
  }
};

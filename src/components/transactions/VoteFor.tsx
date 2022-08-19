import { useEffect, useState } from "react";
import Armor from "../../Armor";
import { Button } from "../ui/Button";

export const VoteFor = (props: {username : string, setShow: (b:boolean) => void}) => {
    
    const [fee, setFee] = useState("0.03")
    const [currentWallet, setCurrentWallet] = useState(undefined);
    const [sendEnabled, setSendEnabled] = useState(false);
    const [wrongPassword, setWrongPassword] = useState(true);
    const [password, setPassword] = useState("");
    const [delegateInfo, setDelegateInfo] = useState(undefined);
  
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
      validateSend(fee)
    }, [wrongPassword])

    function validateSend(fees:string) {
        if (Number(fees) > 0 && wrongPassword == false) {setSendEnabled(true)} else {setSendEnabled(false)}
      }

      function vote() {
        Armor.currentWallet().then((wallet) => {
            wallet.vote(delegateInfo.username,fee, password).then(() => {
                props.setShow(false);
            })
        })
      }

      useEffect(() => {
        Armor.currentWallet().then((wallet) => {
            setCurrentWallet(wallet);
            fetch(`${wallet.network.api_url}/delegates/${props.username}`)
                .then((response) => response.json())
                .then((response: any) => {
                  setDelegateInfo(response.data);
                });
        })
      }, [])

   if (delegateInfo && currentWallet) {return (
        <div>
        <div className="py-3 text-xl">
          Vote {props.username}
        </div>
        <div className="py-2">
          <div className="rounded-xl bg-dark-tertiary p-3 text-sm">
            <div>
              <div className="flex flex-col">
                <div className="flex">
                  <div className="grow">Address</div>
                  <div className="text-greenish text-xs">{delegateInfo.address}</div>
                </div>
                <div className="flex">
                  <div className="grow">Rank</div>
                  <div>{delegateInfo.rank}</div>
                </div>
                <div className="flex">
                  <div className="grow">Status</div>
                  <div>{delegateInfo.rank < 54? "Active" : "Standby"}</div>
                </div>
                <div className="flex">
                  <div className="grow">Votes</div>
                  <div>{delegateInfo.votesReceived.votes/100000000} {currentWallet.network.ticker}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="py-3">
        <div className="text-gray-300 text-sm">Fee</div>
        <div><input type="text" className="bg-dark-secondary dark:bg-dark-tertiary rounded dark:text-white dark:border-0 px-3 py-2 w-36 mt-1 text-white text-center text-sm" value={fee.toString()} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFee(e.currentTarget.value);validateSend(e.currentTarget.value)
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
        <div className="py-2">
        <Button className="w-fit text-center mx-auto" onClick={vote} disabled={!sendEnabled} > Vote for {props.username} </Button>
        </div>
  </div>
    ); } else {
        return ( <div></div> )
    }
}

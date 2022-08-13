import { useEffect, useState } from "react";
import solar from "../../wallets/solar";
import { Unvote } from "../transactions/Unvote";
import { VoteFor } from "../transactions/VoteFor";
import { Button } from "../ui/Button";

export const Vote = (props:{currentWallet: solar, show:boolean, setShow : (b:boolean) => void}) => {
  const [currentWallet, setCurrentWallet] = useState(undefined)


  const [delegates, setDelegates] = useState(undefined);
  const [mode, setMode] = useState("forging");
  const [currentMode, setCurrentMode] = useState("main")
  const [delegateTarget, setDelegateTarget] = useState("")

  const selectedClass =
    "bg-greenish rounded-full py-1 px-3 ease-in duration-100 select-none cursor-pointer";
  const nonSelectedClass =
    "px-3 py-1 hover:bg-greenish ease-in duration-100 rounded-full select-none cursor-pointer";

  const [currentVote, setCurrentVote] = useState(undefined);
  const [selectedDelegate, selectDelegate] = useState("")

  useEffect(() => {
    getDelegates();
  }, [mode]);

  useEffect(() => {
    getDelegates();
  }, [currentMode]);
  
  useEffect(() => {
    if (!props.show) {
      setCurrentMode("main")
    }
    getDelegates()
  }, [props.show])

  useEffect(() => {
  
    setCurrentWallet(props.currentWallet)
     
  },[props.currentWallet]);


  useEffect(() => {
  
    getDelegates();
     
  },[currentWallet]);

  function toggleDelegate(del:string) {
    if (selectedDelegate == del) {
      selectDelegate("")
    } else {
      selectDelegate(del)
    }
  }

  function getDelegates() {
    if (currentWallet) {
      fetch(
        `${currentWallet.network.api_url}/delegates${
          mode == "forging" ? "?limit=53" : "?limit=53&isResigned=false&page=2"
        }`
      )
        .then((response) => response.json())
        .then((response: any) => {
          setDelegates(response.data);
        });
        currentWallet.getVote().then((vote:string | undefined) => {
          if (vote) {
            fetch(
              `${currentWallet.network.api_url}/delegates/${vote}`
            )
              .then((response) => response.json())
              .then((response: any) => {
                setCurrentVote(response.data);
              });
          }
        })
    }
  }

  if (currentWallet && props.show) { return (
    <>
     {currentMode == "main" && <div>
        {currentVote && <div>
            <div className="px-2">Your current vote:</div>
        <div className="py-2 px-4 my-2 rounded-lg bg-dark-primary  flex items-center border border-dark-tertiary">
          <div className="grow flex items-center">
            <div
              className={`rounded-full w-2 inline-flex h-2 ${
                currentVote.rank <= 53 ? "bg-green-500" : "bg-yellow-500"
              } h-fit`}
            ></div>
            <span className="text-gray-400 px-2 text-sm">
              #{currentVote.rank}
            </span>{" "}
            <span className="font-black grow">{currentVote.username} </span>
          </div>
          <div className={`px-6 py-2 rounded-full hover:bg-dark-greenish cursor-pointer select-none  ease-in duration-100 border text-greenish hover:text-white border-dark-greenish py-1 px-2 text-sm`} onClick={() => {
            setDelegateTarget(currentVote.username);setCurrentMode("unvote");
          }}>
            Unvote
        </div>
        </div>
        </div> }
        {!currentVote && <div className="text-center text-gray-400 py-2 border border-dark-secondary my-4">You are currently not voting!</div> }
        <div className="flex rounded-full bg-dark-tertiary  py-1 px-2 w-fit mx-auto space-x-1">
          <div
            className={`${
              mode == "forging" ? selectedClass : nonSelectedClass
            }`}
            onClick={() => setMode("forging")}
          >
            Forging
          </div>
          <div
            className={`${
              mode == "standby" ? selectedClass : nonSelectedClass
            }`}
            onClick={() => setMode("standby")}
          >
            Standby
          </div>
        </div>
        <div className="py-3 space-y-1">
          {delegates &&
            delegates.map((delegate: any) => {
              if (!currentVote || delegate.username != currentVote.username)
                return (
                  <div className="rounded border border-dark-tertiary hover:bg-dark-hoverish cursor-pointer ease-in duration-100" onClick={() => {toggleDelegate(delegate.username)}}>
                    <div className="py-1  flex items-center px-2 select-none ">
                    <div
                      className={`rounded-full w-2 inline-flex h-2 ${
                        delegate.rank <= 53 ? "bg-green-500" : "bg-yellow-500"
                      } h-fit`}
                    ></div>
                    <span className="text-gray-400 px-2 text-sm">
                      #{delegate.rank}
                    </span>{" "}
                    <span className="font-black grow">
                      {delegate.username}{" "}
                    </span>
                    <span className="text-right text-gray-500">
                      {(delegate.votes / 100000000).toLocaleString()} {currentWallet.network.ticker}
                    </span>
                  </div>
                    {selectedDelegate == delegate.username && <div className="flex"><div className="grow"></div><Button className="px-2 text-sm m-2" onClick={() => {
            setDelegateTarget(delegate.username);setCurrentMode("vote");
          }}>Vote</Button></div>}
                  </div>
                  
                );
            })}
        </div>
      </div>      }
      { currentMode == "unvote" &&
            <Unvote username={delegateTarget} setShow={props.setShow}/>
       }
      { currentMode == "vote" &&
            <VoteFor username={delegateTarget} setShow={props.setShow}/>
       }
        
    </>
  );} else { return <div></div> }
};

import { useEffect, useState } from "react";
import { MdArrowBack } from "react-icons/md";
import Armor from "../../Armor";
import { Button } from "../ui/Button";

export const Vote = () => {
  const currentWallet = Armor.currentWallet();
  const [delegates, setDelegates] = useState(undefined);
  const [mode, setMode] = useState("forging");

  const selectedClass =
    "bg-greenish rounded-full py-1 px-3 ease-in duration-100 select-none cursor-pointer";
  const nonSelectedClass =
    "px-3 py-1 hover:bg-greenish ease-in duration-100 rounded-full select-none cursor-pointer";

  const [currentVote, setCurrentVote] = useState(undefined);

  useEffect(() => {
    getDelegates();
  }, [mode]);

  useEffect(() => {
    getDelegates();
  }, []);

  function getDelegates() {
    fetch(
      `${currentWallet.node}/delegates${
        mode == "forging" ? "?limit=53" : "?limit=53&isResigned=false&page=2"
      }`
    )
      .then((response) => response.json())
      .then((response: any) => {
        setDelegates(response.data);
      });
  }

  return (
    <>
      <div>
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
          <Button className="bg-transparent border text-greenish hover:text-white border-dark-greenish py-1 px-2 text-sm">
            Unvote
          </Button>
        </div>
        </div> }
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
                  <div className="py-1 rounded border border-dark-tertiary flex items-center px-2 select-none hover:bg-dark-hoverish">
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
                      {(delegate.votes / 100000000).toLocaleString()} SXP
                    </span>
                  </div>
                );
            })}
        </div>
      </div>
    </>
  );
};

import { useState } from "react";
import { useWizard, Wizard } from "react-use-wizard";
import { Button } from "../components/ui/Button";

export const Import = (props: { goTo: (page: string) => void }) => {
  return (
    <div className="mx-auto w-fit">
      <div className="py-16"></div>
      <Wizard>
        <Passphrase />
        <WalletSetup goTo={props.goTo}/>
      </Wizard>
    </div>
  );
};

const Passphrase = () => {
  const [passphrase, setPassphrase] = useState("");
  const { nextStep } = useWizard();
  return (
    <div>
        <div className="h-96">
        <div className=" text-6xl font-black mt-6 text-center">
        Import an existing wallet
      </div>
      <div className="py-5"></div>
      <div className="py-6 text-2xl">
        Paste here the passphrase of your wallet
      </div>
      <textarea
        name=""
        className="w-full p-3 h-48 bg-dark-secondary rounded-lg outline-greenish"
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setPassphrase(e.currentTarget.value);
        }}
      ></textarea>
        </div>
      <div className="flex py-2 flex-row-reverse">
        <Button disabled={passphrase.length == 0} onClick={nextStep}>
          Next
        </Button>
      </div>
    </div>
  );
};

const WalletSetup = (props: { goTo: (page: string) => void }) => {
  return (
    <div>
        <div className="h-96">
        <div className=" text-6xl font-black mt-6 text-center">
        Set a name for your wallet
      </div>
      <div className="py-5"></div>

      <div className="py-6 text-2xl">Name</div>
      <input type="text" name="" className=" p-3 w-1/2 bg-dark-secondary rounded-lg outline-greenish" />
      <div className="py-3"></div>
        <div className="rounded-lg bg-dark-tertiary mx-auto text-xl py-4 px-8 text-center select-none hover:bg-dark-hoverish font-mono text-greenish">
        SPACELPYtxRSQom48QvsQa7E1HRfSBx33u
      </div>
        </div>
      <div className="flex py-2 flex-row-reverse">
        <Button onClick={()=> {props.goTo("wallet")}}>
          Finish
        </Button>
      </div>
    </div>
  );
};
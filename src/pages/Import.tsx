import { useEffect, useState } from "react";
import { useWizard, Wizard } from "react-use-wizard";
import Armor, { SolarMainnet, SolarTestnet } from "../Armor";
import { Button } from "../components/ui/Button";

export const Import = (props: { goTo: (page: string) => void }) => {
  const [network, setNetwork] = useState(undefined)
  const [passphrase, setPassphrase] = useState("")
  return (
    <div className="mx-auto w-fit">
      <div className="py-16"></div>
      <Wizard>
        <ChooseNetwork setNetwork={setNetwork}/>
        <Passphrase setPassphrase={setPassphrase}/>
        <WalletSetup passphrase={passphrase} network={network} goTo={props.goTo}/>
      </Wizard>
    </div>
  );
};

const ChooseNetwork = (props: {setNetwork: (network:string) => void}) => {
  const { nextStep } = useWizard();
  const [network, setNetwork] = useState("")

  useEffect(() => {props.setNetwork(network)}, [network])

  return (
    <div>
      <div className="">
        <img src="full_logo.png" className="h-12 mx-auto" />
        <div className=" text-6xl font-black mt-6 text-center">
        Import an existing wallet
      </div>
      <div className="py-5"></div>
      <div className="py-6 text-2xl">
        Choose the network
      </div>
      </div>
      <div className="flex space-x-3">
        <div className={`border ${network == "mainnet"? 'border-greenish' : 'border-dark-secondary'} rounded p-6 font-black text-xl flex flex-col space-y-3 hover:border-dark-greenish select-none hover:cursor-pointer`}onClick={() => {setNetwork("mainnet")}}>
          <img src="/blockchains/solar_mainnet.png" className="w-20 mx-auto" alt="" />
          <span>Solar Mainnet</span>
        </div>
        {/* <div className={`border ${network == "testnet"? 'border-greenish' : 'border-dark-secondary'} rounded p-6 font-black text-xl flex flex-col space-y-3 hover:border-dark-greenish select-none hover:cursor-pointer`} onClick={() => {setNetwork("testnet")}}>
          <img src="/blockchains/solar_testnet.png" className="w-20 mx-auto" alt="" />
          <span>Solar Testnet</span>
        </div> */}
      </div>
      <div className="flex py-2 flex-row-reverse">
        <Button disabled={network == ""} onClick={nextStep}>
          Next
        </Button>
      </div>
    </div>
  )
}

const Passphrase = (props: {setPassphrase: (passphrase:string) => void}) => {
  const [passphrase, setPassphrase] = useState("");
  const { nextStep } = useWizard();

  useEffect(() => {
    if (Armor.isValidPassphrase(passphrase)) {
      props.setPassphrase(passphrase)
    }
  }, [passphrase])

  return (
    <div>
        <div className="">
        <img src="full_logo.png" className="h-12 mx-auto" />
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
        <Button disabled={!Armor.isValidPassphrase(passphrase)} onClick={nextStep}>
          Next
        </Button>
        
      </div>
    </div>
  );
};

const WalletSetup = (props: { goTo: (page: string) => void, passphrase:string, network: "mainnet" | "testnet" }) => {
  const { previousStep } = useWizard();
  const [name, setName] = useState("")
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
  return (
    <div>
        <div className="h-96">
        <div className=" text-6xl font-black mt-6 text-center">
        Set a name for your wallet
      </div>
      <div className="py-5"></div>

      <div className="py-6 text-2xl">Name</div>
      <input type="text" name="" className=" p-3 w-full bg-dark-secondary rounded-lg outline-greenish" maxLength={100} value={name} onChange={(event: React.ChangeEvent<HTMLInputElement>) => {setName(event.currentTarget.value)}} />
      <div className="py-3"></div>
        <div className="rounded-lg bg-dark-tertiary mx-auto text-xl py-4 px-8 text-center select-none hover:bg-dark-hoverish font-mono text-greenish">
        {Armor.addressFromPassphrase(props.passphrase, props.network)}
      </div>
        </div>
        <div className="w-full py-3">
            Password
            <br />
            <input
        type="password"
        maxLength={64}
        className="rounded w-1/2 bg-dark-secondary dark:bg-dark-secondary dark:text-white dark:border-0 px-3 py-2  mt-1 text-white"
        value={password}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {setPassword(event.currentTarget.value);}}
      />
            </div>
            {wrongPassword && <div className="w-fit py-4 mx-auto text-center text-red-400">Wrong password</div>}
      <div className="flex py-2 flex-row-reverse items-center">
        <Button disabled={wrongPassword} onClick={()=> {Armor.saveWallet({name: name, network: props.network == "mainnet"? SolarMainnet : SolarTestnet, address: Armor.addressFromPassphrase(props.passphrase,props.network), passphrase: props.passphrase},password).then(() => {window.close()})}}>
          Save
        </Button>
        <a href="#" className="hover:underline mx-3" onClick={() => {window.close()}}>Cancel</a>
      </div>
    </div>
  );
};
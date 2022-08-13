import { useEffect, useRef, useState } from "react";
import { BiCopy, BiRefresh } from "react-icons/bi";
import { useWizard, Wizard } from "react-use-wizard";
import Armor, { SolarMainnet, SolarTestnet } from "../Armor";
import { Button } from "../components/ui/Button";

export const New = (props: { goTo: (page: string) => void }) => {
  const [network, setNetwork] = useState(undefined)
  const [passphrase, setPassphrase] = useState("")

    return (
        <div className="mx-auto max-w-3xl">
          <div className="py-16"></div>
          <Wizard>
            <ChooseNetwork setNetwork={setNetwork}/>
            <GenerateWallet network={network} setPassphrase={setPassphrase}/>
            <BackupWallet passphrase={passphrase}/>
            <VerifyWallet passphrase={passphrase}/>
            <NameWallet goTo={props.goTo} network={network} passphrase={passphrase}/>
          </Wizard>
        </div>
      );
}

export const ChooseNetwork = (props: {setNetwork: (network:string) => void}) => {
  const { nextStep } = useWizard();
  const [network, setNetwork] = useState("")

  useEffect(() => {props.setNetwork(network)}, [network])

  return (
    <div>
      <div className="">
      <img src="full_logo.png" className="h-12 mx-auto" />
        <div className=" text-6xl font-black mt-6 text-center flex space-x-3 items-center">
        <span className="rounded bg-dark-secondary px-4 h-fit text-greenish py-2 items-center flex text-xl rounded-full font-black">Step 1</span> <span>Choose a network</span>
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

const GenerateWallet = (props: {network: 'mainnet' | 'testnet', setPassphrase: (pp:string) => void}) => {
    const { nextStep } = useWizard();
    const [pp1, setPP1] = useState("")
    const [pp2, setPP2] = useState("")
    const [pp3, setPP3] = useState("")

  const [selectedPP, setSelectedPP] = useState("")

    function refreshAddresses() {
      Armor.generatePassphrase().then((pp) => {setPP1(pp)})
      Armor.generatePassphrase().then((pp) => {setPP2(pp)})
      Armor.generatePassphrase().then((pp) => {setPP3(pp)})
    }

    useEffect(() => {refreshAddresses()}, []);

    useEffect(() => {
      if (selectedPP == "1") {
        props.setPassphrase(pp1)
      } else if (selectedPP == "2") {
        props.setPassphrase(pp2)
      } else if (selectedPP == "3") {
        props.setPassphrase(pp3)
      }
    }, [selectedPP]);

    return (
        <div>
        <div className="">
        <img src="full_logo.png" className="h-12 mx-auto" />
        <div className=" text-6xl font-black mt-6 text-center flex space-x-3 items-center">
        <span className="rounded bg-dark-secondary px-4 h-fit text-greenish py-2 items-center flex text-xl rounded-full font-black">Step 2</span> <span>Choose an address</span>
      </div>
      <div className="text-gray-400  pt-8"><p>Select one of these freshly generated wallets.</p> 
      <br />
      <p>If you do not like them, click on the <BiRefresh className="inline-block"/>  button to generate others.</p></div>
      <div className="py-5"></div>
      <div className="flex flex-row-reverse mb-2"><Button className="w-fit bg-transparent px-2 border border-dark-secondary" onClick={() => {Armor.generatePassphrase().then((pp) => {refreshAddresses()})}}><BiRefresh/></Button></div>
      <div className="space-y-6">
      <div className={`rounded border hover:bg-dark-hoverish select-none cursor-pointer ease-in duration-100 border-dark-secondary font-mono text-greenish text-center py-3 text-xl ${selectedPP == "1"? "border-greenish" : ""}`} onClick={() => {setSelectedPP("1")}}>
      {Armor.addressFromPassphrase(pp1, props.network)}
      </div>
      <div className={`rounded border hover:bg-dark-hoverish select-none cursor-pointer ease-in duration-100 border-dark-secondary font-mono text-greenish text-center py-3 text-xl ${selectedPP == "2"? "border-greenish" : ""}`} onClick={() => {setSelectedPP("2")}}>
      {Armor.addressFromPassphrase(pp2, props.network)}
      </div>
      <div className={`rounded border hover:bg-dark-hoverish select-none cursor-pointer ease-in duration-100 border-dark-secondary font-mono text-greenish text-center py-3 text-xl ${selectedPP == "3"? "border-greenish" : ""}`} onClick={() => {setSelectedPP("3")}}>
      {Armor.addressFromPassphrase(pp3, props.network)}
      </div>
      </div>
      
        </div>
      <div className="flex py-4 flex-row-reverse">
        <Button disabled={selectedPP == ""} onClick={nextStep}>
          Next
        </Button>
      </div>
    </div>
    );
}

const BackupWallet = (props: {passphrase:string}) => {
    const { nextStep } = useWizard();
    const [cb, setCB] = useState("Copy");
    function copyPP() {
      navigator.clipboard.writeText(props.passphrase)
      setCB("Copied!")
    }

    return (
        <div>
        <div className="">
        <img src="full_logo.png" className="h-12 mx-auto" />
        <div className=" text-6xl font-black mt-6 text-center flex space-x-3 items-center">
        <span className="rounded bg-dark-secondary px-4 h-fit text-greenish py-2 items-center flex text-xl rounded-full font-black">Step 3</span> <span>Backup your passphrase</span>
      </div>
      <div className="flex flex-row-reverse px-12 mt-3"><Button className="w-fit bg-transparent px-2 border border-dark-secondary flex items-center ease-in duration-300" onClick={() => { copyPP();}}><BiCopy className="mr-2"/>{cb}</Button></div>
      <div className="grid grid-cols-4 gap-3 mx-auto mb-8 mt-6">
          {props.passphrase.split(" ").map((word,i) => (
              <div className="px-2 border py-3 border-dark-secondary rounded-lg items-center flex"> <span className="text-xs text-gray-400 mx-2 mr-2 select-none">{i+1}</span> <span className="text-2xl font-black mx-auto">{word}</span></div>
          ))}
      </div>
      </div>
      <div className="flex py-4 flex-row-reverse">
        <Button onClick={nextStep}>
          Next
        </Button>
      </div>
      </div>
    )
}

const VerifyWallet = (props: {passphrase:string}) => {
    const { nextStep } = useWizard();
    const [shuffledPassphrase, setShuffledPassphrase] = useState([])
    const [currentInput, setCurrentInput] = useState("1")
    
    const [input1, setInput1] = useState("")
    const [input2, setInput2] = useState("")
    const [input3, setInput3] = useState("")

    const [correct1, setCorrect1] = useState("")
    const [correct2, setCorrect2] = useState("")
    const [correct3, setCorrect3] = useState("")
    
    const i1 = useRef(null)
    const i2 = useRef(null)
    const i3 = useRef(null)

    useEffect(() => {
      refreshShuffle()
      let splitted = props.passphrase.split(" ")
      setCorrect1(splitted[2])
      setCorrect2(splitted[5])
      setCorrect3(splitted[8])
    }, [props.passphrase])

    function refreshShuffle() {
      setShuffledPassphrase(props.passphrase.split(" ").map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value));
    }

    function setCurrentWord(word:string) {
      if (currentInput == "1") {
        setInput1(word)
      } else if (currentInput == "2") {
        setInput2(word)
      } else if (currentInput == "3") {
        setInput3(word)
      }
    }

    function isVerified() : boolean {
      let splitted = props.passphrase.split(" ")
      return input1 == splitted[2] && input2 == splitted[5] && input3 == splitted[8]
    }

    return (
        <div>
        <div className="">
        <img src="full_logo.png" className="h-12 mx-auto" />
        <div className=" text-6xl font-black mt-6 text-center flex space-x-3 items-center">
        <span className="rounded bg-dark-secondary px-4 h-fit text-greenish py-2 items-center flex text-xl rounded-full font-black">Step 4</span> <span>Verify passphrase</span>
      </div>
      </div>
      <div className="py-5 flex">
      <div className="px-3"> <div className="text-center py-4 font-black text-xl">The third word</div> <input type="text" name="" className={`text-center p-3  bg-dark-secondary rounded-lg outline-greenish ${input1 != correct1? 'bg-dark-secondary' : 'bg-green-800'}`} value={input1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {if (input1 != correct1) {setInput1(e.currentTarget.value); if (correct1 == e.currentTarget.value) {i2.current.focus()}}}} onFocus={() => {refreshShuffle(); setCurrentInput("1")}} readOnly={input1 == correct1} ref={i1}/></div>
      <div className="px-3"> <div className="text-center py-4 font-black text-xl">The sixth word</div> <input type="text" name="" ref={i2} className={`text-center p-3  bg-dark-secondary rounded-lg outline-greenish ${input2 != correct2? 'bg-dark-secondary' : 'bg-green-800'}`} value={input2}  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {if (input2 != correct2) {setInput2(e.currentTarget.value); if (correct2 == e.currentTarget.value) {i3.current.focus()} } }} onFocus={() => {refreshShuffle(); setCurrentInput("2")}} readOnly={input2 == correct2} /></div>
      <div className="px-3"> <div className="text-center py-4 font-black text-xl">The ninth word</div> <input type="text" ref={i3}  value={input3} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {if (input3 != correct3) {setInput3(e.currentTarget.value); if (correct1 == e.currentTarget.value) {i1.current.focus()}}}} name="" className={`text-center p-3  bg-dark-secondary rounded-lg outline-greenish ${input3 != correct3? 'bg-dark-secondary' : 'bg-green-800'}`} readOnly={input3 == correct3} onFocus={() => {refreshShuffle(); setCurrentInput("3")}}/></div>
      </div>
      <div>        
      </div>
      <div className="grid grid-cols-4 gap-3 mx-auto mb-8 mt-6">
      
      {shuffledPassphrase.map((word,i) => (
              <div className="px-2 border py-3 border-dark-secondary rounded-lg items-center flex hover:bg-dark-secondary cursor-pointer" onClick={() => setCurrentWord(word)}> <span className="text-xs text-gray-400 mx-2 mr-2 select-none">{i+1}</span> <span className="text-2xl font-black mx-auto">{word}</span></div>
          ))}
      </div>
      <div className="flex py-4 flex-row-reverse">
        <Button onClick={nextStep} disabled={!isVerified()}>
          Next
        </Button>
      </div>
      </div>
    )
}

const NameWallet = (props: { goTo: (page: string) => void, passphrase:string, network: "mainnet" | "testnet" }) => {
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
        </div>
    </div>
  );
};
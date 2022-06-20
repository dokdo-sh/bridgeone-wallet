import React, { useEffect, useState } from "react";
import { BiImport, BiWallet } from "react-icons/bi";
import { BrowserRouter } from "react-router-dom";
import { Wizard, useWizard } from "react-use-wizard";
import { Button } from "../components/ui/Button";
import Armor from "../Armor";
declare var browser: any;
export function Welcome(props: { goTo: (page: string) => void }) {
  return (
    <>
      <Wizard>
        <Password/>
        <First goTo={props.goTo}/>
      </Wizard>
    </>
  );
}

function First(props: { goTo: (page: string) => void }) {
 
  return (
    <div>
    <div className="border-b border-dark-secondary py-10">
      <img src="/isotype_circle.png" className="w-28 mx-auto" alt="" />
      <div className=" text-6xl font-black mt-6 text-center italic">Welcome!</div>
    </div>
    <div className="mx-auto w-fit">
      <div className="my-12"></div>
      <div className="my-3 text-xl">
        <p className="text-2xl">
          We will go through the first steps to get your wallet working.
        </p>{" "}
        <br /> <p>If you already have a wallet, please click on the second option.</p>
      </div>
      
      <div className="py-4 space-y-3">
        <div className="rounded border border-dark-secondary p-6 align-center items-center flex hover hover:border-greenish mx-auto cursor-pointer ease-in duration-100" onClick={() => {window.location.href = '/index.html#new'}}>
          <BiWallet className="inline-flex text-3xl mx-3" />
          <div className="text-2xl inline-flex">
            I don't have a wallet yet
          </div>
        </div>

        <div className="rounded border border-dark-secondary p-6 align-center items-center flex hover hover:border-greenish mx-auto cursor-pointer ease-in duration-100" onClick={() => {window.location.href = '/index.html#import'}}>
          <BiImport className="inline-flex text-3xl mx-3" />
          <div className="text-2xl inline-flex">
            I want to import an existing wallet
          </div>
        </div>
        
      </div>
    </div>
    <div className="my-16"></div>
  </div>
  );
}

function Password() {
  const [canSavePassword, setCanSavePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { nextStep } = useWizard();
  const [passwordWeak, setPasswordWeak] = useState(false);

  function validatePassword(event: React.FormEvent<HTMLInputElement>) {
    setPassword(event.currentTarget.value)
  }

  useEffect(() => {
    browser.storage.local.get("login").then((login:any) => {
      if (login.login) {
        nextStep()
      }
    })
  },[])

  function savePassword() {}

  return (
    <div>
          <div className="border-b border-dark-secondary py-10">
      <img src="/isotype_circle.png" className="w-28 mx-auto" alt="" />
      <div className=" text-6xl font-black mt-6 text-center italic">Welcome!</div>
    </div>

      <div className="font-black text-2xl mt-6 text-center">
        Enter a password to protect your wallet
      </div>
      <div className="mx-auto w-fit py-3 text-gray-400">We will use this password to encrypt all your passphrases. It must have between 6 and 20 characters. <br/>If you lose this password you will lose all your saved wallets and settings!</div>
      <div className="my-8"></div>
      <div className="mx-auto w-fit">
        
      <div className="py-5">
        <div>Password</div>
        <input
        type="password"
        onChange={validatePassword}
        maxLength={20}
        className="rounded bg-dark-secondary dark:bg-dark-secondary dark:text-white dark:border-0 px-3 py-2 w-72 mt-1 text-white"
      />
      </div>
      {(password.length < 6 || password.length > 20) && <div className="mx-auto w-fit text-red-400">Your password is too short</div>}
      
      <div className="py-5">
              <div>Confirm password</div>
            <input
        type="password"
        maxLength={20}
        onChange={(event: React.FormEvent<HTMLInputElement>) => {setConfirmPassword(event.currentTarget.value)}}
        className="rounded bg-dark-secondary dark:bg-dark-secondary dark:text-white dark:border-0 px-3 py-2 w-72 mt-1 text-white"
      />
            </div>
      </div>
      {password != confirmPassword && <div className="mx-auto w-fit text-red-400">Passwords do not match</div>}
      

      <div className="mx-auto w-fit py-5"><Button disabled={!(password == confirmPassword && password.length>5 && password.length < 21)} className="w-40 text-center" onClick={()=> {Armor.savePassword(password);nextStep();}}>Next</Button></div>
    </div>
  );
}
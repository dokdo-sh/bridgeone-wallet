import React, { useState } from "react";
import { BiImport } from "react-icons/bi";
import { BrowserRouter } from "react-router-dom";
import { Wizard, useWizard } from "react-use-wizard";
declare var browser:any;
export function Welcome(props: { goTo: (page: string) => void }) {
  return (
    <div>
      <div className="h-96 p-8">
        <Wizard>
          <First />
          <Password />
          <Import />
          <Done goTo={props.goTo} />
        </Wizard>
      </div>
    </div>
  );
}

function First() {
  const { nextStep } = useWizard();
  browser.storage.local.get("login").then((value:any) => {
      console.log(value);
  })
  return (
    <>
      <div>
        <img src="/isotype_circle.png" className="w-28 mx-auto" alt="" />
        <div className="font-black text-2xl mt-6 text-center">
          Welcome to <br /> <div className="text-4xl">Solar Wallet</div>
        </div>
        <div className="my-8"></div>
        <div className="my-3">Select here your wallet:</div>
        <div className="cursor-pointer mx-auto " onClick={() => nextStep()}>
          <div
            className="rounded-full w-fit bg-greenish hover:bg-dark-greenish p-2 text-white text-2xl ease-in duration-100" /* onClick={() => {browser.storage.local.set({welcome: "welcome"})}} */
          >
            <BiImport />
          </div>
          <div className="text-greenish">Import</div>
        </div>
      </div>
      <div className="my-16"></div>
    </>
  );
}

function Password() {
  const [canSavePassword, setCanSavePassword] = useState(false);
  const [password, setPassword] = useState("");
  const { nextStep } = useWizard();
  const [passwordError, setPasswordError] = useState(false);

 
  function validatePassword(event: React.FormEvent<HTMLInputElement>) {
    var passw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

    if (event.currentTarget.value.match(passw)) {
      setPassword(event.currentTarget.value);
      setPasswordError(false);
      setCanSavePassword(true);
    } else {
      setPasswordError(true);
      setCanSavePassword(false);
    }
  }
  function savePassword() {}

  return (
    <div>
      <div className="font-black text-2xl mt-6 text-center">
        Enter a password to protect your wallet
      </div>
      <div className="my-16"></div>
      <input
        type="password"
        onChange={validatePassword}
        maxLength={64}
        className="rounded bg-white dark:bg-dark-secondary dark:text-white dark:border-0 px-3 border border-gray-300 py-1 sm:w-96 mt-1 text-black"
      />
      {passwordError && (
        <span className="text-red-500 mt-3">
          Your password must have 6 to 20 characters which contain at least one
          numeric digit, one uppercase and one lowercase letter.
        </span>
      )}
      {canSavePassword && (
        <div
          className="p-2 bg-greenish text-white rounded w-fit cursor-pointer"
          onClick={() => {
            savePassword();
            nextStep();
          }}
        >
          Next
        </div>
      )}
    </div>
  );
}

function Import() {
  const { nextStep } = useWizard();

  return (
    <div>
      <div className="font-black text-2xl mt-6 text-center">
        Import your Solar wallet
      </div>
      <textarea
        placeholder="Paste here your private passphrase"
        className="border border-gray-200 p-2 m-3 h-48 focus-within:outline-greenish rounded"
      ></textarea>
      <div
        className="p-2 bg-greenish text-white rounded w-fit cursor-pointer"
        onClick={() => {
          nextStep();
        }}
      >
        Next
      </div>
    </div>
  );
}

function Done(props: { goTo: (page: string) => void }) {
  return (
    <div>
      <div className="font-black text-2xl mt-6 text-center">
        Great! Let's start then!
      </div>
      <div
        className="p-2 bg-greenish text-white rounded w-fit"
        onClick={() => {
          /* props.goTo("wallet"); */
          let login = {password: "test"};
          browser.storage.local.set({login});
          browser.browserAction.setPopup({popup: "/index.html"});
          browser.tabs.getCurrent().then((value:any) => {browser.tabs.remove(value.id)});
        }}
      >
        Go to wallet
      </div>
    </div>
  );
}

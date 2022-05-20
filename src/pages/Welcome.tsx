import React, { useState } from "react";
import { BiImport, BiWallet } from "react-icons/bi";
import { BrowserRouter } from "react-router-dom";
import { Wizard, useWizard } from "react-use-wizard";
declare var browser: any;
export function Welcome(props: { goTo: (page: string) => void }) {
  return (
    <>
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
            <div className="rounded border border-dark-secondary p-6 align-center items-center flex hover hover:border-greenish mx-auto cursor-pointer ease-in duration-100" onClick={() => props.goTo("new")}>
              <BiWallet className="inline-flex text-3xl mx-3" />
              <div className="text-2xl inline-flex">
                I don't have a wallet yet
              </div>
            </div>

            <div className="rounded border border-dark-secondary p-6 align-center items-center flex hover hover:border-greenish mx-auto cursor-pointer ease-in duration-100" onClick={() => props.goTo("import")}>
              <BiImport className="inline-flex text-3xl mx-3" />
              <div className="text-2xl inline-flex">
                I want to import an existing wallet
              </div>
            </div>
            
          </div>
        </div>
        <div className="my-16"></div>
      </div>
    </>
  );
}

// function First() {
 
//   // browser.storage.local.get("login").then((value:any) => {
//   //     console.log(value);
//   // })
//   return (
    
//   );
// }

// function Password() {
//   const [canSavePassword, setCanSavePassword] = useState(false);
//   const [password, setPassword] = useState("");
//   const { nextStep } = useWizard();
//   const [passwordError, setPasswordError] = useState(false);

//   function validatePassword(event: React.FormEvent<HTMLInputElement>) {
//     var passw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

//     if (event.currentTarget.value.match(passw)) {
//       setPassword(event.currentTarget.value);
//       setPasswordError(false);
//       setCanSavePassword(true);
//     } else {
//       setPasswordError(true);
//       setCanSavePassword(false);
//     }
//   }
//   function savePassword() {}

//   return (
//     <div>
//       <div className="font-black text-2xl mt-6 text-center">
//         Enter a password to protect your wallet
//       </div>
//       <div className="my-16"></div>
//       <input
//         type="password"
//         onChange={validatePassword}
//         maxLength={64}
//         className="rounded bg-white dark:bg-dark-secondary dark:text-white dark:border-0 px-3 border border-gray-300 py-1 sm:w-96 mt-1 text-black"
//       />
//       {passwordError && (
//         <span className="text-red-500 mt-3">
//           Your password must have 6 to 20 characters which contain at least one
//           numeric digit, one uppercase and one lowercase letter.
//         </span>
//       )}
//       {canSavePassword && (
//         <div
//           className="p-2 bg-greenish text-white rounded w-fit cursor-pointer"
//           onClick={() => {
//             savePassword();
//             nextStep();
//           }}
//         >
//           Next
//         </div>
//       )}
//     </div>
//   );
// }

// function Import() {
//   const { nextStep } = useWizard();

//   return (
//     <div>
//       <div className="font-black text-2xl mt-6 text-center">
//         Import your Solar wallet
//       </div>
//       <textarea
//         placeholder="Paste here your private passphrase"
//         className="border border-gray-200 p-2 m-3 h-48 focus-within:outline-greenish rounded"
//       ></textarea>
//       <div
//         className="p-2 bg-greenish text-white rounded w-fit cursor-pointer"
//         onClick={() => {
//           nextStep();
//         }}
//       >
//         Next
//       </div>
//     </div>
//   );
// }

// function Done(props: { goTo: (page: string) => void }) {
//   return (
//     <div>
//       <div className="font-black text-2xl mt-6 text-center">
//         Great! Let's start then!
//       </div>
//       <div
//         className="p-2 bg-greenish text-white rounded w-fit"
//         onClick={() => {
//           /* props.goTo("wallet"); */
//           let login = { password: "test" };
//           // browser.storage.local.set({login});
//           // browser.browserAction.setPopup({popup: "/index.html"});
//           // browser.tabs.getCurrent().then((value:any) => {browser.tabs.remove(value.id)});
//         }}
//       >
//         Go to wallet
//       </div>
//     </div>
//   );
// }

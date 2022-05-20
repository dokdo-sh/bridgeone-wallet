import React, { useEffect, useState } from "react";
import crypto, { Identities, Transactions } from "@solar-network/crypto";
import { BigNumber } from "@solar-network/utils";
import { Settings } from "./pages/Settings";
import { Welcome } from "./pages/Welcome";
import { Login } from "./pages/Login";
import { New } from "./pages/New";
import { Import } from "./pages/Import";
import { Wallet } from "./pages/Wallet";
declare var browser: any;

function App() {
  const [currentPage, setCurrentPage] = useState("wallet");
  try {
    browser.browserAction.setPopup({popup: "/index.html"});
  } catch 
  {}
  /*   useEffect(() => {
    browser.storage.local.get("settings").then(onGot, onError)
  
    function onGot(item:any) {
      if (item.settings.accounts) {
        setCurrentPage("welcome");
      } else {
        setCurrentPage("wallet");
      }
    }
    
    function onError(error:any) {
      setCurrentPage("welcome");
    }
  },[]) */

  return (
    <div className="sm:h-1/2">
      <div className="bg-dark-primary text-white h-[600px] sm:h-full">
      {currentPage == "welcome" && <Welcome goTo={setCurrentPage} />}
      {currentPage == "import" && <Import goTo={setCurrentPage} />}
      {currentPage == "wallet" && <Wallet goTo={setCurrentPage} />}
      {currentPage == "new" && <New goTo={setCurrentPage} />}
      {currentPage == "login" && <Login goTo={setCurrentPage} />}
      {currentPage == "settings" && <Settings goTo={setCurrentPage} />}
    </div>
    </div>
  );
}

export default App;

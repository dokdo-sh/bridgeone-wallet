import React, { useEffect, useState } from "react";
import { Settings } from "./pages/Settings";
import { Welcome } from "./pages/Welcome";
import { Login } from "./pages/Login";
import { New } from "./pages/New";
import { Import } from "./pages/Import";
import { Wallet } from "./pages/Wallet";
import { useLocation } from "react-router-dom";
import Armor from "./Armor";
import browser from 'webextension-polyfill'

function App() {
  const { hash } = useLocation();
  const [currentPage, setCurrentPage] = useState("");
  try {
    browser.browserAction.setPopup({popup: "/index.html"});
  } catch 
  {}
    useEffect(() => {
      function onGot(item:any) {
        if (!item.login) {
          browser.tabs.create({url: "/index.html#welcome"});
        } else {
          Armor.getWallets().then((wallets:any) => {
            if (wallets && wallets.wallets && wallets.wallets.length && wallets.wallets.length > 0) {
              Armor.isLogged().then((il:boolean) => {
                if (il == true) {
                  setCurrentPage("wallet");
                 } else {
                  setCurrentPage("login");
                }
              });
              
            } else {
              browser.tabs.create({url: "/index.html#welcome"});
            }
          })
        }
      }

      function onError(error:any) {
        browser.tabs.create({url: "/index.html#welcome"});
      }
      try {
        Armor.isLogged().then((il:boolean) => {
          if (hash == "#import" && il == true) {
            setCurrentPage("import");
          } else if (hash == "#new"  && il == true) {
            setCurrentPage("new");
          } else if (hash == "#welcome") {
            setCurrentPage("welcome");
          } else {
            browser.storage.local.get("login").then(onGot, onError)
          }
        })
      
    } catch (ex:any) {
      
    }
  },[]) 



  useEffect(() => {
   Armor.isLogged().then((il:boolean) => {
    if (il == true) {
      if (hash == "#import") {
        setCurrentPage("import");
      } else if (hash == "#new") {
        setCurrentPage("new");
      }
    }
   })
  }, [hash])

  return (
    <div className="sm:h-1/2">
      <div className={`bg-dark-primary text-white h-[600px] sm:h-full ${currentPage == "wallet"? '' : ''}`}>
        
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

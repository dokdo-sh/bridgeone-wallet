import React, { useEffect, useState } from 'react';
import './App.css';
import crypto, { Identities, Transactions} from '@solar-network/crypto';
import { BigNumber } from '@solar-network/utils';
import { Wallet } from './Wallet';
import { Settings } from './Settings';
import { Welcome } from './Welcome';
 declare var browser:any;

function App() {
 const [currentPage, setCurrentPage] = useState("welcome");
  
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
   <>
    {currentPage != "welcome" && 
    <div className="bg-primary h-16">
    <div className="flex p-3">
      <div><img src="/isotype_circle.png" className="h-10"alt="" /></div>
      <div className="grow"></div>
      <div className="rounded-full mx-2 border text-sm border-gray-300 p-2 hover:bg-hoverish cursor-pointer" onClick={() => setCurrentPage("welcome")}>Solar Mainnet</div>
      <div>User</div>
    </div>
  </div>
    }
   {currentPage == "welcome" && <Welcome goTo={setCurrentPage}/>}
   {currentPage == "wallet" && <Wallet goTo={setCurrentPage}/>}
   {currentPage == "settings" && <Settings goTo={setCurrentPage}/>}
   </>
  );
}

export default App;

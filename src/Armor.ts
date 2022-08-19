import solar from "./wallets/solar";
import passworder from '@metamask/browser-passworder'
declare const browser:any;

class Vault {
    static async encrypt(wallet:Wallet, password:string) {
        let w=wallet;
        w.passphrase = await passworder.encrypt(password,wallet.passphrase);
        return w;
    }
    static async getPassphrase(passphrase:string, password:string) : Promise<string> {
        return await passworder.decrypt(password,passphrase) as string;
    }
}

export const SolarMainnet : Network = {
    "title": "Solar Mainnet",
    "api_url": "https://sxp.mainnet.sh/api/",
    "ticker": "SXP",
    "logo":"solar_mainnet.png",
    "preset":"mainnet",
    "explorer_url": "https://explorer.solar.org"
} 

export const SolarTestnet  : Network = {
    "title": "Solar Testnet",
    "api_url": "https://sxp.testnet.sh/api/",
    "ticker": "tSXP",
    "logo":"solar_testnet.png",
    "preset":"testnet",
    "explorer_url": "https://texplorer.solar.org"
}

export const Armor =  {
    login: async (password:string) : Promise<boolean> => {
        let isAuth = await Armor.validPassword(password);
        if (isAuth) {
            let wiwi = await browser.runtime.getBackgroundPage()
            wiwi.logged = true;
            return true;
        } else {
            return false;
        }
    },
    validPassword: async (password:string) : Promise<boolean> => {
        function hash(s:string)  {
            const utf8 = new TextEncoder().encode(s);
            return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hashHex = hashArray
                .map((bytes) => bytes.toString(16).padStart(2, '0'))
                .join('');
              return hashHex;
            });
          }
        let lg = await browser.storage.local.get("login")
        if (lg.login.password == await hash(password)) {
            return true;
        } else {
            return false;
        }
    },
    defaultNetworks: [
        SolarMainnet
    ],
    Vault: Vault,
    isLogged : async() : Promise<boolean> => {
        return (await browser.runtime.getBackgroundPage()).logged;
      },
      logout: async () => {
        (await browser.runtime.getBackgroundPage()).logged = false
      },
    getWallets: async () : Promise<any> => {
        return await browser.storage.local.get("wallets")
    },
    saveWallet : async (w:Wallet, password:string) => {
        let wp = await Vault.encrypt(w,password)
        let result = (await browser.storage.local.get("wallets"))
        if (!result.wallets) {
            await browser.storage.local.set({wallets: [wp]})
            await browser.storage.local.set({current_wallet: wp});
        } else {
            let existing = result.wallets.filter((wallet:any) => {if (wallet.address == wp.address) {return wallet}})
            if (!existing.length) {
                await browser.storage.local.set({wallets: result.wallets.concat([wp])})
                await browser.storage.local.set({current_wallet: wp});
            }
        }
    },
    removeWallet : async (w:Wallet) : Promise<any> => {
        let ww = (await browser.storage.local.get("wallets")).wallets;
        
        return browser.storage.local.set({wallets: ww.filter((wallet:any) => wallet.address != w.address)});
    },
    currentWallet: async () : Promise<solar> => {
        let current_wallet = await browser.storage.local.get("current_wallet")
        return new solar(current_wallet.current_wallet);
    },
    setCurrentWallet : async (wallet:Wallet) => {
        return browser.storage.local.set({current_wallet: wallet});
    },
    isValidPassphrase: (passphrase:string) : boolean => {        
        return solar.isValidPassphrase(passphrase);
    },
    addressFromPassphrase : (passphrase:string, network: "mainnet" | "testnet") : string => {
        return solar.addressFromPassphrase(passphrase, network)
    },
    addTxToQueue : (json:string,url:string) => {
        browser.runtime.sendMessage(
            {
                transaction: json,
                url: url
            }
          );
    },
    savePassword : (password:string) : void => {
        function hash(s:string)  {
            const utf8 = new TextEncoder().encode(s);
            return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hashHex = hashArray
                .map((bytes) => bytes.toString(16).padStart(2, '0'))
                .join('');
              return hashHex;
            });
          }
          hash(password).then((hash) => {
            let login = { password:  hash }
            browser.runtime.getBackgroundPage().then((wiwi:any) => {
                wiwi.logged = true;
                browser.storage.local.set({login: login});
            })
          })
          
    },
    generatePassphrase: async () : Promise<string> => {
        return await solar.generateMnemonic()
    },
    contacts: {
        all: async () : Promise<Array<Contact>> => {
            let cc =  (await browser.storage.local.get("contacts")).contacts
            if (cc) {
                return cc
            } else {
                return []
            }
        },
        add: async (cont:Contact) => {
            let cc = (await browser.storage.local.get("contacts")).contacts
            if (!cc) {
                return browser.storage.local.set({contacts: [cont]})
            } else {
                let existing = cc.filter((con:any) => {if (cont.address == con.address) {return con}})
                if (!existing.length) {
                    return browser.storage.local.set({contacts: cc.concat([cont])})
                }
            }
        },
        delete: async (address:string) => {
            let cc = (await browser.storage.local.get("contacts")).contacts;
            return browser.storage.local.set({contacts: cc.filter((contact:any) => {if (contact.address != address) {return contact}})})
        }
    }
    
}

export type Wallet = {name:string, address:string, network: Network, passphrase:string}
export type Contact = {name:string, address:string, network: Network}
export type Network = {title: string, api_url:string, ticker: string, logo:string, preset: "mainnet" | "testnet", explorer_url:string}
export type NetworkType = {title: string}
export default Armor;
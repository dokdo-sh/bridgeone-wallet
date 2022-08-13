import { Identities, Managers, Networks, Transactions } from "@solar-network/crypto";
import { Address } from "@solar-network/crypto/dist/identities";
import {Big} from 'big.js'
import { generateMnemonic } from "bip39";
import Armor, { Network, SolarMainnet, Wallet } from "../Armor";

export class Solar {

    address:string;
    name:string;
    network:Network;
    publicKey:string;
    balance: number;
    passphrase: string;
    constructor(wallet:Wallet) {
        this.address = wallet.address;
        this.name = wallet.name;
        this.network = wallet.network;
        this.passphrase = wallet.passphrase;
        fetch(`${this.network.api_url}/wallets/${this.address}`).then((response) => {
            response.json().then((data) =>  {
                this.publicKey = data.publicKey;
            })
        })
    }

    async getBalance() : Promise<number> {       

        try {
        return (await (await fetch(`${this.network.api_url}/wallets/${this.address}`)).json()).data.balance as number;
       } catch {
           return 0;
       }
    }

    static validateAddress(address:string, network: Network) : boolean {
            Managers.configManager.setFromPreset(network.preset)
            return Identities.Address.validate(address);
        
     }
     static isValidPassphrase(passphrase:string) : boolean {
        if (passphrase.split(" ").length >= 8) {
            if (Identities.Address.fromPassphrase(passphrase).length == 34) {
                return true
            }
        }
        return false;
     }
     static async generateMnemonic() : Promise<string> {
        const passphrase = generateMnemonic();
        return passphrase;
     }
     static addressFromPassphrase(passphrase:string, network: "mainnet" | "testnet") : string {
        Managers.configManager.setFromPreset(network)
        return Identities.Address.fromPassphrase(passphrase)
     }
     validateAddress(address:string) : boolean {
        if (this.network == SolarMainnet) {
            Managers.configManager.setFromPreset("mainnet")
            return Identities.Address.validate(address);
        } else {
            Managers.configManager.setFromPreset("testnet")
            return Identities.Address.validate(address);
        }
     }

    async getVote() : Promise<string> {
        try {
         return (await (await fetch(`${this.network.api_url}/wallets/${this.address}`)).json()).data.attributes.vote as string;
        } catch {
            return "";
        }
     } 

     async getTransaction(txId:string) : Promise<any> {
        try {
         return (await (await fetch(`${this.network.api_url}/transactions/${txId}`)).json()).data;
        } catch {
            return undefined;
        }
     } 

     async sendTransaction(tx : {recipients: any[], fee : string,  vendorField? : string}, password : string) {
        let nonce : number = await this.getCurrentNonce()
        if (tx.recipients.length>0) {
            if (tx.recipients.length>1) {
                    Managers.configManager.setFromPreset(this.network.preset);
                    let transaction = Transactions.BuilderFactory.transfer()
                tx.recipients.map((recipient) => {
                 transaction = transaction.addPayment(recipient.addresss,Big(recipient.amount).times(10 ** 8).toFixed(0));
                })
              let itransaction = transaction.fee(Big(tx.fee).times(10 ** 8).toFixed(0))
                .nonce((nonce + 1).toString());
                if (tx.vendorField && tx.vendorField.length>0) {
                    itransaction = itransaction.vendorField(tx.vendorField)
                }
                let passphrase = await Armor.Vault.getPassphrase(this.passphrase,password)
                let txJson = itransaction.sign(passphrase)
                .build()
                .toJson();
                
            } else {
                
                    Managers.configManager.setFromPreset(this.network.preset);
                    let transaction = Transactions.BuilderFactory.transfer()
                .recipientId(tx.recipients[0].address)
                .version(3)
                .amount(Big(tx.recipients[0].amount).times(10 ** 8).toFixed(0))
              let itransaction = transaction.fee(
                  Big(tx.fee)
                    .times(10 ** 8)
                    .toFixed(0)
                )
                .nonce((nonce + 1).toString());
                if (tx.vendorField && tx.vendorField.length>0) {
                    itransaction = itransaction.vendorField(tx.vendorField)
                }
                let passphrase = await Armor.Vault.getPassphrase(this.passphrase,password)
                let txJson = itransaction.sign(passphrase)
                .build()
                .toJson();
                Armor.addTxToQueue(JSON.stringify({transactions: [txJson]}),this.network.api_url);
            }
        }
     }

     getCurrentNonce() {
        return new Promise<number>((resolve, reject) => {
          (async () => {
            try {
              let walletInfo: any = await (await fetch(
                this.network.api_url + "wallets/" + this.address
              )).json();
              resolve(parseInt(walletInfo.data.nonce));
            } catch (e) {
              reject(e);
            }
          })();
        });
      }

     async vote(delegate:string, fee:string, password:string) {
            let currentVote : string = await this.getVote()
            let publicKey = ""
            
            if (currentVote) {
                publicKey = (await (await fetch(`${this.network.api_url}/delegates/${await this.getVote()}`)).json()).data.publicKey
            }  
            
            let nonce = await this.getCurrentNonce()
            Managers.configManager.setFromPreset(this.network.preset);
            let passphrase = await Armor.Vault.getPassphrase(this.passphrase,password)
            let txBuild = Transactions.BuilderFactory.vote()
            .nonce((nonce + 1).toString())
            
            if (publicKey.length) {
                txBuild = txBuild.votesAsset([`-${publicKey}`,`+${delegate}`])
            } else {
                txBuild = txBuild.votesAsset([`+${delegate}`])
            }

            let txJson =  txBuild.fee(Big(fee).times(10 ** 8).toFixed(0))
            .sign(passphrase)
            .build()
            .toJson()

            Armor.addTxToQueue(JSON.stringify({transactions: [txJson]}),this.network.api_url);
    }
    async unvote(delegate:string, fee:string, password:string) {
        let nonce = await this.getCurrentNonce()
        Managers.configManager.setFromPreset(this.network.preset);
        let passphrase = await Armor.Vault.getPassphrase(this.passphrase,password)
        let txJson = Transactions.BuilderFactory.vote()
        .nonce((nonce + 1).toString())
        .votesAsset([`-${delegate}`])
        .fee(Big(fee).times(10 ** 8).toFixed(0))
        .sign(passphrase)
        .build()
        .toJson()
        
        Armor.addTxToQueue(JSON.stringify({transactions: [txJson]}),this.network.api_url);       
    }
    
    async getLatestTransactions() : Promise<any> {
        try {
         return (await (await fetch(`${this.network.api_url}/wallets/${this.address}/transactions?limit=10`)).json()).data as any;
        } catch {
            return null;
        }
     }

}
export default Solar;
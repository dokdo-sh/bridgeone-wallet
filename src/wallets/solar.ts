
export class solar {

    address:string;
    name:string;
    node:string;
    publicKey:string;
    balance: number;
    constructor(params: {address:string, name:string, node:string}) {
        this.address = params.address;
        this.name = params.name;
        this.node = params.node;
        fetch(`${this.node}/wallets/${this.address}`).then((response) => {
            response.json().then((data) =>  {
                this.publicKey = data.publicKey;
            })
        })
    }

    async getBalance() : Promise<number> {
       try {
        return (await (await fetch(`${this.node}/wallets/${this.address}`)).json()).data.balance as number;
       } catch {
           return 0;
       }
    } 
    //https://sxp.mainnet.sh/api/wallets/SPACELPYtxRSQom48QvsQa7E1HRfSBx33u/transactions
    async getLatestTransactions() : Promise<any> {
        try {
         return (await (await fetch(`${this.node}/wallets/${this.address}/transactions?limit=10`)).json()).data as any;
        } catch {
            return null;
        }
     }

}
export default solar;
import solar from "./wallets/solar";

export const Armor =  {
    login: (user:string, password:string) : boolean => {
        return true;
    },
    defaultNetworks: [
        {
            "title": "Solar Mainnet",
            "api_url": "https://sxp.mainnet.sh/api/"
        },
        {
            "title": "Solar Devnet",
            "api_url": "https://sxp.testnet.sh/api/"
        }
    ],
    getWallets: () : Array<{address:string, name:string}> => {
        return [{address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv",},{address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv"},
        {address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv"},
        {address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv"},
        {address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv"},
        {address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv"},
        {address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv",},{address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv"},
        {address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv"},
        {address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv"},
        {address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv"},
        {address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv"}]
    },
    currentWallet: () : solar => {
        return new solar({address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u", name: "delegate leitesv", node: "https://sxp.mainnet.sh/api"});
    },
    contacts: {
        all:() : Array<Contact> => {
            return [{name:"test contact", address:"SPACELPYtxRSQom48QvsQa7E1HRfSBx33u"},{name:"juliano", address:"SgCmMtjTZiawcrLTP3u4sTfMW3w3XcKML9"}]
        },
        add:(contact:Contact):Contact|null => {
            return null;
        },
        update:(contact:Contact):Contact|null => {
            return null;
        },
        delete:(address:string):boolean => {
            return false;
        }
    }
    
}

export type Contact = {name:string, address:string}

export default Armor;
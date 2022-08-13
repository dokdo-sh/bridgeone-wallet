import { useEffect, useState } from "react";
import { BiImport, BiWallet } from "react-icons/bi";
import { BsTrashFill } from "react-icons/bs";
import { MdArrowBack } from "react-icons/md";
import Armor, { Wallet } from "../../Armor";
import solar from "../../wallets/solar";
declare var browser : any;
export const WalletSelect = (props: { goTo: (page: string) => void, reload: () => void, setShow: (s:boolean) => void }) => {
    const [wallets, setWallets] = useState([])
    const [currentAddress, setCurrentAddress] = useState("");

    useEffect(() => {
        Armor.getWallets().then((wallets:any) => {
            setWallets(wallets.wallets);
            Armor.currentWallet().then((cw:solar) => {
                setCurrentAddress(cw.address);
            })
        });
    }, [])

    function deleteWallet(wallet:Wallet) {
        if (currentAddress == wallet.address) {
            Armor.getWallets().then((wallets:any) => {
                let nw:any;
                wallets.wallets.map((w:any) => {
                    if (w.address != currentAddress) {
                        nw = w;
                    }
                })
                Armor.setCurrentWallet(nw).then(() => {
                    Armor.removeWallet(wallet).then(() => {
                        Armor.getWallets().then((wallets:any) => {
                            setWallets(wallets.wallets);
                            Armor.currentWallet().then((cw:solar) => {
                                setCurrentAddress(nw.address);
                            })
                        })
                    })
                })
            })
        } else {
            Armor.removeWallet(wallet).then(() => {
                Armor.getWallets().then((wallets:any) => {
                    setWallets(wallets.wallets);
                    Armor.currentWallet().then((cw:solar) => {
                        setCurrentAddress(cw.address);
                    })
                })
            })
            
        }
    }
    
        return (
            <>
    <div className="rounded bg-dark-tertiary border border-dark-tertiary p-3 hover:bg-dark-hoverish select-none cursor-pointer ease-in duration-100" onClick={() => {browser.tabs.create({url: "/index.html#import"});window.close();}}>
                        <div className="font-black flex items-center space-x-3"><span className="bg-dark-secondary rounded-full p-2"><BiImport className="text-greenish"/></span> <span>Import wallet</span></div>
                        </div>
                <div className="rounded bg-dark-tertiary border border-dark-tertiary p-3 hover:bg-dark-hoverish select-none cursor-pointer ease-in duration-100" onClick={() => {browser.tabs.create({url: "/index.html#new"});window.close();}}>
                            <div className="font-black flex items-center space-x-3"><span className="bg-dark-secondary rounded-full p-2"><BiWallet className="text-greenish"/></span><span>Create wallet</span></div>
                        </div>
                         {wallets.map((wallet:any) => (
                        <div>
                        <div className={`rounded border ${wallet.address == currentAddress? 'border-greenish' : 'border-dark-tertiary'} p-3 hover:bg-dark-hoverish select-none cursor-pointer ease-in flex duration-100 items-center`} onClick={() => {Armor.setCurrentWallet(wallet);props.reload();props.setShow(false);setCurrentAddress(wallet.address)}}>
                            <div className="grow"><div className="font-black flex items-center"><span>{wallet.name}</span> <div className="text-xs px-2 mx-2 font-light text-gray-500 border border-gray-800 rounded-full">{wallet.network.title}</div></div>
                            <div className="font-mono text-greenish text-sm pt-2">{wallet.address}</div></div>
                            {wallets.length > 1 && <div className="hover:text-red-600 p-2 rounded cursor-pointer h-fit" onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {deleteWallet(wallet);e.stopPropagation();}}>
                            <BsTrashFill/>
                        </div>}
                        </div>
                        </div>))
                    }
                    
            </>
  )
  }

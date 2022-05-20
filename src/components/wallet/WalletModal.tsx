import { MdArrowBack } from "react-icons/md";
import Armor from "../../Armor";

export const WalletModal = (props: {setShow: (s:boolean) => void, show: boolean}) => {
    const wallets = Armor.getWallets();
    return (
        <>
<div className={`absolute top-0 w-screen h-screen bg-black opacity-80 ${props.show? 'hidden sm:block' : 'hidden'}`} onClick={() => {props.setShow(false)}}></div>
        <div className={`absolute top-0 w-screen h-screen sm:relative sm:w-1/3 sm:rounded  sm:h-[400px] sm:drop-shadow-xl sm:mx-auto bg-dark-primary sm:bg-dark-primary ${props.show? '' : 'hidden'} flex flex-col`}>
            <div className="py-2 border-b border-dark-secondary px-3 flex">
                <div className="rounded-full hover:bg-dark-hoverish p-2 cursor-pointer ease-in duration-100" onClick={() => {props.setShow(false)}}><MdArrowBack className="text-2xl"/></div>
                <div className="ml-3 flex items-center justify-center font-black">Select a wallet</div>
            </div>
            <div className="space-y-2 py-3 px-3 flex flex-col h-max overflow-y-auto">
                {wallets.map((wallet) => (
                    <div className="rounded border border-dark-tertiary p-3 hover:bg-dark-hoverish select-none cursor-pointer ease-in duration-100">
                        <div className="font-black">{wallet.name}</div>
                        <div className="font-mono text-greenish text-sm pt-2">{wallet.address}</div>
                    </div>
                ))}
            </div>
        </div>
        </>
    );
}

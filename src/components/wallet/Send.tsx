import { useState } from "react";
import Armor from "../../Armor";
import { Button } from "../ui/Button";

export const Send = () => {
    const currentWallet = Armor.currentWallet()
    const [recipients, setRecipients] = useState([])
    return (
        <div>
            <div className="py-1">
                <div className="text-gray-300 text-sm">Sender</div>
                <div className="font-mono text-greenish py-2">{currentWallet.address}</div>
            </div>
            <div className="py-1">
                <div className="text-gray-300 text-sm py-1">Recipient</div>
                <div className="flex "><input type="text" className="bg-dark-secondary dark:bg-dark-tertiary rounded-tl dark:text-white dark:border-0 px-3 py-2 w-72 mt-1 text-white" /><Button className="text-center rounded-none border-l border-gray-800 rounded-tr mt-1" disabled>Add</Button></div>
                <div className="py-2 bg-dark-tertiary rounded-b border-t border-gray-800">
                    {recipients.length == 0 && <div className="text-center text-gray-400">No recipients added</div> }
                </div>
            </div>
            <div className="py-3">
                <div className="text-gray-300 text-sm">Vendorfield (optional)</div>
                <textarea className="w-full p-3 mt-2 h-24 bg-dark-secondary rounded-lg outline-greenish" />
                <div className="text-gray-400 text-xs text-right">115/255 characters</div>
            </div>
            <div className="py-3">
            <div className="text-gray-300 text-sm">Fee</div>
            </div>
            <div className="py-3 px-16">
                <Button className="text-center">Send</Button>
            </div>
        </div>
    );
}

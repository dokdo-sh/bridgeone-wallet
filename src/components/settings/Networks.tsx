import { BsLockFill } from "react-icons/bs";
import { MdArrowBack } from "react-icons/md";
import Armor from "../../Armor";
import { Button } from "../ui/Button";

export const Networks = (props: {goBack: () => void}) => {
    return (
        <div>
            <div className="border-b border-dark-tertiary px-3 flex items-center">
                <div className="rounded-full hover:bg-dark-hoverish p-2 cursor-pointer ease-in duration-100 h-fit" onClick={() => {props.goBack()}}><MdArrowBack className="text-2xl"/></div>
                <div className="font-black text-3xl px-5 py-8 grow">Networks</div>
                <div><Button>Add</Button></div>
            </div>
            <div className="py-3 px-3 space-y-2">
                {Armor.defaultNetworks.map((network) => (
                    <div className="py-3 px-6 border border-dark-tertiary rounded select-none hover:bg-dark-hoverish">
                        <div className="font-black text-lg">{network.title} <BsLockFill className="inline-block text-sm pb-1 text-gray-400"/></div>
                        <div>via <div className="text-greenish inline-block">{network.api_url}</div> </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

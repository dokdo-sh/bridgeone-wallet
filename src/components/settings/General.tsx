import { MdArrowBack } from "react-icons/md";
import { Button } from "../ui/Button";

export const General = (props: {goBack: () => void}) => {
    return (
        <div>
            <div className="border-b border-dark-tertiary px-3 flex items-center">
                <div className="rounded-full hover:bg-dark-hoverish p-2 cursor-pointer ease-in duration-100 h-fit" onClick={() => {props.goBack()}}><MdArrowBack className="text-2xl"/></div>
                <div className="font-black text-3xl px-5 py-8 ">General</div>
            </div>
            <div className="px-2">
                {/* <div className="py-3">
                    <div className="text-gray-300 text-sm">Conversion currency</div>
                </div> */}
                <div className="py-3">
                    <div className="text-gray-300 text-sm">Reset wallet</div>
                </div>
                <div> <Button>Reset wallet</Button> </div>
            </div>
        </div>
    );
}

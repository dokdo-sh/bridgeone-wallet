import { MdArrowBack } from "react-icons/md";

export const About = (props: {goBack: () => void}) => {
    return (
        <div>
            <div className="border-b border-dark-tertiary px-3 flex items-center">
                <div className="rounded-full hover:bg-dark-hoverish p-2 cursor-pointer ease-in duration-100 h-fit" onClick={() => {props.goBack()}}><MdArrowBack className="text-2xl"/></div>
                <div className="font-black text-3xl px-5 py-8 ">About</div>
            </div>
            <div className="mx-auto w-fit py-4"><img src="/full_logo.png" className="w-60 mx-auto" alt="" /></div>
            <div className="text-center font-black">Solar Browser Wallet </div>
            <div className="text-center text-xs py-2">Made by Bridge One for Solar</div>
            <div className="py-6 text-gray-300 text-center">
                Solar.org
            </div>
        </div>
    );
}

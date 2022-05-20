import { MdArrowBack } from "react-icons/md";

export const About = (props: {goBack: () => void}) => {
    return (
        <div>
            <div className="border-b border-dark-tertiary px-3 flex items-center">
                <div className="rounded-full hover:bg-dark-hoverish p-2 cursor-pointer ease-in duration-100 h-fit" onClick={() => {props.goBack()}}><MdArrowBack className="text-2xl"/></div>
                <div className="font-black text-3xl px-5 py-8 ">About</div>
            </div>
            <div className="mx-auto w-fit py-8"><img src="/full_logo.png" className="w-40 mx-auto" alt="" /></div>
            <div className="text-center font-black">Armor Wallet is the best bla bla</div>
            <div className="text-center text-xs py-2">Published under GNU General Public License version 2.0</div>
            <div className="py-3 text-center flex flex-col space-y-2 text-greenish">
                <a href="#" className="hover:underline">Visit our website</a>
                <a href="#" className="hover:underline">Support</a>
                <a href="#" className="hover:underline">Privacy terms</a>
            </div>
            <div className="py-6 text-gray-300 text-center">
                Armor Wallet 2022
            </div>
        </div>
    );
}

import { ReactChild } from "react";
import { MdArrowBack } from "react-icons/md";

export const Modal = (props: {setShow: (s:boolean) => void, show: boolean, children?: ReactChild, title:string}) => {
    return (
        <>
        <div className={`absolute top-0 left-0 z-10 w-screen h-screen bg-black opacity-80 ${props.show? 'hidden sm:block' : 'hidden'}`} onClick={() => {props.setShow(false)}}></div>
        <div className={`absolute top-0 w-screen h-screen sm:w-1/3 sm:rounded  sm:h-2/3 sm:drop-shadow-xl sm:m-auto bg-dark-primary sm:bg-dark-primary ${props.show? '' : 'hidden'} flex flex-col z-50 sm:absolute sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2`}>
            <div className="py-2 border-b border-dark-secondary px-3 flex">
                <div className="rounded-full hover:bg-dark-hoverish p-2 cursor-pointer ease-in duration-100" onClick={() => {props.setShow(false)}}><MdArrowBack className="text-2xl"/></div>
                <div className="ml-3 flex items-center justify-center font-black">{props.title}</div>
            </div>
            <div className="space-y-2 py-3 px-3 flex flex-col h-max overflow-y-auto">
                {props.children}
            </div>
        </div>
        </>
    );
}

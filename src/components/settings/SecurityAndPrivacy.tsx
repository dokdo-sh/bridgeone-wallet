import { useState } from "react";
import { MdArrowBack } from "react-icons/md";
import { Switch } from "../ui/Switch";

export const SecurityAndPrivacy = (props: { goBack: () => void }) => {
  
  return (
    <div>
      <div className="border-b border-dark-tertiary px-3 flex items-center">
        <div
          className="rounded-full hover:bg-dark-hoverish p-2 cursor-pointer ease-in duration-100 h-fit"
          onClick={() => {
            props.goBack();
          }}
        >
          <MdArrowBack className="text-2xl" />
        </div>
        <div className="font-black text-3xl px-5 py-8 ">
          Security and privacy
        </div>
      </div>
      <div className="px-2">
        <div className="py-3">
          <div className="text-gray-300 text-sm">
            Send anonymous data to improve Armor
          </div>
          <Switch/>
        </div>
      </div>
    </div>
  );
};

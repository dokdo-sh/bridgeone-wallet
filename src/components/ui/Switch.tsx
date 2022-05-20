import { useState } from "react";

export const Switch = () => {
    const [toggle, setToggle] = useState(true);
    return (
        <div
            className={`md:w-14 md:h-7 w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ease-in duration-200 ${
              toggle ? "bg-greenish" : "bg-gray-300"
            }`}
            onClick={() => setToggle(!toggle)}
          >
            <div
              className={`bg-white md:w-6 md:h-6 h-5 w-5 rounded-full shadow-md transform ease-in duration-200 ${
                toggle ? "transform translate-x-5" : ""
              }`}
            ></div>
          </div>
    );
}

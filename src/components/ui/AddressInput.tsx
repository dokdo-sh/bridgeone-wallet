import { useEffect, useState } from "react";
import { BsCheckCircleFill, BsFillDashCircleFill } from "react-icons/bs";
import Armor, { Network } from "../../Armor";
import solar from "../../wallets/solar";
export const AddressInput = (props: {onChange: (text:string) => void, onBlur?: () => {}, value:string, search?: boolean, network? : Network, validate?: (v:boolean) => void}) => {
const [valid, setValid] = useState(false);
    async function validateAddress(address:string) : Promise<boolean> {
          let cw = await Armor.currentWallet()
            return solar.validateAddress(address, props.network? props.network : cw.network);
    }

    useEffect(() => {
        if (props.validate) {
            validateAddress(props.value).then((isValid:boolean) => {
                props.validate(isValid);
            })
        }
    }, [props.network])

    useEffect(() => {
        if (props.validate) {
            validateAddress(props.value).then((isValid:boolean) => {
                props.validate(isValid);
            })
        }
    }, [props.value])

    function updateValidate (addr:string) {
        validateAddress(addr).then((v:boolean) => {
            setValid(v);
        })
    }

    return (
        <div className="bg-dark-secondary w-full dark:bg-dark-tertiary rounded flex items-center">
            <div className="w-8 items-center">{valid? <BsCheckCircleFill className="mx-auto text-greenish"/> : <BsFillDashCircleFill className="mx-auto text-red-400"/> }</div>
            <input
            type="text"
            className={`bg-transparent w-full outline-none dark:text-white dark:border-0 px-1 py-2 w-full  text-sm $`}
            value={props.value}
            placeholder="Paste address or search contacts"
            onBlur={props.onBlur}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateValidate(e.currentTarget.value)
                props.onChange(e.currentTarget.value)
              }}
          />
        </div>
    );
}

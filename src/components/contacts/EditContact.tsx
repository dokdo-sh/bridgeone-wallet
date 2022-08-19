import { useEffect, useState } from "react";
import Armor, { Contact, SolarMainnet } from "../../Armor";
import { AddressInput } from "../ui/AddressInput";
import { Button } from "../ui/Button";

export const EditContact = (props: {contact:Contact, setShow: (s:boolean) => void}) => {

    const [name, setName] = useState(props.contact? props.contact.name : '')
    const [address, setAddress] = useState(props.contact? props.contact.address : '')
    const [network, setNetwork] = useState(props.contact? props.contact.network : SolarMainnet);
    const [validAddress, setValidAddress] = useState(false);
    const [edit, setEdit] = useState(false);

    useEffect(() => {
        setAddress(props.contact? props.contact.address : '');
         setNetwork(props.contact? props.contact.network : SolarMainnet)
        setEdit(props.contact? true: false);
        }, [props.contact])

    return (
        <div>
            <div className="py-3">
                <div className="text-gray-300 text-sm">Name</div>
                <div className="flex"><input type="text" className="rounded bg-dark-secondary dark:bg-dark-secondary dark:text-white dark:border-0 px-3 py-2 w-72 mt-1 text-white" placeholder="Name of the contact" value={props.contact? props.contact.name : name } onChange={(event: React.ChangeEvent<HTMLInputElement>) => {if (!edit) {setName(event.currentTarget.value)}}} /></div>
            </div>
            <div className="py-3">
                <div className="text-gray-300 text-sm">Address</div>
                <AddressInput onChange={(t:string) => {if (!edit) {setAddress(t)}}} value={address} network={network} validate={setValidAddress}/>
            </div>
            <div className="py-3">
                <div className="text-gray-300 text-sm">Network</div>
                <div className="flex px-3 pt-2">
                {Armor.defaultNetworks.map((n) => (
                    <div className={`border text-xs border-dark-secondary py-1 px-2 rounded-full cursor-pointer hover:bg-dark-greenish ${network.title == n.title? 'bg-greenish' : ''}`} onClick={() => {if (!edit) {setNetwork(n)}}}>{n.title}</div>
                ))}
            </div>
            </div>
            {!edit && <div className="flex py-5"><Button disabled={!(network.title && name.length > 0 && validAddress)} onClick={() => {Armor.contacts.add({name:name, network:network, address:address}).then(() => {props.setShow(false);}); setAddress("");setName("");}}>Save</Button></div>}
        </div>
    );
}

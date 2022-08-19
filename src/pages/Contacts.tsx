import { Button } from "../components/ui/Button";
import {AiOutlineUserAdd} from 'react-icons/ai'
import { BsPen, BsPencil, BsPencilFill, BsTrashFill } from "react-icons/bs";
import { useEffect, useState } from "react";
import { Modal } from "../components/ui/Modal";
import { EditContact } from "../components/contacts/EditContact";
import {Armor, Contact} from "../Armor";
export const Contacts = (props: {goTo: (page:string) => void}) => {
    const [showEdit, setShowEdit] = useState(false)
    const [contacts, setContacts] = useState(undefined)
    const [edit, setEdit] = useState(undefined);
    const [search, setSearch] = useState("");
    const [selectedNetwork, selectNetwork] = useState(undefined);

    useEffect(() => {
        loadContacts()
        
    }, [])

    function loadContacts() {
        Armor.contacts.all().then((contacts) => {
            setContacts(contacts)
        })
    }

    useEffect(() => {
        loadContacts()
        
    }, [showEdit])

    return (
        <div>
            <div className="flex">
            <div className="font-black text-3xl p-5">Contacts</div>
            <div className="grow"></div>
            <Button className="w-fit m-5" onClick={() => {setEdit(null); setShowEdit(true)}}><AiOutlineUserAdd className="text-xl"/></Button>
            </div>
            <div className="px-3">
            <input type="text" className="rounded bg-dark-secondary dark:bg-dark-secondary dark:text-white dark:border-0 px-3 py-2 w-full mt-1 text-white" placeholder="Search for a contact" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}/>
            </div>
            <div className="flex px-3 pt-2 space-x-2">
            <div className={`border text-xs border-dark-secondary py-1 px-2 rounded-full cursor-pointer hover:bg-dark-greenish ${selectedNetwork == undefined? 'bg-greenish' : ''}`} onClick={() => {selectNetwork(undefined)}}>All</div>
                {Armor.defaultNetworks.map((network) => (
                    <div className={`border text-xs border-dark-secondary py-1 px-2 rounded-full cursor-pointer hover:bg-dark-greenish ${selectedNetwork == network? 'bg-greenish' : ''}`} onClick={() => {selectNetwork(network)}}>{network.title}</div>
                ))}
            </div>
            <div className="">
            <div className="py-3 px-3 space-y-2 overflow-y-auto h-[360px]">
                 {contacts && contacts.length == 0 && 
                    <div className="m-2 p-3 rounded bg-dark-tertiary text-center">
                        No contacts added
                    </div>
                 }
                 {contacts && contacts.map((contact:Contact) => {
                     if (((search != "" && contact.name.search(new RegExp(search, 'i')) > -1) && (((selectedNetwork != undefined && contact.network == selectedNetwork)) || selectedNetwork == undefined)) || search == "" && (((selectedNetwork != undefined && contact.network.title == selectedNetwork.title)) || selectedNetwork == undefined)) {
                        return <div className="rounded border border-dark-tertiary hover:bg-dark-hoverish p-3 select-none flex items-center cursor-pointer" onClick={() => {setEdit(contact); setShowEdit(true)}} key={contact.address}>
                        <div className="grow"><div>{contact.name}</div>
                        <div className="font-mono text-greenish text-sm">
                            {`${(contact.address).substring(0,10)}...${(contact.address).substring(24)}`}
                            </div></div>
                        <div className="hover:bg-red-600 p-2 rounded cursor-pointer" onClick={(e:any) => {Armor.contacts.delete(contact.address).then(() => {loadContacts()});e.stopPropagation()}}>
                            <BsTrashFill/>
                        </div>
                    </div>
                     } 
                })}
            </div>

            </div>
            <Modal show={showEdit} setShow={setShowEdit} title={edit? "Edit contact" : "New contact"}>
                <EditContact contact={edit} setShow={setShowEdit} />
            </Modal>
        </div>
    );
}

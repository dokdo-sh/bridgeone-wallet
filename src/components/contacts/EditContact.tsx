import { Contact } from "../../Armor";
import { Button } from "../ui/Button";

export const EditContact = (props: {contact:Contact}) => {
    return (
        <div>
            <div className="py-3">
                <div className="text-gray-300 text-sm">Name</div>
                <div className="flex"><input type="text" className="rounded bg-dark-secondary dark:bg-dark-secondary dark:text-white dark:border-0 px-3 py-2 w-72 mt-1 text-white" placeholder="Name of the contact" value={props.contact? props.contact.name : ''} /></div>
            </div>
            <div className="py-3">
                <div className="text-gray-300 text-sm">Address</div>
                <div className="flex"><input type="text" className="rounded bg-dark-secondary dark:bg-dark-secondary font-mono dark:text-white dark:border-0 px-3 py-2 w-full mt-1 text-white" placeholder="Address of the contact" value={props.contact? props.contact.address : ''}/></div>
            </div>
            <div className="flex py-5"><Button>Save</Button></div>
        </div>
    );
}

import Big from "big.js";
import { useEffect, useState } from "react";
import { BsTrashFill } from "react-icons/bs";
import Armor, { Contact } from "../../Armor";
import solar from "../../wallets/solar";
import { AddressInput } from "../ui/AddressInput";
import { Button } from "../ui/Button";

export const Recipients = (props: {onChange?: (recipients:Array<{address:string, amount:string}>) => void}) => {
  const [recipients, setRecipients] = useState([]);
  const [contacts, setContacts] = useState(undefined);
  const [search, setSearch] = useState("");
  const [show_search, setShowSearch] = useState(false);
  const [amount, setAmount] = useState("");
  const [addEnabled, setAddEnabled] = useState(false);
  const [balance, setBalance] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);

  const [currentWallet, setCurrentWallet] = useState(undefined)

  useEffect(() => {
  
    Armor.currentWallet().then((cw:solar) => {
      setCurrentWallet(cw);
      cw.getBalance().then((bal:number) => {
        setBalance(bal/100000000)
        setCurrentBalance(bal/100000000)
    })
  });
  
  }, [])

  useEffect(() => {
    props.onChange(recipients)
    let cB = balance;
    recipients.map((recip) => {
      cB -= recip.amount
    })
    setCurrentBalance(cB)
  }, [recipients])

  function addRecipient() {
    setRecipients(recipients.concat([{ address: search, amount: amount }]));
  }

  function removeRecipient(address: string) {
    setRecipients(
      recipients.filter((recipient: { address: string; amount: string }) => {
        return recipient.address != address;
      })
    );
  }

  function changeSearch(text: string) {
    validateFields(text, amount);
    setSearch(text);
     Armor.contacts.all().then((contacts:Contact[]) => {
      let _contacts = contacts.filter((contact) => {
        if (contact.name.search(new RegExp(text, "i")) > -1) return contact;
      });
        setContacts(text.length > 0 ? _contacts : []);
       setShowSearch(_contacts.length > 0);
    })
  }

  function validateFields(text: string, amount: string) {
      let bsa = solar.validateAddress(text, currentWallet.network) &&
      !isNaN(parseFloat(amount)) &&
      Number(amount) > 0 &&
      Number(amount) <= currentBalance
      setAddEnabled(bsa);
  }

  if (currentWallet) {return (
    <div>
      <div className="py-2 bg-dark-tertiary px-2 rounded-lg">
        <div className="text-gray-300 text-sm py-1">Address</div>
        <div className="flex ">
          <AddressInput
            onBlur={() =>
              setTimeout(() => {
                setShowSearch(false);
              }, 100)
            }
            onChange={(text) => {
              changeSearch(text);
            }}
            value={search}
          />
        </div>
        {contacts && contacts.length > 0 && show_search && (
          <div className="px-2">
            <div className="absolute max-h-[150px] overflow-y-scroll rounded-b bg-dark-tertiary drop-shadow-xl py-2 left-2 right-2">
              <div className="text-sm text-gray-400 px-3">Contacts</div>{" "}
              {contacts &&
                contacts.map((contact: Contact) => (
                  <div
                    className=" border border-dark-tertiary hover:bg-dark-hoverish px-3 py-1 select-none flex items-center cursor-pointer"
                    key={contact.address}
                    onClick={() => {
                      changeSearch(contact.address);validateFields(contact.address,amount)
                    }}
                  >
                    <div className="grow">
                      <div>{contact.name}</div>
                      <div className="font-mono text-greenish text-sm">
                        {`${contact.address.substring(
                          0,
                          10
                        )}...${contact.address.substring(24)}`}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        <div className="text-gray-300 text-sm py-1">Amount</div>
        <input
          type="text"
          value={amount.toString()}
          placeholder={"0"}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setAmount(e.currentTarget.value);
            validateFields(search, e.currentTarget.value);
          }}
          className="bg-dark-secondary dark:bg-dark-tertiary rounded dark:text-white dark:border-0 px-3 py-2 w-36 mt-1 text-white text-center text-sm"
        />{" "}
        <span className="font-black text-sm text-greenish hover:underline cursor-pointer" onClick={() => {setAmount((currentBalance).toString())}}>
          max
        </span>
        <span className="pl-2 text-gray-400 text-xs">({(currentBalance).toLocaleString()} available)</span>
        <div ></div>
        <div className="pt-4">
          <Button
            className={`w-fit py-1 px-2`}
            disabled={!addEnabled}
            onClick={() => {
              if (addEnabled) {
                addRecipient();
                changeSearch("");
                setAmount("0");
              }
            }}
          >
            Add recipient
          </Button>
        </div>
      </div>
      <div className="py-4">
        <div className="text-gray-300 text-sm pb-2">Recipient(s)</div>
        {recipients.length == 0 && (
          <div className="py-2 text-gray-200 rounded bg-dark-hoverish opacity-30 text-center">
            Please add at least one recipient
          </div>
        )}
        {recipients.length > 0 && (
          <div className="">
            {recipients.map((recipient) => (
              <div className="text-xs py-2 rounded border hover:bg-dark-tertiary select-none border-dark-secondary my-1 px-2 flex">
                <div className="grow">
                  <div>
                    Recipient:{" "}
                    <span className="text-greenish">{recipient.address}</span>
                  </div>{" "}
                  <div>Amount: {recipient.amount} SXP</div>
                </div>
                <div
                  className="flex items-center px-2 opacity-50 rounded hover:bg-red-800 hover:opacity-100"
                  onClick={() => {
                    removeRecipient(recipient.address);
                  }}
                >
                  <BsTrashFill />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );} else {
    return <div></div>
  }
}

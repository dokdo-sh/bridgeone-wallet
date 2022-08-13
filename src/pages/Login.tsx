import { useState } from "react";
import Armor from "../Armor";
import { Button } from "../components/ui/Button";
declare var browser: any;
export function Login(props: { goTo: (page: string) => void }) {
  const [wrongPassword, setWrongPassword] = useState(false);
  const [password, setPassword] = useState("");

  function login() {
    Armor.login(password).then((value:boolean) => {
      if (value == true) {
        Armor.getWallets().then((w:any) => {
          
          if (w.wallets && w.wallets.length > 0) {
            props.goTo("wallet");
          } else {
            browser.tabs.create({url: "/index.html#welcome"})
          }
        })
      } else {
        setWrongPassword(true);
      }
    })
  }

    return (
        <div>
          <div className="py-16"></div>
          <img src="/isotype_circle.png" className="w-24 mx-auto" alt="" />
          <div className=" text-3xl font-black mt-6 text-center">Welcome Back!</div>
            <div className="w-fit mx-auto py-16">
            Password
            <br />
            <input
        type="password"
        maxLength={64}
        className="rounded bg-dark-secondary dark:bg-dark-secondary dark:text-white dark:border-0 px-3 py-2 w-72 mt-1 text-white"
        value={password}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {setPassword(event.currentTarget.value)}}
        onKeyPress={(ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            login()
          }
        }}
      />
            </div>
            {wrongPassword && <div className="w-fit py-4 mx-auto text-center text-red-400">Wrong password</div>}
      <div className="px-16">
      <Button className="text-center sm:w-fit sm:px-16 sm:mx-auto" onClick={() => {
          login()
        }}>Unlock</Button>
      </div>
        </div>
    )
}
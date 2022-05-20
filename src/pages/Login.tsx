import { Button } from "../components/ui/Button";

export function Login(props: { goTo: (page: string) => void }) {
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
      />
            </div>
      <div className="px-16">
      <Button className="text-center sm:w-fit sm:px-16 sm:mx-auto" onClick={() => {
          props.goTo("wallet");
        }}>Unlock</Button>
      </div>
        </div>
    )
}
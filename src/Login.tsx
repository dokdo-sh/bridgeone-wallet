export function Login(props: { goTo: (page: string) => void }) {
    return (
        <div>
            Enter your password:
            <br />
            <input
        type="password"
        maxLength={64}
        className="rounded bg-white dark:bg-dark-secondary dark:text-white dark:border-0 px-3 border border-gray-300 py-1 sm:w-96 mt-1 text-black"
      />
      <div
        className="p-2 bg-greenish text-white rounded w-fit"
        onClick={() => {
          props.goTo("wallet");
        }}
      >
        Go
      </div>
        </div>
    )
}
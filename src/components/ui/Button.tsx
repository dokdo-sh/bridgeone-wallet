export const Button = (props: {children?: any, disabled?: boolean, onClick?: () => void, className? : string}) => {
    return (
        <div className={`px-6 py-2 rounded-full ${props.disabled? 'bg-dark-secondary' : 'bg-greenish hover:bg-dark-greenish cursor-pointer'} select-none  ease-in duration-100  ${props.className}`} onClick={props.onClick}>
            {props.children}
        </div>
    );
}

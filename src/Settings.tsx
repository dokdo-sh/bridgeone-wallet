import React from 'react';

export function Settings(props: {goTo: (page:string) => void}) {
    return (
        <div>
            Hello
            <div className="p-2 bg-greenish text-white rounded" onClick={() => props.goTo("wallet")}>Go to wallet</div>
        </div>
    )
}
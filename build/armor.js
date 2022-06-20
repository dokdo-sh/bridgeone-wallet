
window.logged = false;

browser.browserAction.onClicked.addListener(() => {
    browser.storage.local.get("login").then((value) => {
        if (!value.login) {
            browser.tabs.create({url: "/index.html#welcome"});
        } else {
            browser.browserAction.setPopup({popup: "/index.html"}).then(() => {
                browser.browserAction.openPopup();
            })            
        }
    })
});

browser.runtime.onMessage.addListener(function(request, sender) {
    console.log(request);
    if (request.transaction && request.url) {
        console.log(request.transaction)
        sendTransaction(request.transaction,request.url)
    }
  });

  function sendTransaction(json, url) {
    console.log("Sending tx now!");
        fetch(url+"transactions", {
            method: 'POST',
            body: json,
            headers: {
                'Content-Type': 'application/json'
              },
        }).then((response) => {return response.json()})
        .then((json) => {
            if (json.data && json.data.accept.length > 0) {
                browser.notifications.create("transaction", {
                    "type": "basic",
                    "iconUrl": browser.runtime.getURL("isotype_square.png"),
                    "title": "Transaction confirmed!",
                    "message": `${json.data.accept[0]} has been accepted!`,
                  });
            } else {
                browser.notifications.create("transaction", {
                    "type": "basic",
                    "iconUrl": browser.runtime.getURL("isotype_square.png"),
                    "title": "Transaction rejected!!",
                    "message": "Your transaction has been rejected",
                  });
            }
    })
    .catch(() => {
        browser.notifications.create("transaction", {
            "type": "basic",
            "iconUrl": browser.runtime.getURL("isotype_square.png"),
            "title": "Transaction failed :(",
            "message": "There was an error sending the transaction",
          });
    })
  } 

browser.browserAction.onClicked.addListener(() => {
    browser.storage.local.get("login").then((value) => {
        if (!value.login) {
            browser.tabs.create({url: "/index.html"});
        } else {
            
            browser.browserAction.openPopup();
        }
    })
    
});
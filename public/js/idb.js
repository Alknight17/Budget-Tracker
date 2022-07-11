let idb;
const request = indexedDB.open("budget", 1);


request.onupgradeneeded = ((e) => {
    const idb = e.target.result;
    idb.createObjectStore("pending", { autoIncrement: true });
});


request.onsuccess = ((e) => {
    idb = e.target.result;
    if (navigator.onLine) {
        checkDatabase();
    }
});


request.onerror = ((e) => {
    console.log("Oh No!" + e.target.errorCode);
});

// if app is offline, save all pending transactions
saveRecord((record) => {
    const transaction = idb.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    store.add(record);
})

// if app is online, get all pending transactions and move them into the db
checkDatabase(() => {
    const transaction = idb.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    const getAll = store.getAll();

    getAll.onsuccess = (() => {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(() => {
                const transaction = idb.transaction(["pending"], "readwrite");
                const store = transaction.objectStore("pending");
                store.clear();
            });
        }
        deletePending(() => {
            const transaction = db.transaction(["pending"], "readwrite");
            const store = transaction.objectStore("pending");
            store.clear();
        });
    });
});


// check to see if app is online
window.addEventListener("online", checkDatabase);
When first running the app with capacitor locally on my Pixel device there would be errors everytime there was an interaction with the database.

> Evaluating the object store's key path did not yield a value.\n DataError: Failed to execute 'add' on 'IDBObjectStore': Evaluating the object store's key path did not yield a value."

After inspecting the IndexedDB eventually realised that it was not setup to use auto-generated primary keys. After much Googling I eventually [these docs](https://dexie.org/cloud/docs/cli#capacitor--quasar-apps) on the Dexie website which resolved the issue by whitelisting the host of the webview.

I believe this allows it to do an initial sync with the Dexie Cloud server which results in the primary key being setup properly but this is odd as I would expect it to work fully offline. To be clear at this point the Dexie Cloud addon is installed but there is no sign-in to the sync service.

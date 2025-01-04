# TLDR

The `wayfinderOrder.order` column should not have been set as a unique key because clients can end up using the same value independently which breaks when they sync.

# Detail

A new wayfinderOrder record was being synced from another client.

```
id: tds0PG3QbVxCOSDw5|4CyFT3KQbcom
order: aaaaaaaaaaaaaaaaaaaan
```

But there was already an existing record with this `order` value.

```
id: tds0PGKMorIU_LtltNjCXTzY4LUcom
order: aaaaaaaaaaaaaaaaaaaan
```

Dexie's `SyncState.error` message was

> Sync error: $wayfinderOrder.bulkPut(): 1 of 6 operations failed. Errors: ConstraintError: Unable to add key to index 'order': at least one key does not satisfy the uniqueness requirements.

And you can see the new record listed as an upsert in the JSON response from `POST https://zy0myinc2.dexie.cloud/sync`.

```js
{
    "changes": [
        {
            "table": "todos",
            "muts": [
                {
                    "type": "update",
                    "keys": [
                        "tds0PFp_0Nc6sAhIIeudILXIacbcom",
                        "tds0PGKMorIU_LtltNjCXTzY4LUcom",
                        "tds0PGcV6DOlpD_oV_ho|mp_w1ocom",
                        "tds0PGcVFAjh4iTUxhL6Dz9pB0Ecom",
                        "tds0PGcVJIUMy555ThicJmqK|LOcom",
                        "tds0PGcVKhU01xsHoc9tqlyPFMNcom",
                        "tds0PGhVNHg|1E5Ae2|U5D22cAncom",
                        "tds0PGht7P4I0SL965E8BjqBimCcom",
                        "tds0PFAF__CtGS202CfbvmcD26Tcom"
                    ],
                    "changeSpecs": [
                        {
                            "completedAt": {
                                "$t": "Date",
                                "v": "2025-01-02T14:48:39.408Z"
                            }
                        },
                        {
                            "createdAt": {
                                "$t": "Date",
                                "v": "2024-12-29T21:38:31.442Z"
                            }
                        },
                        {
                            "createdAt": {
                                "$t": "Date",
                                "v": "2025-01-02T14:47:30.903Z"
                            }
                        },
                        {
                            "createdAt": {
                                "$t": "Date",
                                "v": "2025-01-02T14:48:07.598Z"
                            },
                            "starRole": {
                                "$t": "undefined"
                            }
                        },
                        {
                            "createdAt": {
                                "$t": "Date",
                                "v": "2025-01-02T14:48:24.478Z"
                            },
                            "starRole": {
                                "$t": "undefined"
                            },
                            "completedAt": {
                                "$t": "Date",
                                "v": "2025-01-02T14:48:26.056Z"
                            }
                        },
                        {
                            "createdAt": {
                                "$t": "Date",
                                "v": "2025-01-02T14:48:30.238Z"
                            },
                            "starRole": {
                                "$t": "undefined"
                            },
                            "completedAt": {
                                "$t": "Date",
                                "v": "2025-01-02T14:48:31.908Z"
                            }
                        },
                        {
                            "createdAt": {
                                "$t": "Date",
                                "v": "2025-01-03T15:55:04.608Z"
                            }
                        },
                        {
                            "createdAt": {
                                "$t": "Date",
                                "v": "2025-01-03T15:54:55.427Z"
                            }
                        },
                        {
                            "completedAt": {
                                "$t": "Date",
                                "v": "2025-01-03T16:05:20.323Z"
                            }
                        }
                    ],
                    "txid": "XctqYbwHLcgR2I8SVwB7UQ=="
                },
                {
                    "type": "upsert",
                    "keys": [
                        "tds0PG3QbVxCOSDw5|4CyFT3KQbcom",
                        "tds0PG3Qh0DTYtSghvVIsxRuYSHcom",
                        "tds0PG3Qm9mTU5vvBEL5paMDFUmcom",
                        "tds0PG3QrUfRHAd7jyYm1Jb0hfocom",
                        "tds0PG3RqGd1BlCxDBBzJSALmHCcom",
                        "tds0PG7qnNUTrF2htAsuRzJYSV6com",
                        "tds0PG7sDdUpDwlV0vF40V6K3Kxcom",
                        "tds0PGX6t|erg5s1mVx5IclDczdcom",
                        "tds0PGXHDF4eH0EvDJCrg4949UHcom",
                        "tds0PGXIY5BGzE0qdofqamnQ6pGcom"
                    ],
                    "values": [
                      'REDACTED'
                    ],
                    "txid": "XctqYbwHLcgR2I8SVwB7UQ=="
                },
                {
                    "type": "delete",
                    "keys": [
                        "tds0P7|4nrWFXrQSBFBtZQn7lDHcom"
                    ],
                    "txid": "XctqYbwHLcgR2I8SVwB7UQ=="
                }
            ]
        },
        {
            "table": "wayfinderOrder",
            "muts": [
                {
                    "type": "upsert",
                    "keys": [
                        "tds0PG3QbVxCOSDw5|4CyFT3KQbcom",
                        "tds0PG3Qm9mTU5vvBEL5paMDFUmcom",
                        "tds0PG7sDdUpDwlV0vF40V6K3Kxcom",
                        "tds0PGX6t|erg5s1mVx5IclDczdcom",
                        "tds0PGXHDF4eH0EvDJCrg4949UHcom",
                        "tds0PGXIY5BGzE0qdofqamnQ6pGcom"
                    ],
                    "values": [
                      'REDACTED'
                    ],
                    "txid": "XctqYbwHLcgR2I8SVwB7UQ=="
                },
                {
                    "type": "update",
                    "keys": [
                        "tds0P6uPmLCuZExyF3qI8CCw1L_com",
                        "tds0PEiEXFBzUc2MEX5RQdVlpaOcom",
                        "tds0PF9waWMc5Nzv0O78sHw_7|Bcom",
                        "tds0PEm7XqxXKSzz2eErQU|DvRdcom",
                        "tds0PDuwVqExdHrv3|s1eAcB27Ccom"
                    ],
                    "changeSpecs": [
                        {
                            "order": "aaaaaaaaaaaaaaaaaaaaaan"
                        },
                        {
                            "order": "aaaaaaaaaaaaaaaaaaat"
                        },
                        {
                            "order": "aaaaaaaaaaaaaaaaaaaw"
                        },
                        {
                            "order": "aaaaaaaaaaaaaaaaaaay"
                        },
                        {
                            "order": "aaaaaaaaaaaaaaaaaabh"
                        }
                    ],
                    "txid": "XctqYbwHLcgR2I8SVwB7UQ=="
                },
                {
                    "type": "delete",
                    "keys": [
                        "tds0P9CoHOkEOZK5ieLPNHYNkcrcom",
                        "tds0P7|4nrWFXrQSBFBtZQn7lDHcom",
                        "tds0PG3QrUfRHAd7jyYm1Jb0hfocom",
                        "tds0PG7qnNUTrF2htAsuRzJYSV6com",
                        "tds0PG3RqGd1BlCxDBBzJSALmHCcom",
                        "tds0PG3Qh0DTYtSghvVIsxRuYSHcom"
                    ],
                    "txid": "XctqYbwHLcgR2I8SVwB7UQ=="
                }
            ]
        }
    ],
    "rejections": [],
    "dbId": "zy0myinc2",
    "realms": [
        "rlm-public",
        "mrdanielmetcalfe@gmail.com"
    ],
    "inviteRealms": [],
    "serverRevision": "1:2087",
    "schema": {
        "lists": {
            "idPrefix": "lst",
            "primaryKey": "type",
            "markedForSync": true,
            "initiallySynced": true
        },
        "roles": {
            "idPrefix": "rls",
            "primaryKey": "[realmId+name]",
            "markedForSync": true,
            "initiallySynced": true
        },
        "todos": {
            "idPrefix": "tds",
            "primaryKey": "id",
            "generatedGlobalId": true,
            "markedForSync": true,
            "initiallySynced": true
        },
        "realms": {
            "idPrefix": "rlm",
            "primaryKey": "realmId",
            "generatedGlobalId": true,
            "markedForSync": true,
            "initiallySynced": true
        },
        "members": {
            "idPrefix": "mmb",
            "primaryKey": "id",
            "generatedGlobalId": true,
            "markedForSync": true,
            "initiallySynced": true
        },
        "settings": {
            "idPrefix": "stt",
            "primaryKey": "key",
            "markedForSync": true,
            "initiallySynced": true
        },
        "starRoles": {
            "idPrefix": "str",
            "primaryKey": "id",
            "generatedGlobalId": true,
            "markedForSync": true,
            "initiallySynced": true
        },
        "importantOrder": {
            "idPrefix": "imp",
            "primaryKey": "todoId",
            "initiallySynced": true
        },
        "starRolesOrder": {
            "idPrefix": "Str",
            "primaryKey": "starRoleId",
            "markedForSync": true,
            "initiallySynced": true
        },
        "wayfinderOrder": {
            "idPrefix": "wyf",
            "primaryKey": "todoId",
            "markedForSync": true,
            "initiallySynced": true
        },
        "$$jobs": {
            "idPrefix": "$jb",
            "initiallySynced": true
        },
        "$$logins": {
            "idPrefix": "$lg",
            "primaryKey": "claims.sub",
            "initiallySynced": true
        },
        "$$baseRevs": {
            "idPrefix": "$bs",
            "primaryKey": "[tableName+clientRev]",
            "initiallySynced": true
        },
        "$$syncState": {
            "idPrefix": "$sy",
            "initiallySynced": true
        }
    },
    "yMessages": []
}
```

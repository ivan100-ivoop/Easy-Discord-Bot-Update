# Easy-Discord-Bot-Update
Simple Framework to build your own discord bot!
Updated Version of Easy-Discord-Bot supporting yml.

## Deployment

|      info         |         command         |
| ------------------|-------------------------|
|    install pkg    |       npm install       |
|        run        |      node index.js      |
|        run        |       npm run start     |
|        run        |           node .        |

## /config/config.json
```yml
settings:
    notify: false
    textcommand_prefix: "!" 
    token: "<bot_token>" 
    guilds:
        "<server_id>":
            name: "Макси"
            log_channel: "<log_channel_id>"
            owners: 
            - "<owner_id>"
            roles:
                staff: 
                - "<staff_role>"
                blacklisted: [] #"<blacklisted_role_id>"
    client:
        id: "<bot_client_id>"
        secret: "<bot_client_secret>"
```

## Useful Links
[Easy-Discord-Bot](https://github.com/ivan100-ivoop/Easy-Discord-Bot)

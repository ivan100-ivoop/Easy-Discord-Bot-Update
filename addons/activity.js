const { ActivityType } = require('discord.js');
const { Type } = require('./../framework/utils/Types');

module.exports = async (client) => {
    const { enabled, type, message } = client.get("activity", Type.File);

    if(!enabled) return;

    switch (type) {
        case 'playing':
            client.user.setActivity((message ? message : "Minecraft"), { type: ActivityType.Playing });
            break;
        case 'listening':
            client.user.setActivity((message ? message : "Spotify"), { type: ActivityType.Listening});
            break;
        case 'competing':
            client.user.setActivity((message ? message : "Sync"), { type: ActivityType.Competing});
            break;
        default:
            client.user.setActivity((message ? message : "For Commands"), { type: ActivityType.Watching});
            break;
    }
}
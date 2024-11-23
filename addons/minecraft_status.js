const { Type } = require('./../framework/utils/Types');
const axios = require("axios");
const { EmbedBuilder } = require('discord.js');
const ms = require('ms');


const update = async (client) => {
    let files = [], info = "";
    const colors = client.get("colors", Type.File);
    const { title, web, updateTime, list, present, timestamp, footer_icon, footer } = client.get("minecraft_status", Type.File);


    for (const key of Object.keys(list)) {
        const server = list[key]

        if (server.ip != "") {

            const response = await axios.get(`https://api.mcstatus.io/v2/status/${(server.isBedrock ? "bedrock" : "java")}/${server.ip}:${server.port}`)
                .then(res => (res.status === 200) ? res.data : "ERR:" + res.status)
                .catch(err => err.message);

            if (response instanceof String) {
                info = `
${present.host} ${(server.address ? server.address : `${server.ip}:${server.port}`)}
${present.status} ${(response == "ERR:404" ? present.state.error : present.state.offline)}
${present.online} 0 / 0
${present.version} ${server.support}
`;
            } else {
                const isOnline = response.online || false;
                const online = [
                    response.players?.online || 0,
                    response.players?.max || 0
                ];
                info = `
${present.host} ${(server.address ? server.address : `${server.ip}:${server.port}`)}
${present.status} ${(isOnline ? present.state.online : present.state.offline)}
${present.online} ${online[0]} / ${online[1]}
${present.version} ${server.support}
`;
            }
            files.push({ name: server.title, value: `\`\`\`\n${info}\`\`\``, inline: false });
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`**${title}**`)
        .setColor(colors.success)
        .setURL(web)
        .addFields(files);

    if (footer) {
        if (timestamp) {
            embed.setTimestamp();
        }

        if (present.timer) {
            const timer = present.timer.includes("%s") ? present.timer.replaceAll("%s", ms(updateTime)) : `Updating every ${ms(updateTime)}`;

            if (footer_icon) {
                const icon = (footer_icon instanceof String) ? footer_icon : `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png`;
                embed.setFooter({ text: timer, iconURL: icon });
            } else {
                embed.setFooter({ text: timer });
            }

        }
    }

    return embed;
}

const checkOrSend = async (client, data) => {
    const { log_channel } = client.get("minecraft_status", Type.File);
    const channel = await client.channels.cache.get(log_channel);

    if (!channel) {
        client.log.error("Log channel not found!");
        return;
    }

    let message;
    try {
        const messages = await channel.messages.fetch({ limit: 1 });
        message = messages.filter(m => m.author.id === client.user.id).last();
    } catch (err) {
        client.log.error("Error fetching messages:", err);
    }

    if (!message) {
        await channel.send({ embeds: [data] });
    } else {
        await message.edit({ embeds: [data] });
    }
};

module.exports = async (client) => {
    let embed;
    const { enabled, updateTime } = client.get("minecraft_status", Type.File);

    if (!enabled) return;

    embed = await update(client);

    await checkOrSend(client, embed);

    setInterval(async () => {

        if (enabled) {
            embed = await update(client);
            await checkOrSend(client, embed);
        }

    }, updateTime);
}
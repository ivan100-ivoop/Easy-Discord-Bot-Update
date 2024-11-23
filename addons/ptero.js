const { Type } = require('./../framework/utils/Types');
const axios = require("axios");
const { EmbedBuilder } = require('discord.js');
const ms = require('ms');

const checkOrSend = async (client, data) => {
    const { settings } = client.get("ptero", Type.File);
    const channel = await client.channels.cache.get(settings.log_channel);

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
        await channel.send({ embeds: data });
    } else {
        await message.edit({ embeds: data });
    }
};

const isOnline = async (client, url, expect) => {
    try {
        const response = await axios.get(url);
        return response.status === expect;
    } catch (error) {
        if (error.response && error.response.status === expect) {
            return true;
        }
        client.log.error(`Error fetching ${url}:`, error.message);
        return false;
    }
};


const buildEmbed = (client) => {
    const colors = client.get("colors", Type.File);
    const { settings, present } = client.get("ptero", Type.File);
    const { title, timestamp, footer_icon, footer, updateTime, web } = settings;

    const embed = new EmbedBuilder()
        .setTitle(`**${title}**`)
        .setColor(colors.success);
        
    if(web) {
        embed.setURL(web);
    }

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

const update = async (client) => {
    let fields = [];
    const { list, present, logging } = client.get("ptero", Type.File);
    const embeds = [buildEmbed(client)];

    for (const key of Object.keys(list)) {
        const {url, expect, enabled, web: link} = list[key];
        if(enabled){
            if(logging){
                client.log.info(`Checking ${key}...`);
            }
            if (url) {
                const online = await isOnline(client, url, expect);
                if(logging){
                    client.log.info(`Status for ${key}: ${online ? "Online" : "Offline"}`);
                }
                const text_online = ((online instanceof String) ? present.state.error : (online ? present.state.online : present.state.offline));
                let info = `
${present.status} ${text_online}
${(link ? `${present.host} ${link}` : "")}
`;
            fields.push({ name: key, value: `\`\`\`\n${info}\`\`\``, inline: present.inline });

            }
        }
    }

    if(fields.length >= 0) {
        embeds[0].addFields(fields);
    }

    return embeds;
}

module.exports = async (client) => {
    let embed;
    const { enabled, settings } = client.get("ptero", Type.File);

    if (!enabled) return;

    embed = await update(client);

    await checkOrSend(client, embed);

    setInterval(async () => {

        if (enabled) {
            embed = await update(client);
            await checkOrSend(client, embed);
        }

    }, settings.updateTime);
}
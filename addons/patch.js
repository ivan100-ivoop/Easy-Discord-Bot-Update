const { Type } = require('./../framework/utils/Types');
const {
    EmbedBuilder,
    Events
} = require('discord.js');
const { join } = require("path");
const { read, save } = require("./../framework/utils/YmlParser");
const file = join(__dirname, '../data/tmp_patch.yml');

const ip = "IP: **play.staminamc.fun** / **play.staminamc.online**";
const ver = "Version: **1.16.5** - **1.21.3**";

module.exports = async (client) => {
    const { rate_channel, web, enabled, footer } = client.get("patch", Type.File);
    const colors = client.get("colors", Type.File);
    if (!enabled) return;

    client.on(Events.InteractionCreate, async (i) => {
        if (!i.isModalSubmit()) return;

        let patch_data = read(file);

        if (i.customId === 'patch-note') {
            await i.deferReply({ content: "⏰ Моля, изчакайте!", ephemeral: true });
            const channel = await client.channels.cache.get(rate_channel)
            let content = i.fields.getTextInputValue('note');
            patch_data.patch++;
            content += `\n\n${ip}\n${ver}`;

            const embed = new EmbedBuilder()
                .setTitle(`**Patch Notes ${patch_data.patch}**`)
                .setColor(colors.success)
                .setDescription(content);

            if(web){
                embed.setURL(web);
            }

            if (footer.enabled) {
                let out = {};
                if (footer.timestamp) {
                    embed.setTimestamp();
                }

                const icon = (footer.icon !== false && footer.icon !== undefined)
                    ? (typeof footer.icon === 'string' ? footer.icon : `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png`)
                    : null;
                const text = (footer.text !== false && footer.text !== undefined)
                    ? (typeof footer.text === 'string' ? footer.text : client.user.displayName)
                    : null;

                if (icon) {
                    out.iconURL = icon;
                }

                if (text) {
                    out.text = text;
                }

                if (icon || text) {
                    embed.setFooter(out);
                }
            }

            await channel.send({ embeds: [embed] });
            save(file, patch_data);
            return await i.editReply({ content: "Благодарим ви, че оценката! 🙏", ephemeral: true });
        }
        return;
    });
}
const e = require('express');
const { Type } = require('./../framework/utils/Types');
const { read, save } = require("./../framework/utils/YmlParser");
const {
    EmbedBuilder,
    Events
} = require('discord.js');
const { join } = require("path");

const file = join(__dirname, '../data/tmp_staff_members.yml');

module.exports = async (client) => {
    const { rate_channel, show_content, enabled, footer } = client.get("rate", Type.File);
    const colors = client.get("colors", Type.File);

    if (!enabled) return;

    client.on(Events.InteractionCreate, async (i) => {
        if (!i.isModalSubmit()) return;

        if (i.customId === 'rate-our-staff') {
            await i.deferReply({ content: "⏰ Моля, изчакайте!", ephemeral: true });
            const channel = await client.channels.cache.get(rate_channel)

            let starts_count = parseInt(i.fields.getTextInputValue('rate')) || 1;
            let content = i.fields.getTextInputValue('content');

            let starts = new Array(((starts_count > 10) ? 10 : (starts_count < 0) ? 0 : starts_count)).fill("⭐").join('');

            let staff_data = read(file);
            const staff = staff_data.member.filter(e => e.from.id === i.user.id);
            const staffMember = staff.length > 0 ? staff[0] : null;

            if (!staffMember) {
                return await i.editReply({ content: "Хмм, не мога да намеря служителя с това име. Моля, опитайте отново по-късно! 😕", ephemeral: true });
            }

            let updateMembers = staff_data.member.filter(e => e.id !== staffMember.id);
            save(file, { member: updateMembers });

            const colorMatch = (starts_count <= 3) ? colors.error : (starts_count <= 6) ? colors.warning : colors.success;
            let fields = [
                {
                    name: "**Клиент:**",
                    value: `<@${i.user.id}>`,
                    inline: true
                },
                {
                    name: "**Служител:**",
                    value: `<@${staffMember.id}>`,
                    inline: true
                },
            ];

            if (show_content) {
                fields.push(
                    {
                        name: "**Причина:**",
                        value: `\`\`\`\n${content}\`\`\``,
                        inline: false
                    });
            }

            const embed = new EmbedBuilder()
                .setTitle(`**Нова оценка! 🌟**`)
                .setColor(colorMatch)
                .addFields(fields)
                .setDescription(`**Оценка:** ${starts} **${starts.length}/10**`);

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
            return await i.editReply({ content: "Благодарим ви, че оценката! 🙏", ephemeral: true });
        }

        return;
    });

}
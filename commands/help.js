const { Type } = require('./../framework/utils/Types');
const { EmbedBuilder } = require('discord.js');

module.exports = { 
    name: "help",
    type: "text",
    description: "Help Commands!",
    run: async (client, message, args) => {
        const colors = client.get("colors", Type.File);
        const { helping } = client.get("messages", Type.File);
        const info = `
/ping - test bot response time.
`

        return await message.reply({ embeds: [new EmbedBuilder()
            .setTitle(`**Commands**`)
            .setColor(colors.success)
            .setDescription(`\`\`\`\n${info}\`\`\``)
            .setTimestamp()
            .setFooter({ text: helping.footer, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png` })
        ]});
    }
};

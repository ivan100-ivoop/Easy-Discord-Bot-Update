const { Type } = require('./../framework/utils/Types');
const { EmbedBuilder } = require('discord.js');

module.exports = { 
    name: "help",
    description: "Help Commands!",
    run: async (interaction, client) => {
        const colors = client.get("colors", Type.File);
        const info = `
/ping - test bot response time.
`

        return await interaction.reply({ embeds: [new EmbedBuilder()
            .setTitle(`**Commands**`)
            .setColor(colors.success)
            .setDescription(`\`\`\`\n${info}\`\`\``)
            .setTimestamp()
            .setFooter({ text: client.user.displayName, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png` })
        ]});
    }
};

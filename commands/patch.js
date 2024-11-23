const { 
    TextInputStyle, 
    TextInputBuilder, 
    ActionRowBuilder,
    ModalBuilder
} = require('discord.js');
const { Type } = require('./../framework/utils/Types');

module.exports = { 
    name: "patch",
    description: "Send new patch note.",
    run: async (interaction, client) => {
        const { requiredRole } = client.get("patch", Type.File);

        const user = interaction.member;
        const server = interaction.guild;

        if (!user || !server) {
            return await interaction.reply({
                content: "Oh no! I couldn't find you or the server.",
                ephemeral: true
            });
        }

        if (!user.roles.cache.has(requiredRole) && !client.isOwner(server.id, user.id)) {
            return await interaction.reply({
                content: "You don't have permission to do that!",
                ephemeral: true
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('patch-note')
            .setTitle('Enter Patch Note')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('note')
                        .setLabel("Content! 💬")
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(1)
                        .setMaxLength(450)
                        .setPlaceholder("Use '-' for a new line.")
                        .setRequired(true)
                )
            );

        return await interaction.showModal(modal);
    }
};

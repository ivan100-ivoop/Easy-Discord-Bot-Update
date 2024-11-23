const { 
    TextInputStyle, 
    TextInputBuilder, 
    ActionRowBuilder,
    ModalBuilder
} = require('discord.js');
const { join } = require("path");
const { read, save } = require("./../framework/utils/YmlParser");

const file = join(__dirname, '../data/tmp_staff_members.yml');

module.exports = { 
    name: "rep",
    description: "Оценете нашите служители.",
    options: [
        {
            name: "user",
            type: 6,
            required: true,
            description: "This user you wont to give money!"
        }
    ],
    run: async (interaction, client) => {
        let staff = interaction.options.getUser("user");

        if(!staff) {
            return interaction.editReply("О, не! 😮 Забравихте да посочите служителя, опитайте отново!");
        }

        const modal = new ModalBuilder()
            .setCustomId('rate-our-staff')
            .setTitle(`С какво ви помогна ${staff.displayName}? 🤔`)
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('content')
                        .setLabel("Споделете своя причина тук! 💬")
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(5)
                        .setMaxLength(43)
                        .setPlaceholder(`Пример: ${staff.displayName} ми помогна да реша проблема с имейла. 📧`)
                        .setRequired(true),
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('rate')
                        .setLabel("Каква оценка бихте дали за помощта? ⭐️")
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)
                        .setMaxLength(2)
                        .setPlaceholder("Изберете от 1 до 10.")
                        .setRequired(true)
                )
            );

        const staff_s = read(file);
        staff_s.member.push({ 
            id: staff.id, 
            name: staff.name, 
            displayname: staff.displayName, 
            from: {
                id: interaction.user.id,
                name: interaction.user.name, 
                displayname: interaction.user.displayName, 
            } 
        });
        save(file, staff_s);

        return await interaction.showModal(modal);
    }
}

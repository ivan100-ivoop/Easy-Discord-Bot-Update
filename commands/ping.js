module.exports ={ 
    name: "ping",
    description: "reply Pong!",
    run: async (interaction, client) => {
        let errors = client.getDefaultErrors();
        if(!client.isOwner(interaction.guild.id, interaction.user.id))
            return await interaction.reply({content: errors.only_owner, ephemeral: true});
        
        return await interaction.reply(`🏓Latency is ${Math.round(client.ws.ping)}ms`);
    }
}
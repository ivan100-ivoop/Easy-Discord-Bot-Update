const Functions = require("./functions");
const { Type } = require('./utils/Types');
const { existsSync } = require("fs");
const { join } = require("path");

module.exports = class Framework extends Functions {
    async onReadyClient(readyClient) {
        for (const addon of this.preload){
            const name = addon[0];
            const exec = addon[1];
            this.info(`Successfully loaded addon [${name}].`);
            await exec(readyClient);
        }

        await this.registerCommands();
        this.info(`Ready! Logged in as ${readyClient.user.tag}`);
    }

    async onMessage(message) {
        let command = null;

        if (message.author.bot) return;
        if (!message.guild) return;
        let { settings } = this.get("config", Type.File);

        if (!message.content.startsWith(settings.textcommand_prefix)) return;

        if(this.isHaveBlacklistRole(message.guild.id, message.member)){
            if(settings.notify){
                this.notifyOwner(`User ${message.author.username} try to run command "${cmd}" but is blacklisted.`);
            }
            this.warning(`User ${message.author.username} try to run command "${cmd}" but is blacklisted.`);
            return message.channel.send({content: this.getDefaultErrors().blacklisted, ephemeral: true, fetchReply: true});
        }

        const args = message.content.slice(settings.textcommand_prefix.length).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();
        
        if(args.length === 0){
            command =  existsSync(join(this.commandsDir, `${cmd}.js`)) ? join(this.commandsDir, `${cmd}.js`) : join(join(this.commandsDir, cmd), `help.js`);
            
            if (!existsSync(command)) {
                if(settings.notify){
                    this.notifyOwner(`User ${message.author.username} try to run no matching text command "${cmd}".`);
                }
                this.warning(`User ${message.author.username} try to run no matching text command "${cmd}".`);
                return message.channel.send({content: this.getDefaultErrors().not_found, ephemeral: true, fetchReply: true});
            }
        } else {
            const root = join(this.commandsDir, cmd);
            command = join(root, `${args[0]}.js`);

            if (!existsSync(command)) {
                if(settings.notify){
                    this.notifyOwner(`User ${message.author.username} try to run no matching text command "${cmd} ${args[0]}".`);
                }
                this.warning(`User ${message.author.username} try to run no matching text command "${cmd} ${args[0]}".`);
                return message.channel.send({content: this.getDefaultErrors().not_found, ephemeral: true, fetchReply: true});
            }
        }
        
        command = require(command);

        if (!command) {
            if(settings.notify){
                this.notifyOwner(`User ${message.author.username} try to run no matching text command "${cmd}".`);
            }
            this.warning(`User ${message.author.username} try to run no matching text command "${cmd}".`);
            return message.channel.send({content: this.getDefaultErrors().not_found, ephemeral: true, fetchReply: true});
        }

        if (!'type' in command || command.type != "text") {
            return message.channel.send({content: this.getDefaultErrors().not_found, ephemeral: true, fetchReply: true});
        }

        return ((args.length === 0) ? await command.run(this, message, null) : await command.run(this, message, args));

    }
    
    async onInteraction(interaction) {
        let { settings } = this.get("config", Type.File);
        if (!interaction.isChatInputCommand()) return;

        const command = this.buildCommands().get(interaction.commandName);

        if (!command) {
            if(settings.notify){
                this.notifyOwner(`User ${interaction.user.username} try to run no matching command "${interaction.commandName}".`);
            }
            this.warning(`User ${interaction.user.username} try to run no matching command "${interaction.commandName}".`);
            return;
        }

        if(this.isHaveBlacklistRole(interaction.guild.id, interaction.member)){
            if(settings.notify){
                this.notifyOwner(`User ${interaction.user.username} try to run command "${interaction.commandName}" but is blacklisted.`);
            }
            this.warning(`User ${interaction.user.username} try to run command "${interaction.commandName}" but is blacklisted.`);
            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp({ content: this.getDefaultErrors().blacklisted, ephemeral: true, fetchReply: true });
            } else {
                return await interaction.reply({ content: this.getDefaultErrors().blacklisted, ephemeral: true, fetchReply: true });
            }
        }

        try {
            return await command.run(interaction, this);
        } catch (error) {
            this.error(error);
            if(settings.notify){
                this.notifyOwner(`Error \`${error}\``);
            }
            return;
        }
    }
}
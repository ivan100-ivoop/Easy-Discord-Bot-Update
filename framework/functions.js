const { join } = require("path");
const { read, save, fs } = require("./utils/YmlParser");
const { Logger, Log } = require('./utils/Log');
const { Type } = require('./utils/Types');

const { Client, GatewayIntentBits, Partials, Collection, Routes, Events, EmbedBuilder } = require('discord.js');
const { REST } = require("@discordjs/rest");
const { existsSync } = require("fs");

const default_settings = {
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.Guilds
    ],
    partials: [Partials.Channel]
};

const default_errors = {
    not_found: "This command not found!",
    blacklisted: "Your are not allow to use any command!",
    notify:{
        title: ":no_entry: Error!!",
        message: ""
    }
};

class Functions extends Client {
    constructor(rootDir = "/") {
        if (new.target === Functions) {
            throw new Error("Cannot instantiate an abstract class directly.");
        }

        super(default_settings);
        this.setup(rootDir);
    }

    setup(rootDir = "/"){
        this.rootDir = rootDir;
        this.configDir = join(this.rootDir, "configs/");
        this.commandsDir = join(this.rootDir, "commands/");
        this.handelrDir = join(this.rootDir, "addons/");

        this.log = new Log(new Logger(false, ""), this);
        this.commands = new Collection();
        this.configFiles = new Collection();
        this.preload = new Collection();
        this.textcommand_char = null;

        if(existsSync(join(this.commandsDir, "errors.yml"))){
            default_errors = read(join(this.commandsDir, "errors.yml"))
        }

        return this;
    }

    async start(){
        this.getFiles(this.configDir);
        this.getFiles(this.commandsDir, ".js", this.commands);
        this.getFilesWithoutCheck(this.handelrDir, ".js", this.preload);
        return this.bootClient();
    }
    async onReadyClient(readyClient) {
        this.info(`Ready! Logged in as ${readyClient.user.tag}`);
        return this;
    }

    async onMessage(message) {}
    async onInteraction(interaction) {}

    getConfigFile(filename = null) {
        if (!filename) return {};
        return join(this.configDir, filename);
    }

    readConfigFile(filename = null) {
        if (!filename) return {};
        const path = join(this.configDir, filename);
        return read(path);
    }

    setConfigFolder(path = "") {
        if (path !== "") {
            this.configDir = path;
        }
        return this;
    }

    getConfigFolder() {
        return this.configDir;
    }

    isExtarnalConfig(file = null){
        if(!file) return false;
        switch(file){
            case "config.yml":
                return false;
            case "colors.yml":
                return false;
            case "errors.ynl":
                return false;
            default:
                return true;    
        }
    }

    getFiles(path, fileType = ".yml", putInside = this.configFiles){
        const fileFolder = fs.readdirSync(path, {withFileTypes: true});
        for (const folderItems of fileFolder) {
            const filePath = join(path, folderItems.name);
            if(!folderItems.isDirectory()){
                if(folderItems.name.endsWith(fileType)){

                    if(fileType === ".js"){
                        const textCommand = require(filePath);
                        if (!'type' in textCommand || textCommand.type != "text") {
                            if ('name' in textCommand && 'run' in textCommand) {
                                const content = (fileType == ".js" || fileType == ".json") ? require(filePath) : (fileType == ".yml") ? read(filePath) : fs.readFileSync(filePath, 'utf8');
                                putInside.set(folderItems.name.split(fileType)[0], content);
                            } else {
                                this.warning(`The command at ${folderItems.name} is missing a required "name" or "run" property will be bypass.`);
                            }
                        }
                    } else {
                        const content = (fileType == ".js" || fileType == ".json") ? require(filePath) : (fileType == ".yml") ? read(filePath) : fs.readFileSync(filePath, 'utf8');
                        putInside.set(folderItems.name.split(fileType)[0], content);
                    }
                }
            } else {
                this.getFiles(filePath, fileType, putInside);
            }
        }
        return this;
    }

    getFilesWithoutCheck(path, fileType = ".yml", putInside = this.configFiles){
        const fileFolder = fs.readdirSync(path, {withFileTypes: true});
        for (const folderItems of fileFolder) {
            const filePath = join(path, folderItems.name);
            if(!folderItems.isDirectory()){
                if(folderItems.name.endsWith(fileType)){
                    const content = (fileType == ".js" || fileType == ".json") ? require(filePath) : (fileType == ".yml") ? read(filePath) : fs.readFileSync(filePath, 'utf8');
                    putInside.set(folderItems.name.split(fileType)[0], content);
                }
            } else {
                this.getFiles(filePath, fileType, putInside);
            }
        }
        return this;
    }

    setSaveLogDir(path = null){
        if(path !=null){
            this.log = new Log(new Logger(join(this.rootDir, path), this));
        }
        return this;
    }

    get(name = null, type = Type.File){
        if(!name) return false;
        switch(type){
            case Type.File:
                return this.configFiles.get(name)
            case Type.Commands:
                return this.commands.get(name);
            default:
                return false;
        }
    }

    put(name = null, content = null, type = Type.File){
        if(!name) return false;
        if(!content) return false;
        switch(type){
            case Type.File:
                return this.configFiles.put(name, content)
            case Type.Commands:
                return this.commands.put(name, content);
            default:
                return false;
        }
    }

    isOwner(guildId = null, memberId = null){
        if(!guildId || !memberId) return false;
        let { settings } = this.get("config", Type.File);
        for (const guildsId of Object.keys(settings.guilds)){
            if(guildsId === guildId) return settings.guilds[guildsId].owners.includes(memberId);
        }
        return false
    }

    isHaveBlacklistRole(guildId = null, memberId = null){
        if(!guildId || !memberId) return false;
        
        const guild = this.getGuild(guildId);
        
        if(!guild) return false;

        if(guild.owners.includes(memberId)) return false;

        for(const role of guild.roles.blacklisted){
            if(memberId.roles.cache.find(r => r.id === role)){
                return true;
            }
        }

        return false;
    }

    isStaff(guildId = null, memberId = null){
        if(!guildId || !memberId) return false;
        
        const guild = this.getGuild(guildId);
        
        if(!guild) return false;

        return guild.roles.staff.includes(memberId) || guild.owners.includes(memberId);
    }

    getGuild(guildId = null){
        if(!guildId) return false;
        let { settings } = this.get("config", Type.File);
        for (const guildsId of Object.keys(settings.guilds)){
            if(guildsId === guildId) return settings.guilds[guildsId];
        }
        return false
    }

    buildCommands(asTextCommand = false){
        const slashCommand = new Collection();
        for (const command of this.commands){
            const _cmd = command[1];
            if(asTextCommand){
                if(_cmd.type || _cmd.type == "text"){
                    slashCommand.set(command[0], _cmd)
                }
            } else {
                if(!_cmd.type || !_cmd.type == "text"){
                    slashCommand.set(command[0], _cmd)
                }
            }
        }
        
        return slashCommand;
    }

    async registerCommands(){
        let { settings } = this.get("config", Type.File);
        const rest = new REST({ version: "10" }).setToken(settings.token);

        try {
            this.info("Started refreshing application [/] commands.");
            for (const guildsId of Object.keys(settings.guilds)){
                await rest.put(Routes.applicationGuildCommands(settings.client.id, guildsId), { body: this.buildCommands() });
            }
            this.info("Successfully reloaded application [/] commands.");
        } catch(error) {
            this.error(error);
        }
        return this;
    }

    getDefaultErrors(){
        return default_errors;
    }

    info(content = null){
        if(!content) return;
        this.log.info(content);
        return this;
    }
    error(content = null){
        if(!content) return;
        this.log.error(content);
        return this;
    }
    warning(content = null){
        if(!content) return;
        this.log.warning(content);
        return this;
    }

    addHandler(name = null, _function = (client) => {}){
        if(!name) return this;
        this.preload.set(name, _function);
        return this;
    }

    getLog(){
        return this.log;
    }

    setLog(logger = {}){
        this.log = logger;
        return this;
    }

    clearEvents(){

        this.preload.clear();
        this.commands.clear();
        this.configFiles.clear();

        return this;
    }

    stop(){
        this.info("Cleaning Events!");
        this.clearEvents();
        this.info("Disconnecting!");
        this.destroy();
        this.info("Disconnected!");
        return this;
    }

    async restart() {
        this.info("Restarting!");
        this.stop();
        this.info("Connecting!");
        this.getFiles(this.configDir);
        this.getFiles(this.commandsDir, ".js", this.commands);
        this.getFilesWithoutCheck(this.handelrDir, ".js", this.preload);

        let { settings } = this.get("config", Type.File);
        this.login(settings.token);
        this.info(`Ready! Connected as ${this.user.tag}`);

        return this;
    }

    notifyOwner(object = null, guildsId = null, title = null){
        let { settings } = this.get("config", Type.File);
        if(!guildsId){
            for (const gId of Object.keys(settings.guilds)){
                this.notify(object, gId, title);
            }
        } else {
            this.notify(object, guildsId, title);
        }
    }

    notify(object, id, title){
        if(!title) title = this.getDefaultErrors().notify.title;
        let colors = this.get("colors", Type.File);
        const guild = this.getGuild(id);
        if(guild.log_channel){
            const _guild = this.guilds.cache.get(id);
            if(_guild.channels.cache.get(guild.log_channel) !== undefined)  {
                const owners = guild.owners.map(user_id=> `<@${user_id}>`);
                _guild.channels.cache.get(guild.log_channel).send({embeds: [
                    new EmbedBuilder()
                    .setTitle(title)
                    .setColor(colors.error)
                    .setDescription(`${owners} ${new String(object)}`)    
                ]})
            }
        }
    }

    bootClient(){
        let { settings } = this.get("config", Type.File);

        this.once(Events.ClientReady, this.onReadyClient);
        this.on(Events.MessageCreate, this.onMessage);
        this.on(Events.InteractionCreate, this.onInteraction);

        this.login(settings.token);
        return this;
    }
}

module.exports = Functions;
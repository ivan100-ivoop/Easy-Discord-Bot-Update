const moment = require("moment");
const { existsSync, mkdirSync, writeFileSync, appendFileSync } = require("fs");
const { join } = require("path");
const { Type } = require('./Types');

class Logger {
    constructor(saveLog = false, path = ""){
        this.savePath = join(join(__dirname, "../"), path);
        this.saveEnabled = saveLog;
        this.fileName = `${moment(new Date()).format('YYYY-MMM-DD_HH-mm')}.log`;

        this.prefix_info = "[INFO]";
        this.prefix_warning = "[WARNING]";
        this.prefix_error = "[ERROR]";
    }

    isString(x){
        return Object.prototype.toString.call(x) === "[object String]"
    }

    saveLog(time, prefix, object){
        if(this.saveEnabled){
            if(!existsSync(this.savePath)){
                mkdirSync(this.savePath, { recursive: true });
            }

            const saveFile = join(this.savePath, this.fileName);
            
            if(!existsSync(saveFile)){
                writeFileSync(saveFile, `[${time}]${prefix}: ${(this.isString(object) ? object : new String(object))}\n`);
            } else {
                appendFileSync(saveFile, `[${time}]${prefix}: ${(this.isString(object) ? object : new String(object))}\n`);
            }
        }
    }

    info(object){
        const time = moment().format("HH:mm:ss");
        console.log(`\x1b[34m[${time}]\x1b[36m${this.prefix_info}:\x1b[0m`, object);
        this.saveLog(time, this.prefix_info, object);
        return this;
    }
    warning(object){
        const time = moment().format("HH:mm:ss");
        console.info(`\x1b[34m[${time}]\x1b[33m${this.prefix_warning}:\x1b[0m`, object);
        this.saveLog(time, this.prefix_warning, object);
        return this;
    }
    error(object){
        const time = moment().format("HH:mm:ss");
        console.info(`\x1b[34m[${time}]\x1b[31m${this.prefix_error}:\x1b[0m`, object);
        this.saveLog(time, this.prefix_error, object);
        return this;
    }

}

class Log {
    constructor(logger = {}, framework = null){
        this.logger = logger;
        this.sys = framework;
    }
    info(object){
        this.logger.info(object);
        return this;
    }

    warning(object){
        this.logger.warning(object);
        return this;
    }

    error(object){
        this.logger.error(object);
        if(this.sys){
            let { settings } = this.sys.get("config", Type.File);
            if(settings.notify){
                this.sys.notifyOwner(object);
            }
        }
        return this;
    }
}

module.exports = { Logger, Log };
const YAML = require('yaml'), fs = require("fs");

const read = (file = null, encode = "utf8") => {
    if(!file) return;
    return YAML.parse(fs.readFileSync(file, encode))
}

const save = (file = null, content = null, encode = "utf8") => {
    if(!file) return;
    if(!content) return;
    content = YAML.stringify(content);
    return fs.writeFileSync(file, content, {encoding: encode})
}

module.exports = { read, save, fs };
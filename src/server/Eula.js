const fs = require('fs-extra');
const path = require('path');
/**
 * Used to accept and read data from the Minecraft End User License Agreement file
 */
class Eula {
    /*
  Allow defining EULA URLs or filenames that differ from the default ones
  Setting falsey values (no URL is found in file, invalid path, etc.) results
  in the default value being returned, which is usually desired behaviour
  */
    /**
   * @return {String}
   */
    get url () {
        return this.customUrl ? this.customUrl : Eula.url;
    }
    /**
   * @return {String}
   */
    get file () {
        return this.customFile ? this.customFile : Eula.file;
    }
    /**
   * Non-string values result in undefined behaviour
   * @param  {String} url
   */
    set url (url) {
        this.customUrl = url !== this.url ? url : this.customUrl;
    }
    /**
   * Non-string values result in undefined behaviour
   * @param  {String} file
   */
    set file (file) {
        this.customFile = file !== this.file ? file : this.customFile;
    }
    /**
   * Reads EULA URL from file and stores it
   * @param  {String} serverPath Path to Minecraft Server executables folder
   * @return {Promise} Resolves to URL string or rejects with an Error object
   */
    async getUrl (serverPath) {
        this.url = (await fs.readFile(path.join(serverPath, this.file), 'utf8'))
            .match(Eula.regexp.url)[0];
        return this.url;
    }
    /**
   * Reads and returns EULA acceptance state from file
   * @return {Promise} Resolves to state Boolean or rejects with an Error object
   */
    async check (serverPath) {
        return JSON.parse((await fs.readFile(path.join(serverPath, this.file), 'utf8'))
            .match(Eula.regexp.state)[0]);
    }
    /**
  * Accepts the EULA, if not already accepted
  * @return {Promise} Resolves, or rejects with an Error object
  */
    async accept (serverPath) {
        const filePath = path.join(serverPath, this.file);
        let lines = (await fs.readFile(filePath, 'utf8'));
        if (!JSON.parse(lines.match(Eula.regexp.state)[0])) {
            await fs.writeFile(filePath, lines.replace(Eula.regexp.state, 'true'));
        }
    }
}
// Expose regular expressions used in methods to be changed if needed
Eula.regexp = {
    url: /(https?|ftp):\/\/[^\s][\w./]+/,
    // This might be unnecessarily complex, but it only returns 'true'/'false'
    state: /(?<=eula=)(?:false|true)/
};
// Default URL and filename strings, so as not to store copies in every instance
Eula.url = 'https://account.mojang.com/documents/minecraft_eula';
Eula.file = 'eula.txt';

module.exports = Eula;

const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const util = require('util');

const homeDir = path.join(os.homedir(), 'minecraft-server-manager');

class Util {
  constructor () {
    this.homeDir = homeDir;
  }

  /**
     * Converts data from the properties file into objects with the names and values
     * @param  {string} lines Data from a file as a single string as 'name=value'
     * @return {Array} The names and values of properties as '{name: '', value: ''}'
     */
  convertPropertiesToObjects (lines) {
    const properties = [];
    let value = null;
    // Split at newlines and loop through the results
    for (const line of lines.split(new RegExp(os.EOL))) {
      // Skip empty and commented out lines
      if (line && !line.match(/^#/)) {
        const pair = line.split('=');
        // Convert values to native JS objects if possible
        if (pair[1] === 'true') {
          value = true;
        }
        else if (pair[1] === 'false') {
          value = false;
        }
        else if (Number(pair[1])) {
          value = Number(pair[1]);
        }
        else if (!pair[1]) {
          value = null;
        }
        else {
          value = pair[1];
        }
        properties.push({ name: pair[0], value: value });
      }
    }

    properties.sort(function(a, b) {
      var nameA = a.name.toUpperCase(); // ignore upper and lowercase
      var nameB = b.name.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
    
      // names must be equal
      return 0;
    });

    return properties;
  }

  /**
     * Converts a properties object into an ini-style file compatible string
     * @param  {Array} properties Objects with names and values of properties as {name: value}
     * @return {string} A newline sepperated string of properties
     */
  convertObjectsToProperties (properties) {
    let lines = '';
    for (const property of properties) {
      let value = '';
      if (property.value == null) {
        value = '';
      }
      else {
        value = property.value;
      }
      lines += `${property.name}=${value}${os.EOL}`;
    }

    return lines;
  }

  /**
     * Prepend '0' to, and return the last two characters of, given string
     * Meant for padding Date / Time strings
     * @param  {string} string String to pad
     * @return {string}
     */
  zPad (string) {
    return ('0' + string).slice(-2);
  }

  /**
     * Create a complete Date / Time timestamp string with the format:
     * [Year]-[Month]-[Date]_[Hour]:[Minutes]:[Seconds]
     * @param  {Date} date The date and time to be used
     * @return {string}
     */
  getDateTime (date = new Date()) {
    return `${date.getFullYear()}-${this.zPad(date.getMonth() + 1)}-${this.zPad(date.getDate())}_${this.getTime(date)}`;
  }

  /**
     * Create a Time only timestamp string with the format:
     * [Hour]:[Minutes]:[Seconds]
     * @param  {Date} date The time to be used
     * @return {string}
     */
  getTime (date = new Date()) {
    return `${this.zPad(date.getHours())}${this.zPad(date.getMinutes() + 1)}${this.zPad(date.getSeconds())}`;
  }

  /**
     * Logs the data specifed to the specified log file.
     * @method
     * @param {string} data The line to write to the log.
     * @param {string} file The name of the log file.
     */
  async log (data = '', file = '') {
    if (!file) {
      return Promise.reject('Invalid filename specified.');
    }
    try {
      const logFilePath = path.join(homeDir, file);
      const logFilePathExists = await fs.pathExists(logFilePath);
      if (!logFilePathExists) {
        await fs.ensureDir(path.dirname(logFilePath));
      }
      await fs.appendFile(logFilePath, `${util.format(data)}${os.EOL}`);
      return logFilePath;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
     * Clears the specified log file.
     * @param {string} file The name of the log file to clear.
     */
  async clearLog (file = '') {
    if (!file) {
      return Promise.reject(new Error('Invalid filename specified.'));
    }
    try {
      const logFilePath = path.join(homeDir, file);
      const logFilePathExists = await fs.pathExists(logFilePath);
      if (!logFilePathExists) {
        await fs.ensureDir(path.dirname(logFilePath));
      }
      const logFile = await fs.createWriteStream(logFilePath);
      logFile.write('');
      logFile.close();
      return logFilePath;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
     * Reads the `filename` properties file and returns its settings.
     * @param {string} filename The name of a file to read.
     * @param {object} defaults Default values to use if unable to read the file. These values
     * are saved as default.
     */
  async readSettings (filename = '', defaults = {}) {
    let settings = '';
    const settingsFile = path.join(homeDir, filename);

    try {
      settings = JSON.parse(await fs.readFile(settingsFile));
      return settings;
    } catch (err) {
      if (!defaults) {
        return Promise.reject(new Error('No default settings given.'));
      }
      // Overwrite with sane defaults.
      return await this.saveSettings(filename, defaults);
    }
  }

  /**
     * Saves some settings JSON to the `filename` properties file.
     * @param {string} filename The name of a file to write.
     * @param {object} settings The values to save to the file.
     */
  async saveSettings (filename, settings) {
    const settingsFile = path.join(homeDir, filename);
    try {
      const settingsFileExists = await fs.pathExists(settingsFile);
      if (!settingsFileExists) {
        await fs.ensureDir(path.dirname(settingsFile));
      }
      await fs.writeFile(settingsFile, JSON.stringify(settings, null, 4));
      return settings;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
     * Poor man's "sleep" function.
     * @param {number} seconds The number of seconds to wait.
     * */
  async wait (seconds) {
    return new Promise(resolve => {
      setTimeout(resolve, seconds * 1000);
    });
  }
}

module.exports = Util;

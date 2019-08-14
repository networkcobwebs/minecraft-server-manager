const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const util = require('util');

const homeDir = path.join(os.homedir(), 'minecraft-server-manager');

/**
 * Converts data from the properties file into objects with the names and values
 * @param  {string} lines Data from a file as a single string as 'name=value'
 * @return {Array} The names and values of properties as '{name: '', value: ''}'
 */
function convertPropertiesToObjects (lines) {
    let properties = [];
    // Split at newlines and loop through the results
    for (const line of lines.split(new RegExp(os.EOL))) {
        // Skip empty and commented out lines
        if (line && !line.match(/^#/)) {
            let pair = line.split('=');
            // A basic check to see if line is a 'name=value' pair
            if (pair.length === 2) {
                properties.push({ name: pair[0], value: pair[1] });
            }
        }
    }

    return properties;
}

/**
 * Converts a properties object into an ini-style file compatible string
 * @param  {Array} properties Objects with names and values of properties as {name: value}
 * @return {string} A newline sepperated string of properties
 */
function convertObjectsToProperties (properties) {
    let lines = "";
    for (const property of properties) {
        lines += `${property.name}=${property.value}${os.EOL}`;
    }

    return lines;
}

/**
 * Prepend '0' to, and return the last two characters of, given string
 * Meant for padding Date / Time strings
 * @param  {string} string String to pad
 * @return {string}
 */
function zPad (string) {
    return ('0' + string).slice(-2);
}

/**
 * Create a complete Date / Time timestamp string with the format:
 * [Year]-[Month]-[Date]_[Hour]:[Minutes]:[Seconds]
 * @param  {Date} date The date and time to be used
 * @return {string}
 */
function getDateTime (date = new Date()) {
    return `${date.getFullYear()}-${zPad(date.getMonth() + 1)}-${zPad(date.getDate())}_${getTime(date)}`;
}

/**
 * Create a Time only timestamp string with the format:
 * [Hour]:[Minutes]:[Seconds]
 * @param  {Date} date The time to be used
 * @return {string}
 */
function getTime (date = new Date()) {
    return `${zPad(date.getHours())}${zPad(date.getMinutes() + 1)}${zPad(date.getSeconds())}`;
}

/**
 * Logs the data specifed to the specified log file.
 * @method
 * @param {string} data The line to write to the log.
 * @param {string} file The name of the log file.
 */
async function log (data = "", file = "") {
    if (!file) {
        return Promise.reject("Invalid filename specified.");
    }
    try {
        let logFilePath = path.join(homeDir, file);
        let logFilePathExists = await fs.pathExists(logFilePath);
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
async function clearLog (file = "") {
    if (!file) {
        return Promise.reject(new Error("Invalid filename specified."));
    }
    try {
        let logFilePath = path.join(homeDir, file);
        let logFilePathExists = await fs.pathExists(logFilePath);
        if (!logFilePathExists) {
            await fs.ensureDir(path.dirname(logFilePath));
        }
        let logFile = await fs.createWriteStream(logFilePath);
        logFile.write("");
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
async function readSettings (filename = "", defaults = {}) {
    let settings = "";
    let settingsFile = path.join(homeDir, filename);
    
    try {
        settings = JSON.parse(await fs.readFile(settingsFile));
        return settings;
    } catch (err) {
        if (!defaults) {
            return Promise.reject(new Error("No default settings given."));
        }
        // Overwrite with sane defaults.
        return await saveSettings(filename, defaults);
    }
}

/**
 * Saves some settings JSON to the `filename` properties file.
 * @param {string} filename The name of a file to write.
 * @param {object} settings The values to save to the file.
 */
async function saveSettings (filename, settings) {
    let settingsFile = path.join(homeDir, filename);
    try {
        let settingsFileExists = await fs.pathExists(settingsFile);
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
async function wait (seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
}

module.exports = Util = {
    convertPropertiesToObjects,
    convertObjectsToProperties,
    getDateTime,
    homeDir,
    log,
    clearLog,
    readSettings,
    saveSettings,
    wait
};
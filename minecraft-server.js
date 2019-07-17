
const archiver = require('archiver');
const exec = require('child_process').exec;
const fs = require('fs-extra');
const FS = fs.constants;
const https = require('https');
const os = require('os');
const path = require('path');
const spawn = require('child_process').spawn;

const Map = require(path.resolve(path.join('manager', 'Map.js')));

const debugMinecraftServer = false;

let defaultProperties = {
    acceptedEula: false,
    allowedCommands: [],
    backupList: [],
    bannedIps: [],
    bannedPlayers: [],
    detectedVersion: {},
    eulaFound: false,
    eulaUrl: 'https://account.mojang.com/documents/minecraft_eula',
    fullHelp: [],
    helpPages: 0,
    installed: false,
    installedVersions: [],
    ipAddress: '',
    javaHome: '',
    javaPath: '',
    needsInstallation: true,
    ops: [],
    osType: os.type(),
    pathToMinecraftDirectory: path.resolve('minecraft_server'),
    playerInfo: {players: [], summary: ''},
    serverJar: 'server.jar',
    serverLog: 'minecraft_server.log',
    serverLogDir: 'logs',
    serverOutput: [],
    serverOutputCaptured: false,
    serverProperties: [],
    serverProcess: null,
    starting: false,
    started: false,
    startedTimer: null,
    startTime: null,
    stopping: false,
    stopped: false,
    stoppedTimer: null,
    updateAvailable: false,
    userCache: {},
    versions: {},
    whitelist: []
};

/**
 * Converts data from the properties file into objects with the names and values
 * @param  {string} lines Data from 'server.properties' file as a single string
 * @return {Array} The names and values of properties as '{name: '', value: ''}'
 */
function convertPropertiesToObjects (lines) {
    if (debugMinecraftServer) {
        console.log(`Converting properties to an object:\n${lines}`);
    }

    let properties = [];
    // Split at newlines and loop through the results
    for (const line of lines.split(new RegExp(os.EOL))) {
        // Skip empty and commented out lines
        if (line && !line.match(/^#/)) {
            let pair = line.split('=');
            // A basic check to see if line is a 'name=value' pairs
            if (pair.length === 2) {
                properties.push({ name: pair[0], value: pair[1] });
            } else {
                if (debugMinecraftServer) {
                    console.log(`Invalid line in properties:\n${line}`);
                }
            }
        }
    }

    if (debugMinecraftServer) {
        console.log(`Done converting properties:\n${JSON.stringify(properties)}`);
    }

    return properties;
}

/**
 * Converts properties object into a 'server.properties' file compatible string
 * @param  {Array} properties Objects with names and values of properties
 * @return {string} A newline sepperated string of properties
 */
function convertObjectsToProperties (properties) {
    if (debugMinecraftServer) {
        console.log(`Converting objects to properties:\n${JSON.stringify(properties)}`);
    }

    let lines = "";
    for (const property of properties) {
        lines += `${property.name}=${property.value}${os.EOL}`;
    }

    if (debugMinecraftServer) {
        console.log(`Done converting objects:\n${lines}`);
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
    return `${zPad(date.getHours())}:${zPad(date.getMinutes() + 1)}:${zPad(date.getSeconds())}`;
}

class MinecraftServer {
    get properties () {
        return this._properties;
    }

    set properties (props) {
        if (JSON.stringify(props) != {}) {
            this._properties = props;
        }
    }

    get running () {
        return this._properties.started;
    }

    constructor () {
        // TODO Deal with properties passed in
        if (!this._properties) {
            this._properties = defaultProperties;
        }

        this.acceptEula = this.acceptEula.bind(this);
        this.bufferMinecraftOutput = this.bufferMinecraftOutput.bind(this);
        this.checkForMinecraftInstallation = this.checkForMinecraftInstallation.bind(this);
        this.checkForMinecraftToBeStarted = this.checkForMinecraftToBeStarted.bind(this);
        this.checkForMinecraftToBeStopped = this.checkForMinecraftToBeStopped.bind(this);
        this.checkForMinecraftUpdate = this.checkForMinecraftUpdate.bind(this);
        this.detectJavaHome = this.detectJavaHome.bind(this);
        this.detectMinecraftJar = this.detectMinecraftJar.bind(this);
        this.getBannedIps = this.getBannedIps.bind(this);
        this.getBannedPlayers = this.getBannedPlayers.bind(this);
        this.getEula = this.getEula.bind(this);
        this.getMinecraftVersions = this.getMinecraftVersions.bind(this);
        this.getServerProperties = this.getServerProperties.bind(this);
        this.getUserCache = this.getUserCache.bind(this);
        this.install = this.install.bind(this);
        this.listCommands = this.listCommands.bind(this);
        this.listPlayers = this.listPlayers.bind(this);
        this.parseHelpOutput = this.parseHelpOutput.bind(this);
        this.saveProperties = this.saveProperties.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.updateStatus = this.updateStatus.bind(this);
        this.waitForHelpOutput = this.waitForHelpOutput.bind(this);

        this.properties.ipAddress = require('underscore')
            .chain(require('os').networkInterfaces())
            .values()
            .flatten()
            .find({family: 'IPv4', internal: false})
            .value()
            .address;

        /**
        * Start asynchronous tasks
        */
        if (global.debugMinecraftServer) {
            console.log('Starting asynchronous tasks...');
        }
        Promise.all([this.readMapList()])
        .then(results => {
            this.maps = results[0];
        });

        this.checkForMinecraftInstallation();
        this.getMinecraftVersions();
    }
    /**
     * Reads an array of map objects from 'Map.paths.mapList' and returns them
     * @return {Promise} Resolves to an array of Map instances
     */
    async readMapList () {
        try {
            return (await fs.readJson(Map.paths.mapList)).map(map => new Map(map));
        } catch (error) {
            console.log(`Failed to read map list! \n${error}`);
            return [];
        }
    }
    /**
     * Writes an array of map objects to 'Map.paths.mapList'
     * @return {Promise} Resolves to true or false depending on whether successful or not
     */
    async writeMapList () {
        try {
            await fs.writeJson(Map.paths.mapList, this.maps.map(map => map.export()) || []);
            return true;
        } catch (error) {
            console.log(`Failed to write map list! \n${error}`);
            return false;
        }
    }

    async backup

    acceptEula () {
        if (debugMinecraftServer) {
            console.log('Checking and accepting MinecraftServer EULA...');
        }

        let properties = this.properties;
        let eula;
        let line;
        let lineNumber;

        if (properties.acceptedEula === 'false' || !properties.acceptedEula) {
            console.log('Accepting EULA...');
            try {
                eula = fs.readFileSync(path.join(properties.pathToMinecraftDirectory, 'eula.txt'), 'utf8').split(/\n/);
                for (lineNumber = 0; lineNumber < eula.length; lineNumber++) {
                    if (eula[lineNumber]) {
                        line = eula[lineNumber].split('=');
                        if (line.length == 2) {
                            eula[lineNumber] = 'eula=true';
                        }
                    }
                }
            } catch (e) {
                if (debugMinecraftServer) {
                    console.log('Failed to read eula.txt:', e.stack);
                }
            }

            // write the eula.txt file
            fs.writeFile(path.join(properties.pathToMinecraftDirectory, 'eula.txt'), eula.join('\n'), (err) => {
                if (err) {
                    console.log('Failed to write eula.txt:', err);
                    throw err;
                }
                properties.acceptedEula = true;
            });
        }
    }

    backupWorld (worldName, callback) {
        if (debugMinecraftServer) {
            console.log('Backing up MinecraftServer world...');
        }

        if (typeof worldName === 'function') {
            callback = worldName;
            worldName = null;
        }

        let properties = this.properties;
        worldName = worldName || 'world';

        // TODO Allow backup path to be set
        let backupDir = path.join(properties.pathToMinecraftDirectory, 'worldBackups'),
            archive, output;

        fs.mkdirSync(backupDir, {recursive: true});

        try {
            fs.accessSync(backupDir, FS.F_OK | FS.R_OK | FS.W_OK);

            archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });
            output = fs.createWriteStream(path.join(backupDir, worldName + '_' + getDateTime() + '.zip'));

            archive.on('error', function(err) {
                throw err;
            });
            output.on('close', function() {
                console.log('Backup size: ' + archive.pointer() + ' total bytes');
                console.log('MinecraftServer World backed up.');
                this.start();
                if (typeof callback === 'function') {
                    callback();
                }
            }.bind(this));

            if (properties.started) {
                this.stop(() => {
                    // zip world dir
                    archive.pipe(output);
                    archive.directory(path.join(properties.pathToMinecraftDirectory, worldName), false);
                    archive.finalize();
                });
            } else {
                // zip world dir
                archive.pipe(output);
                archive.directory(path.join(properties.pathToMinecraftDirectory, worldName), false);
                archive.finalize();
                console.log('MinecraftServer World backed up.');
            }
        } catch (e) {
            console.log('Backup directory does not exist, creating.');
            fs.mkdirSync(backupDir, {recursive: true});
            output.close();
        }
    }

    bufferMinecraftOutput (data) {
        this.properties.serverOutput.push(data.toString().trim());
    }

    checkForMinecraftInstallation () {
        if (debugMinecraftServer) {
            console.log('Checking for MinecraftServer installation...');
        }

        let properties = this.properties,
            pathToMinecraftDirectory = properties.pathToMinecraftDirectory,
            directoryFound = false;

        try {
            fs.accessSync(pathToMinecraftDirectory, FS.F_OK | FS.R_OK | FS.W_OK);
            directoryFound = true;
            console.log('Minecraft server directory exists.');
        } catch (e) {
            console.log('Creating MinecraftServer directory...');
            fs.mkdirSync(pathToMinecraftDirectory);
            console.log('Complete.');
            properties.installed = false;
        }
        if (directoryFound) {
            this.detectMinecraftJar();
        }

        if (debugMinecraftServer) {
            console.log('Done checking for MinecraftServer installation.');
        }
    }

    checkForMinecraftToBeStarted (checkCount, callback) {
        // if (debugMinecraftServer) {
        //     console.log('Checking for MinecraftServer process to be started ('+ checkCount +')...');
        // }

        let properties = this.properties;
        let threshold = 1000;
        let outputLines = [];
        let outputString = '';
        let versionParts = [];
        let major, minor, release;
        let shouldContinueStart = true;

        if (checkCount > threshold) {
            // Pop back out. Minecraft may or may not come up.
            properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
            properties.serverOutput.length = 0;
            properties.serverOutputCaptured = false;
            console.log('Failed to detect running MinecraftServer. Continuing.');
            if (typeof callback === 'function') {
                callback();
            }
        } else {
            // Output buffer could be array of arrays, so combine into something usable.
            if (Array.isArray(properties.serverOutput) && properties.serverOutput.length) {
                outputString = properties.serverOutput.join('\n');
                outputLines = outputString.split('\n');
                properties.serverOutput = [];
            }
            for (let line of outputLines) {
                if (line.indexOf('eula.txt') !== -1) {
                    properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                    properties.serverOutput.length = 0;
                    properties.serverOutputCaptured = false;
                    shouldContinueStart = false;
                    console.log('The Minecraft EULA needs to be accepted. MinecraftServer start aborted.');
                    console.log('Use the web interface to view and accept the Minecraft license agreement, or accept it manually.');
                    // if (!properties.eulaFound) {
                    //     this.getEula();
                    // }
                    if (typeof callback === 'function') {
                        this.stop(callback);
                    }
                } else if (line.toLowerCase().indexOf('failed') !== -1) {
                    // TODO: Get smarter here and show the error
                    console.log('An error occurred starting MinecraftServer. Check the Minecraft log.');
                    properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                    properties.serverOutput.length = 0;
                    properties.serverOutputCaptured = false;
                    shouldContinueStart = false;
                } else if (line.toLowerCase().indexOf('stopping server') !== -1) {
                    // TODO: Get smarter here and show the error
                    console.log('An error occurred starting MinecraftServer. Check the Minecraft log.');
                    properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                    properties.serverOutput.length = 0;
                    properties.serverOutputCaptured = false;
                    shouldContinueStart = false;
                } else if (line.indexOf('server version') !== -1) {
                    versionParts = line.split('.');
                    major = versionParts.shift();
                    minor = versionParts.shift();
                    release = versionParts.shift().trim() || "0";
                    versionParts = major.split('version ');
                    major = versionParts[versionParts.length - 1];
                    properties.detectedVersion.major = parseInt(major);
                    properties.detectedVersion.minor = parseInt(minor);
                    properties.detectedVersion.release = parseInt(release);
                    properties.detectedVersion.full = major + '.' + minor + '.' + release;
                    console.log('Detected MinecraftServer version: ' + properties.detectedVersion.full);
                    shouldContinueStart = true;
                } else if (!properties.started && line.indexOf('Done') !== -1) {
                    console.log('MinecraftServer started.');
                    properties.installed = true;
                    properties.started = true;
                    properties.startTime = Date.now();
                    properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                    properties.serverOutput.length = 0;
                    properties.serverOutputCaptured = false;
                    shouldContinueStart = false;
                }
            }

            if (!properties.started && shouldContinueStart) {
                properties.startedTimer = setTimeout(() => {
                    this.checkForMinecraftToBeStarted(++checkCount, callback);
                }, 100);
            } else {
                this.updateStatus(() => {
                    this.listCommands(0, callback);
                });
            }
        }
    }

    checkForMinecraftToBeStopped (checkCount, callback) {
        if (debugMinecraftServer) {
            console.log('Checking for MinecraftServer process to be stopped('+ checkCount +')...');
        }

        let properties = this.properties;
        let threshold = 1000;

        if (checkCount > threshold) {
            // Pop back out. Minecraft may or may not ever be stopped.
            properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
            properties.serverOutputCaptured = false;
            properties.serverProcess.kill();
            properties.serverOutput.length = 0;
            properties.started = false;
            properties.startTime = null;
            properties.stopping = false;
            properties.stopped = true;
            properties.allowedCommands = [];
            console.log('MinecraftServer was forced to stop.');
            if (typeof callback === 'function') {
                callback();
            }
        } else {
            properties.serverOutput.forEach((line) => {
                if (line.indexOf('Saving') !== -1 || line.indexOf('Stopping server') !== -1) {
                    console.log('MinecraftServer stopped.');
                    properties.started = false;
                    properties.startTime = null;
                    properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                    properties.serverOutputCaptured = false;
                    properties.serverOutput.length = 0;
                    properties.stopping = false;
                    properties.serverProcess.kill();
                    properties.stopped = true;
                    properties.allowedCommands = [];
                    properties.playerInfo = {players: [], summary: ''};
                }
            });

            if (properties.started) {
                properties.stoppedTimer = setTimeout(() => {
                    this.checkForMinecraftToBeStopped(++checkCount, callback);
                }, 500);
            } else {
                if (typeof callback === 'function') {
                    callback();
                }
            }
        }
    }

    checkForMinecraftUpdate () {
        if (debugMinecraftServer) {
            console.log('Checking for Minecraft server update...');
        }

        let detectedVersion = this.properties.detectedVersion;
        let release = {major: '', minor: '', release: '', full: ''};
        let releaseVersions = this.properties.versions.releaseVersions;

        this.getMinecraftVersions(() => {
            if (this.properties.detectedVersion) {
                // check to see if detected < latest, set properties.updateAvailable to true
                for (let r = 0; r < releaseVersions.length; r++) {
                    release.full = releaseVersions[r].id;
                    let releaseParts = release.full.split('.');
                    release.major = parseInt(releaseParts[0]);
                    release.minor = parseInt(releaseParts[1]);
                    release.release = parseInt(releaseParts[2]) || 0;
                    if (release.full !== detectedVersion.full) {
                        if (release.major > detectedVersion.major) {
                            this.properties.updateAvailable = true;
                            break;
                        } else if (release.major == detectedVersion.major && release.minor > detectedVersion.minor) {
                            this.properties.updateAvailable = true;
                            break;
                        } else if (release.major == detectedVersion.major && release.minor == detectedVersion.minor && release.release > detectedVersion.release) {
                            this.properties.updateAvailable = true;
                            break;
                        }
                    } else {
                        this.properties.updateAvailable = false;
                        break;
                    }
                }
            }

            if (debugMinecraftServer) {
                console.log('Done checking for Minecraft server update.');
            }
        });
    }
    /**
     * Grabs and stores the home directory of the java executable found in PATH
     * @param  {Function=} callback Called once path has been successfully found
     */
    detectJavaHome (callback) {
        if (debugMinecraftServer) {
            console.log('Detecting Java home path...');
        }
        let properties = this.properties;
        // Requst javas internal properties, that are printed to 'stderror'
        exec('java -XshowSettings:properties -version', (error, stdout, stderr) => {
            if (error) {
                console.log('Could not find the java executable. Make sure Java is properly installed.');
                console.log(stderr);
                throw error;
            } else {
                // RegExp that matches the line 'java.home = [path_to_home]'
                const javaHomeRegExp = /^\s*java.home/;
                // Finds and normalizes the java home path
                properties.javaHome = path.normalize(stderr
                    // Loop through lines as an array
                    .split(os.EOL)
                    // Find the first line that matches our regexp
                    .find(line => javaHomeRegExp.test(line))
                    // Split the line in two and return the path
                    .split(/\s*=\s*/)[1]);
                properties.javaPath = path.join(properties.javaHome, 'bin', 'java');
                if (debugMinecraftServer) {
                    console.log(`Using java from ${properties.javaPath}`);
                }
            }
            if (debugMinecraftServer) {
                console.log('Done detecting Java home path.');
            }
            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    detectMinecraftDir () {
        // find the Minecraft server directory
        if (debugMinecraftServer) {
            console.log('Detecting MinecraftServer directory...');
        }

        let properties = this.properties;

        try {
            fs.accessSync(properties.pathToMinecraftDirectory, FS.F_OK | FS.R_OK | FS.W_OK);
            console.log('Found MinecraftServer directory.');
        } catch (e) {
            console.log('MinecraftServer directory does not exist.');
            if (debugMinecraftServer) {
                console.log('An error occurred reading the Minecraft server directory:', e.stack);
            }
        }

        if (debugMinecraftServer) {
            console.log('Done detecting MinecraftServer directory.');
        }
    }

    detectMinecraftJar () {
        // find the server.jar to run.
        // We download versions and name them {release}_minecraft_server.jar in the install function.
        if (debugMinecraftServer) {
            console.log('Detecting MinecraftServer jar...');
        }

        let properties = this.properties;
        let minecraftFiles = [];

        properties.installedVersions = [];

        try {
            minecraftFiles = fs.readdirSync(properties.pathToMinecraftDirectory);
            minecraftFiles.forEach(file => {
                // detect versions we've installed.
                if (file.indexOf('_minecraft_server.jar') !== -1) {
                    properties.installedVersions.push(file);
                // detect running versions.
                } else if (file.indexOf('server.jar') !== -1) {
                    properties.installed = true;
                    properties.needsInstallation = false;
                    properties.serverJar = file;
                    console.log('Found Minecraft jar.');
                }
            });
        } catch (e) {
            console.log('MinecraftServer not installed.');
            properties.installed = false;
            if (debugMinecraftServer) {
                console.log(e.stack);
            }
        }

        if (properties.installedVersions && !properties.installed) {
            console.log('Found a server but not starting it.');
            properties.installed = false;
            properties.needsInstallation = true;
        }

        if (debugMinecraftServer) {
            console.log('Done detecting MinecraftServer jar.');
        }
    }

    determineBanStatus (player) {
        if (debugMinecraftServer) {
            console.log('Determining ban status for player:', player.name);
        }

        let properties = this.properties;
        let banned = false;
        let bannedPlayer;

        if (properties.bannedPlayers.length) {
            for (bannedPlayer in properties.bannedPlayers) {
                if (bannedPlayer.name === player.name) {
                    banned = true;
                }
            }
        }

        return banned;
    }

    determineOpStatus (player) {
        if (debugMinecraftServer) {
            console.log('Determining op status for player:', player.name);
        }

        let properties = this.properties;
        let op = false;
        let oppedPlayer;

        if (properties.ops.length) {
            for (oppedPlayer in properties.ops) {
                if (oppedPlayer.name === player.name) {
                    op = true;
                }
            }
        }

        return op;
    }

    determineWhitelistStatus (player) {
        if (debugMinecraftServer) {
            console.log('Determining whitelist status for player:', player.name);
        }

        let properties = this.properties;
        let whitelisted = false;
        let whitelistedPlayer;

        if (properties.whitelist.length) {
            for (whitelistedPlayer in properties.whitelist) {
                if (whitelistedPlayer.name === player.name) {
                    whitelisted = true;
                }
            }
        }

        return whitelisted;
    }

    downloadRelease (version, callback) {
        let minecraftVersionInfo = [],
            properties = this.properties,
            pathToMinecraftDirectory = properties.pathToMinecraftDirectory,
            release = properties.versions.releaseVersions[0];

        if (version && version !== 'latest') {
            properties.versions.releaseVersions.forEach(releaseVersion => {
                if (releaseVersion.id === version) {
                    release = releaseVersion;
                }
            });
        }

        console.log('Fetching release information for:', release.id);
        https.get(release.url, (res) => {
            res.on('data', (d) => {
                minecraftVersionInfo.push(d);
            });
            res.on('end', () => {
                try {
                    minecraftVersionInfo = JSON.parse(minecraftVersionInfo.join(''));
                    if (minecraftVersionInfo.downloads && minecraftVersionInfo.downloads.server && minecraftVersionInfo.downloads.server.url) {
                        console.log('Downloading Minecraft server...');
                        let jar = release.id + '_minecraft_server.jar';
                        let fileStream = fs.createWriteStream(path.join(pathToMinecraftDirectory, jar));
                        https.get(minecraftVersionInfo.downloads.server.url, (aJar) => {
                            aJar.pipe(fileStream);
                            fileStream.on('finish', ()  => {
                                fileStream.close();  // close() is async.
                                // TODO: Verify download hash.
                                // properties.serverJar = jar;
                                properties.installedVersions.push(jar);
                                console.log('Download of Minecraft server version ' + release.id + ' complete.');
                                if (typeof callback === 'function') {
                                    callback();
                                }
                            });
                        });
                    } else {
                        console.log('Minecraft server version ' + release.id + 'not available for installation.');
                    }
                } catch (e) {
                    console.log('An error occurred processing the Minecraft official version list:', e.stack);
                    console.log(minecraftVersionInfo.join(''));
                }
            });
        }).on('error', (e) => {
            console.error('An error occurred retrieving the Minecraft official version list:', e.stack);
        });
    }

    getBannedIps () {
        let properties = this.properties;

        if (properties.eulaFound) {
            if (debugMinecraftServer) {
                console.log('Getting MinecraftServer banned IPs...');
            }

            try {
                properties.bannedIps = JSON.parse(fs.readFileSync(path.join(properties.pathToMinecraftDirectory, 'banned-ips.json'), 'utf8'));
            } catch (e) {
                properties.bannedIps = [];
                if (debugMinecraftServer) {
                    console.log('Failed to read banned-ips.json:', e.stack);
                }
            }
        }
    }

    getBannedPlayers () {
        let properties = this.properties;

        if (properties.eulaFound) {
            if (debugMinecraftServer) {
                console.log('Getting MinecraftServer banned players...');
            }

            try {
                properties.bannedPlayers = JSON.parse(fs.readFileSync(path.join(properties.pathToMinecraftDirectory, 'banned-players.json'), 'utf8'));
            } catch (e) {
                properties.bannedPlayers = [];
                if (debugMinecraftServer) {
                    console.log('Failed to read banned-players.json:', e.stack);
                }
            }
        }
    }

    getCommand (line, required, optional) {
        let start = 0;
        let end = 0;
        let arg;
        let args = [];
        let startChar, endChar;

        if (required) {
            startChar = '<';
            endChar = '>';
        }
        if (optional) {
            startChar = '[';
            endChar = ']';
        }

        while (start !== -1) {
            start = line.indexOf(startChar, end);
            end = line.indexOf(endChar, start);

            if (start !== -1) {
                let option = line.substr(start + 1, end - start - 1);
                let options = option.concat(line.substr(end + 1, line.indexOf(' ', end + 1) - end - 1));
                if (options.indexOf('|') !== -1) {
                    let args2 = options.split('|');
                    while ( (arg = args2.shift()) !== undefined ) {
                        args.push(arg);
                    }
                } else {
                    args.push(options);
                }
                start = line.indexOf(startChar, end);
            }
        }

        return args;
    }

    getEula () {
        if (debugMinecraftServer) {
            console.log('Getting MinecraftServer EULA acceptance state...');
        }

        let eula;
        let eulaUrlLine;
        let line;
        let lineNumber;
        let properties = this.properties;

        if (debugMinecraftServer) {
            console.log('Reading MinecraftServer eula.txt...');
        }
        try {
            eula = fs.readFileSync(path.join(this.properties.pathToMinecraftDirectory, 'eula.txt'), 'utf8').split(/\n/);

            for (lineNumber = 0; lineNumber < eula.length; lineNumber++) {
                if (eula[lineNumber]) {
                    eulaUrlLine = eula[lineNumber].split('https://');
                    if (eulaUrlLine.length == 2) {
                        properties.eulaUrl = 'https://' + eulaUrlLine[1].substr(0, eulaUrlLine[1].indexOf(')'));
                        if (debugMinecraftServer) {
                            console.log('MinecraftServer EULA location: ' + properties.eulaUrl);
                        }
                    }
                    line = eula[lineNumber].split('=');
                    if (line.length == 2) {
                        properties.acceptedEula = !!JSON.parse(line[1]);
                        if (debugMinecraftServer) {
                            console.log('MinecraftServer EULA accepted?', properties.acceptedEula);
                        }
                    }
                }
            }
            properties.eulaFound = true;
            properties.installed = true;
        } catch (e) {
            console.log('Failed to read eula.txt.');
            if (debugMinecraftServer) {
                console.log(e.stack);
            }
            console.log('Minecraft probably needs to be run once to stage new files.');
            console.log('Use the web interface to start the Minecraft server and accept the license agreement.');
            properties.eulaFound = false;
            properties.installed = false;
        }
    }

    getMinecraftVersions (callback) {
        // TODO enable snapshot updates with a property/preference
        let minecraftVersionsArray = [],
            minecraftVersions = {},
            releaseVersions = [],
            snapshotVersions = [];

        https.get('https://launchermeta.mojang.com/mc/game/version_manifest.json', (res) => {
            res.on('data', (d) => {
                minecraftVersionsArray.push(d);
            });
            res.on('end', () => {
                try {
                    minecraftVersions = JSON.parse(minecraftVersionsArray.join(''));
                    if (debugMinecraftServer) {
                        console.log('Got Minecraft version list.');
                    }
                    minecraftVersions.versions.forEach(version => {
                        if (version.type === 'release') {
                            releaseVersions.push(version);
                        } else if (version.type === 'snapshot') {
                            snapshotVersions.push(version);
                        }
                    });
                    this.properties.versions = { "releaseVersions": releaseVersions, "snapshotVersions": snapshotVersions };
                    if (typeof callback === 'function') {
                        callback();
                    }
                } catch (e) {
                    console.log('An error occurred processing the Minecraft official version list:', e.stack);
                    console.log(minecraftVersionsArray.join(''));
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            });
        }).on('error', (e) => {
            console.error('An error occurred retrieving the Minecraft official version list:', e.stack);
            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    getOps () {
        if (debugMinecraftServer) {
            console.log('Getting MinecraftServer ops...');
        }

        let properties = this.properties;

        if (this.properties.eulaFound) {
            try {
                properties.ops = JSON.parse(fs.readFileSync(path.join(properties.pathToMinecraftDirectory, 'ops.json'), 'utf8'));
            } catch (e) {
                properties.ops = [];
                if (debugMinecraftServer) {
                    console.log('Failed to read ops.json:', e.stack);
                }
            }
        }
    }

    getServerProperties () {
        if (debugMinecraftServer) {
            console.log('Getting MinecraftServer properties...');
        }

        let properties = this.properties;

        if (this.properties.eulaFound) {
            try {
                let serverPropertiesFile = fs.readFileSync(path.join(properties.pathToMinecraftDirectory, 'server.properties'), 'utf8');
                properties.serverProperties = convertPropertiesToObjects(serverPropertiesFile);
            } catch (e) {
                properties.serverProperties = [];
                if (debugMinecraftServer) {
                    console.log('Failed to read server.properties:', e.stack);
                }
            }
        }
    }

    getUserCache () {
        if (debugMinecraftServer) {
            console.log('Getting MinecraftServer user cache...');
        }

        let properties = this.properties;

        if (this.properties.eulaFound) {
            try {
                properties.userCache = JSON.parse(fs.readFileSync(path.join(properties.pathToMinecraftDirectory, 'usercache.json'), 'utf8'));
            } catch (e) {
                properties.userCache = [];
                if (debugMinecraftServer) {
                    console.log('Failed to read usercache.json:', e.stack);
                }
            }
        }
    }

    getWhitelist () {
        if (debugMinecraftServer) {
            console.log('Getting MinecraftServer whitelist...');
        }

        let properties = this.properties;

        if (properties.eulaFound) {
            try {
                properties.whitelist = JSON.parse(fs.readFileSync(path.join(properties.pathToMinecraftDirectory, 'whitelist.json'), 'utf8'));
            } catch (e) {
                properties.whitelist = [];
                if (debugMinecraftServer) {
                    console.log('Failed to read whitelist.json:', e.stack);
                }
            }
        }
    }

    install (version, callback) {

        let download = false,
            jar = '',
            properties = this.properties,
            pathToMinecraftDirectory = properties.pathToMinecraftDirectory,
            release = properties.versions.releaseVersions[0],
            serverJar = properties.serverJar;

        // version is optional; assume latest if missing.
        if (typeof version === 'function') {
            callback = version;
            version = 'latest';
        }

        this.detectMinecraftJar();

        properties.versions.releaseVersions.forEach(releaseVersion => {
            if (releaseVersion.id === version) {
                release = releaseVersion;
            }
        });

        if (properties.installedVersions.length > 0) {
            for (let installedVersion of properties.installedVersions) {
                if (installedVersion.indexOf(release.id) !== -1) {
                    // already downloaded.
                    download = false;
                    jar = installedVersion;
                    break;
                }
            }
            if (!jar) {
                download = true;
                jar = release.id + '_minecraft_' + serverJar;
            }
        } else {
            download = true;
            jar = release.id + '_minecraft_' + serverJar;
        }

        let copyCallback = function () {
            this.stop(() => {
                let jarPath = path.join(pathToMinecraftDirectory, jar);
                let serverJarPath = path.join(pathToMinecraftDirectory, serverJar);

                console.log("Deleting Minecraft server version:", properties.detectedVersion.full, "...");
                try {
                    fs.unlinkSync(serverJarPath);
                } catch (e) {
                    if (e.code !== 'ENOENT') {
                        if (typeof callback === 'function') {
                            callback();
                        }
                        throw e;
                    }
                }

                console.log('Installing MinecraftServer version', version, '...');
                try {
                    fs.copyFileSync(jarPath, serverJarPath);
                } catch (e) {
                    if (typeof callback === 'function') {
                        callback();
                    }
                    throw e;
                }
                properties.installed = true;
                properties.needsInstallation = false;

                if (debugMinecraftServer) {
                    console.log('Done installing MinecraftServer.');
                }

                // TODO: Only create new world on downgrade.
                let majorminorrelease = properties.detectedVersion.major + '.' + properties.detectedVersion.minor + '.' + properties.detectedVersion.release;
                properties.detectedVersion = {major: '', minor: '', release: ''};
                if (version !== majorminorrelease) {
                    this.newWorld(false, callback);
                } else {
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            });
        }.bind(this);

        if (download) {
            this.downloadRelease(release.id, copyCallback);
        } else {
            copyCallback();
        }
    }

    listCommands (checkCount, callback) {
        let properties = this.properties;
        let serverOutputCaptured = properties.serverOutputCaptured;
        let serverOutput = properties.serverOutput;
        let serverProcess = properties.serverProcess;
        let started = properties.started;
        let threshold = 100;

        if (!checkCount) {
            checkCount = 0;
        }

        if (checkCount < threshold) {
            if (started && !serverOutputCaptured) {
                properties.allowedCommands = [];
                serverOutputCaptured = true;
                serverOutput.length = 0;
                serverProcess.stdout.addListener('data', this.bufferMinecraftOutput);

                serverProcess.stdin.write('/help\n');

                setTimeout(() => {
                    this.waitForHelpOutput(serverOutput, callback);
                }, 100);
            } else if (started) {
                setTimeout(() => {
                    this.listCommands(++checkCount, callback);
                }, 1000);
            } else {
                console.log('Minecraft appears to not be running. Cannot fetch commands.');
                if (typeof callback === 'function') {
                    callback();
                }
            }
        } else {
            console.log('Cannot fetch commands.');
            if (typeof callback === 'function') {
                callback();
            }
        }
    }

    listPlayers (callback) {
        if (debugMinecraftServer) {
            console.log('Listing Minecraft players.');
        }

        let properties = this.properties;
        let serverOutputCaptured = properties.serverOutputCaptured;
        let serverOutput = properties.serverOutput;
        let serverProcess = properties.serverProcess;
        let started = properties.started;
        let playersList = {
            summary: '',
            players: []
        };
        let somePlayerNames, somePlayerName;
        let minecraftLogTimeRegex = /\[[0-2]?[0-9]:[0-5]?[0-9]:[0-5]?[0-9]\] /;
        let minecraftLogPrefixRegex = /\[\w*\s\w*\/\w*\]:/;

        // Get current online players
        if (started && !serverOutputCaptured) {
            serverOutputCaptured = true;
            serverOutput.length = 0;
            serverProcess.stdout.addListener('data', this.bufferMinecraftOutput);
            serverProcess.stdin.write('/list\n');
            setTimeout(function () {
                serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                // First line is the summary,
                // followed by player names, comma+space separated.
                let output = serverOutput.join('');
                let player, players, playersSummary;
                players = output.split(minecraftLogTimeRegex).filter(function (value) {
                    return value !== "";
                });
                if (players && players.length > 0) {
                    for (let i = 0; i < players.length; i++) {
                        if (players[i]) {
                            players[i] = players[i].split(minecraftLogPrefixRegex)[1];
                            players[i].trim();
                        }
                    }
                    playersSummary = players.shift();
                    players = players.filter(function (value) {
                        return value !== "";
                    });
                } else {
                    players = [];
                    playersSummary = '';
                }

                playersList.summary = playersSummary.trim().slice(0, -1);

                if (players && players.length) {
                    // Get online player names
                    for (let i = 0; i < players.length; i++) {
                        // Versions prior to 1.13 do not contain preceding
                        // timestamp & server info
                        somePlayerNames = players[i].split(']: ')[1];
                        if (somePlayerNames && somePlayerNames.length) {
                            somePlayerNames = somePlayerNames.split(',');
                        } else {
                            somePlayerNames = players;
                        }

                        if (somePlayerNames) {
                            for (let p = 0; p < somePlayerNames.length; p++) {
                                somePlayerName = somePlayerNames[p];
                                if (somePlayerName) {
                                    // Make sure to check for multiple spaces so as to
                                    // ignore any bad data like things that were
                                    // accidentally in the buffer at the same time we
                                    // queried, etc.
                                    let testData = somePlayerName.split(' ');
                                    if (testData.length <= 2) {
                                        player = {
                                            name: somePlayerName.trim(),
                                            online: true
                                        };
                                    } else {
                                        for (let d = 0; d , testData.length; d++) {
                                            if (testData[d]) {
                                                player = {
                                                    name: testData[d].trim(),
                                                    online: true
                                                };
                                            }
                                        }
                                    }
                                    for (let cachedPlayer of properties.userCache) {
                                        if (cachedPlayer.name === player.name) {
                                            player.key = cachedPlayer.uuid;
                                        }
                                    }
                                    player.banned = this.determineBanStatus(player);
                                    player.opped = this.determineOpStatus(player);
                                    player.whitelisted = this.determineWhitelistStatus(player);
                                    playersList.players.push(player);
                                }
                            }
                        }
                    }
                } else {
                    for (let cachedPlayer of properties.userCache) {
                        cachedPlayer.key = cachedPlayer.uuid;
                        cachedPlayer.banned = this.determineBanStatus(cachedPlayer);
                        cachedPlayer.opped = this.determineOpStatus(cachedPlayer);
                        cachedPlayer.whitelisted = this.determineWhitelistStatus(cachedPlayer);
                        playersList.players.push(cachedPlayer);
                    }
                }

                serverOutputCaptured = false;
                serverOutput.length = 0;
                properties.playerInfo = playersList;

                if (typeof callback === 'function') {
                    callback(playersList);
                } else {
                    return playersList;
                }
            }.bind(this), 250);
        } else {
            if (typeof callback === 'function') {
                callback(playersList);
            } else {
                return playersList;
            }
        }
    }

    listWorldBackups () {
        if (debugMinecraftServer) {
            console.log('Getting list of MinecraftServer world backups...');
        }

        let properties = this.properties;

        // TODO Allow backup path to be set
        let backupDir = path.join(properties.pathToMinecraftDirectory, 'worldBackups');
        let backupList = [];
        let files = [];

        try {
            files = fs.readdirSync(backupDir);

            files.forEach(file => {
                let fileInfo,
                    fileItem = {},
                    fileParts = file.split('.');

                if (fileParts[1] === 'zip') {
                    fileInfo = fileParts[0].split('_');
                    fileItem.fileName = file;
                    fileItem.worldName = fileInfo[0];
                    fileItem.date = fileInfo[1];
                    fileItem.time = fileInfo[2];
                    backupList.push(fileItem);
                }
            });

            properties.backupList = backupList;
        } catch (e) {
            console.log(e.stack);
        }
    }

    newWorld (backupWorld, callback) {
        if (debugMinecraftServer) {
            console.log('Deleting MinecraftServer world...');
        }

        let properties = this.properties;
        let worldName = '';
        for (let item in properties.serverProperties) {
            if (item.name === 'level-name') {
                worldName = item.value;
            }
        }
        if (!worldName) {
            worldName = 'world';
        }

        backupWorld = backupWorld || false;

        let worldPath = path.join(properties.pathToMinecraftDirectory, worldName);

        if (backupWorld) {
            this.backupWorld(() => {
                try {
                    fs.accessSync(worldPath, FS.F_OK | FS.R_OK | FS.W_OK);

                    console.log('World to be deleted: ' + worldPath);
                    fs.removeSync(worldPath);
                    console.log('World deleted after backup.');
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
                catch (e) {
                    console.log('An error occurred deleting world data:', e.stack);
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            });
        } else {
            try {
                fs.accessSync(worldPath, FS.F_OK | FS.R_OK | FS.W_OK);

                console.log('World to be deleted: ' + worldPath);
                fs.removeSync(worldPath);
                console.log('World deleted.');
                if (typeof callback === 'function') {
                    callback();
                }
            }
            catch (e) {
                console.log('An error occurred deleting world data: Specified world probably doesn\'t exist.', e.stack);
                if (typeof callback === 'function') {
                    callback();
                }
            }
        }
    }

    parseHelpOutput (callback) {
        let properties = this.properties;
        let minecraftFullHelp = properties.fullHelp;
        let minecraftOutput = properties.serverOutput;
        let line;

        properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);

        while ( (line = minecraftOutput.shift()) !== undefined ) {
            let command = {};
            let commandLine = line.split(' [Server thread/INFO]: ');

            if (commandLine.length > 1 && commandLine[1].indexOf('/') === 0) {
                let aThing = {};
                aThing.key = minecraftFullHelp.length;
                aThing.command = commandLine[1];
                this.properties.fullHelp.push(aThing);
                let commandLineSpaces = commandLine[1].split(' ');
                let args = [];
                let commands = [];

                command = {
                    command: commandLineSpaces[0].substr(commandLineSpaces[0].indexOf('/') + 1)
                };

                commandLineSpaces.shift();

                if (commandLine[1].indexOf(' OR ') !== -1) {
                    commands = commandLine[1].split(' OR ');
                } else {
                    commands.push(commandLine[1]);
                }

                args.length = 0;
                for (let c of commands) {
                    let things = this.getCommand(c, true, false);
                    for (let thing of things) {
                        args.push(thing);
                    }
                }
                if (args.length) {
                    let requiredArgs = new Set(args);
                    command['requiredArgs'] = Array.from(requiredArgs);
                }

                args.length = 0;
                for (let c of commands) {
                    let things = this.getCommand(c, false, true);
                    for (let thing of things) {
                        args.push(thing);
                    }
                }
                if (args.length) {
                    let optionalArgs = new Set(args);
                    command['optionalArgs'] = Array.from(optionalArgs);
                }

                properties.allowedCommands.push(command);
            }
        }

        properties.serverOutput.length = 0;
        properties.serverOutputCaptured = false;
        if (typeof callback === 'function') {
            callback();
        }
    }

    /**
     * Executes a Minecraft command against the Minecraft server.
     * @param {string} command A Minecraft command to execute.
     * @param {function} callback An optional function to call when complete.
     */
    runCommand (command, callback) {
        // TODO: make sure command passed is valid
        if (debugMinecraftServer) {
            console.log('Running Minecraft command.');
        }

        let properties = this.properties;
        let serverOutputCaptured = properties.serverOutputCaptured;
        let serverOutput = properties.serverOutput;
        let serverProcess = properties.serverProcess;
        let started = properties.started;

        if (started && !serverOutputCaptured) {
            serverOutputCaptured = true;
            serverOutput.length = 0;
            serverProcess.stdout.addListener('data', this.bufferMinecraftOutput);

            serverProcess.stdin.write(command + '\n');
            setTimeout(function () {
                serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                serverOutputCaptured = false;
                for (let i = 0; i < serverOutput.length; i++) {
                    // Remove Minecraft server timestamp info
                    serverOutput[i] = serverOutput[i].split(']: ')[1];
                }
                let output = serverOutput.join('\n');
                serverOutput.length = 0;
                if (typeof callback === 'function') {
                    callback(output);
                } else {
                    return output;
                }
            }.bind(this), 250);
        } else {
            setTimeout(() => {
                this.runCommand(command, callback);
            }, 1000);
        }
    }

    /**
     * Saves server properties to disk for use on Minecraft server start.
     * @param {object} newProperties Contains the new properties to save to disk,
     * @param {*} callback An optional function to call when complete.
     */
    saveProperties (newProperties, callback) {
        let contents = convertObjectsToProperties(newProperties);
        let properties = this.properties;
        let propertiesFile = path.join(properties.pathToMinecraftDirectory, 'server.properties');
        let backupPropertiesFile = path.join(properties.pathToMinecraftDirectory, getDateTime() + '-server.properties');
        try {
            // Backup current properties file
            fs.copyFileSync(propertiesFile, backupPropertiesFile);
            this.stop(() => {
                try {
                    fs.writeFileSync(propertiesFile, contents);
                    // For some reason, `this.start(callback);` introduces inconsistent timing issues.
                    this.start(() => {
                        callback(contents);
                    });
                    // this.start(callback);
                } catch (e) {
                    console.log('An error occurred saving the new properties file.', e);
                    if (typeof callback === 'function') {
                        callback(contents);
                    }
                }
            });
        } catch (e) {
            console.log('An error occurred backing up the current properties file.', e);
            if (typeof callback === 'function') {
                callback(contents);
            }
        }
    }

    /**
     * Starts the Minecraft server process.
     * @param {function} callback An optional function to call when complete.
     */
    start (callback) {
        // TODO: Fix the async-ness of detectJavaHome
        if (this.properties.installed) {
            this.detectJavaHome( () => {
                console.info('Starting MinecraftServer...');

                let properties = this.properties;
                let javaPath = properties.javaPath;
                let pathToMinecraftDirectory = properties.pathToMinecraftDirectory;
                let serverJar = properties.serverJar;
                let serverOutput = properties.serverOutput;
                let serverOutputCaptured = properties.serverOutputCaptured;
                let serverProcess = properties.serverProcess;
                let startedTimer = properties.startedTimer;
                let starting = properties.starting;

                if (javaPath) {
                    if (!serverOutputCaptured && !starting) {
                        if (startedTimer) {
                            clearTimeout(startedTimer);
                        }
                        try {
                            fs.accessSync(path.join(pathToMinecraftDirectory, serverJar), FS.F_OK | FS.R_OK | FS.W_OK);
                            // TODO: Make the Java + args configurable
                            serverProcess = properties.serverProcess = spawn(javaPath, [
                                '-Xmx1G',
                                '-Xms1G',
                                '-jar',
                                serverJar,
                                'nogui'
                            ], {
                                cwd: pathToMinecraftDirectory,
                                stdio: [
                                    'pipe', // Use parent's stdin for child stdin
                                    'pipe', // Pipe child's stdout to parent stdout
                                    'pipe'  // Direct child's stderr to parent stderr
                                ]
                            });
                        } catch (e) {
                            console.log('MinecraftServer executable not found.');
                            if (debugMinecraftServer) {
                                console.error(e.stack);
                            }
                            if (typeof callback === 'function') {
                                callback();
                            }
                        }

                        starting = true;
                        serverOutput.length = 0;
                        serverProcess.stdout.addListener('data', this.bufferMinecraftOutput);
                        serverOutputCaptured = true;
                        if (startedTimer) {
                            clearTimeout(startedTimer);
                        }

                        startedTimer = setTimeout(() => {
                            this.checkForMinecraftToBeStarted(0, callback);
                        }, 100);

                    } else if (starting && serverOutputCaptured) {
                        clearTimeout(startedTimer);
                        startedTimer = setTimeout(() => {
                            this.checkForMinecraftToBeStarted(0, callback);
                        }, 100);
                    } else if (serverOutputCaptured) {
                        // Something is already attached to serverOutput. Wait and try again.
                        setTimeout(() => {
                            this.start(callback);
                        }, 1000);
                    } else {
                        // TODO: Not sure yet what to do here.
                        if (typeof callback === 'function') {
                            callback();
                        }
                    }
                } else {
                    console.log('JAVA_HOME not set.');
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            });
        } else {
            if (typeof callback === 'function') {
                callback();
            }
        }
    }

    /**
     * Stops the Minecraft server process.
     * @param {function} callback An optional function to call when complete.
     */
    stop (callback) {
        console.log('Stopping MinecraftServer...');

        let properties = this.properties;
        let serverOutput = properties.serverOutput;
        let serverProcess = properties.serverProcess;
        let serverOutputCaptured = properties.serverOutputCaptured;
        let started = properties.started;
        let stoppedTimer = properties.stoppedTimer;
        let stopping = properties.stopping;

        if (started) {
            if (!serverOutputCaptured && !stopping) {
                serverOutputCaptured = true;
                stopping = true;
                properties.stopped = false;
                if (stoppedTimer) {
                    clearTimeout(stoppedTimer);
                    properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                }
                serverOutput.length = 0;
                serverProcess.stdout.addListener('data', this.bufferMinecraftOutput);
                serverProcess.stdin.write('/stop\n');
                stoppedTimer = setTimeout(() => {
                    this.checkForMinecraftToBeStopped(0, callback);
                }, 1000);
            // } else if (stopping && serverOutputCaptured) {
            //     clearTimeout(stoppedTimer);
            //     stoppedTimer = setTimeout(() => {
            //         this.checkForMinecraftToBeStopped(0, callback);
            //     }, 1000);
            } else {
                // Someone is using the output stream, wait a bit.
                setTimeout(() => {
                    this.stop(callback);
                }, 1000);
            }
        } else {
            stopping = false;
            properties.stopped = true;
            if (typeof callback === 'function') {
                callback();
            }
        }
    }

    /**
     * Reads the current state of files from the Minecraft server and gets
     * player status if running.
     * @param {function} callback An optional function to call when complete.
     */
    updateStatus (callback) {
        if (this.properties.installed) {
            this.getEula();
            this.getServerProperties();
            this.getUserCache();
            this.getOps();
            this.getBannedIps();
            this.getBannedPlayers();
            this.getWhitelist();
            this.checkForMinecraftUpdate();
            // if (this.properties.started) {
            if (this.properties.serverProcess.pid) {
                this.listPlayers(callback);
            } else {
                if (typeof callback === 'function') {
                    callback();
                }
            }
        } else {
            this.checkForMinecraftUpdate();
            if (typeof callback === 'function') {
                callback();
            }
        }
    }

    waitForHelpOutput (buffer, callback) {
        let properties = this.properties;
        let bufferMinecraftOutput = this.bufferMinecraftOutput;
        let minecraftHelpPages =properties.helpPages;
        let minecraftServerProcess = properties.serverProcess;
        let line;

        if (!buffer) {
            buffer = properties.serverOutput;
        }

        if (buffer && buffer.length) {
            for (line of buffer) {
                if (line.indexOf('Showing help page') !== -1) {
                    // Versions prior to 1.13 "page" the help
                    properties.serverProcess.stdout.removeListener('data', bufferMinecraftOutput);
                    properties.serverOutput.length = 0;

                    let part1 = line.split('Showing help page ');
                    let part2 = part1[1].split(' ');
                    properties.helpPages = parseInt(part2[2]);

                    properties.serverProcess.stdout.addListener('data', bufferMinecraftOutput);
                    for (let i = 1; i <= minecraftHelpPages; i++) {
                        // Get all of the help at once
                        minecraftServerProcess.stdin.write('/help ' + i + '\n');
                    }
                    setTimeout(() => {
                        this.parseHelpOutput(callback);
                    }, 1000);
                    break;
                } else {
                    // Versions 1.13 and later display all of the help at once, no need to page it
                    this.parseHelpOutput(callback);
                    break;
                }
            }
        } else {
            setTimeout(() => {
                this.waitForHelpOutput(buffer, callback);
            }, 1000);
        }
    }
}

module.exports = MinecraftServer;

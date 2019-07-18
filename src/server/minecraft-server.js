// NodeJS Imports
const archiver = require('archiver');
const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const FS = fs.constants;
const https = require('https');
const os = require('os');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// minecraft-server-manager Imports
const Util = require(path.resolve('src', 'util', 'util'));

let defaultProperties = {
    settings: {
        javaHome: "",
        javaPath: "",
        minecraftDirectory: path.resolve('minecraft_server'),
        serverJar: 'server.jar',
        memory: {
            minimum: 1,
            maximum: 1,
            units: "G"
        },
        backups: {
            path: path.resolve('minecraft_server', 'backups', 'worlds'),
            numToKeep: 5
        }
    },
    settingsFileName: 'server.properties',
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
    needsInstallation: true,
    ops: [],
    osType: os.type(),
    playerInfo: {players: [], summary: ''},
    serverOutput: [],
    serverOutputCaptured: false,
    serverProperties: [],
    serverProcess: null,
    started: false,
    starting: false,
    startTime: null,
    stopping: false,
    stopped: false,
    updateAvailable: false,
    userCache: {},
    versions: {},
    whitelist: []
};

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

        this.init = this.init.bind(this);
        this.attachToMinecraft = this.attachToMinecraft.bind(this);
        this.detachFromMinecraft = this.detachFromMinecraft.bind(this);
        this.log = this.log.bind(this);
        this.clearLog = this.clearLog.bind(this);
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

        this.properties.ipAddress = require('underscore')
            .chain(require('os').networkInterfaces())
            .values()
            .flatten()
            .find({family: 'IPv4', internal: false})
            .value()
            .address;
    }
        
    async init () {
        try {
            await this.clearLog();
            await this.log('Initializing MinecraftServer...');
            await this.checkForMinecraftInstallation();
            await this.getMinecraftVersions();
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    async acceptEula () {
        this.log('Checking and accepting MinecraftServer EULA...');

        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        let eula;
        let line;
        let lineNumber;
        
        if (properties.acceptedEula === 'false' || !properties.acceptedEula) {
            await this.log('Accepting EULA...');
            try {
                eula = await fs.readFile(path.join(minecraftDirectory, 'eula.txt'), 'utf8').split(/\n/);
                for (lineNumber = 0; lineNumber < eula.length; lineNumber++) {
                    if (eula[lineNumber]) {
                        line = eula[lineNumber].split('=');
                        if (line.length == 2) {
                            eula[lineNumber] = 'eula=true';
                        }
                    }
                }
                await fs.writeFile(path.join(minecraftDirectory, 'eula.txt'), eula.join('\n'));
                await this.log('Accepted Minecraft EULA.');
                properties.acceptedEula = true;
                return Promise.resolve();
            } catch (err) {
                await this.log('Failed to read eula.txt:');
                await this.log(err);
                return Promise.reject(err);
            }
        } else {
            return Promise.resolve();
        }
    }

    async backupWorld (worldName) {
        await this.log('Backing up MinecraftServer world...');

        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        let minecraftWasRunning = false;
        let backupDir = path.resolve(properties.settings.backups.path);
        let archive;
        let output;

        worldName = worldName || 'world';
        if (properties.started) {
            minecraftRunning = true;
        }

        await fs.mkdir(backupDir, {recursive: true});

        archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });
        output = await fs.createWriteStream(path.join(backupDir, worldName + '_' + Util.getDateTime() + '.zip'));

        return new Promise((resolve, reject) => {
            archive
                .directory(path.join(minecraftDirectory, worldName), false)
                .on('error', err => reject(err))
                .pipe(output);
            
            output.on('close', async () => {
                await this.log('Backup size: ' + archive.pointer() + ' total bytes');
                await this.log('MinecraftServer World backed up.');
                await this.listWorldBackups();
                if (minecraftWasRunning) {
                    await this.start();
                }
                resolve();
            });
            archive.finalize();
        });
    }

    async checkForMinecraftInstallation () {
        this.log('Checking for Minecraft installation.');

        let properties = this.properties;
        let minecraftDirectory = path.resolve(properties.settings.minecraftDirectory);

        try {
            await fs.access(minecraftDirectory, FS.F_OK | FS.R_OK | FS.W_OK);
            await this.detectJavaHome();
            await this.detectMinecraftJar();
            return Promise.resolve();
        } catch (err) {
            this.log(`Creating directory at ${minecraftDirectory}...`);
            try {
                await fs.mkdir(minecraftDirectory);
                properties.installed = false;
                return Promise.resolve();
            } catch (er) {
                this.log('An error occurred creating the Minecraft server directory.');
                this.log(er);
                return Promise.reject(er);
            }
        }
    }

    async checkForMinecraftToBeStarted (checkCount) {
        let threshold = 20;
        let outputLines = [];
        let outputString = '';
        let versionParts = [];
        let major, minor, release;

        await this.attachToMinecraft();
        while (this.properties.serverOutput.length <= 0) {
            await this.waitForBufferToBeFull();
        }

        if (!checkCount) {
            checkCount = 0;
        }

        if (checkCount > threshold) {
            // Pop back out. Minecraft may or may not come up.
            await this.log('Failed to detect running MinecraftServer. Continuing.');
            await this.detachFromMinecraft();
            return Promise.reject(new Error('Failed to detect running Minecraft.'));
        }

        await this.log(`Checking for Minecraft to be started (${checkCount} of ${threshold})...`);

        // Output buffer could be array of arrays, so combine into something usable.
        if (Array.isArray(this.properties.serverOutput) && this.properties.serverOutput.length) {
            outputString = this.properties.serverOutput.join('\n');
            outputLines = outputString.split('\n');
        }
        for (let line of outputLines) {
            if (line.indexOf('eula.txt') !== -1) {
                this.properties.starting = false;
                this.properties.started = false;
                await this.log('The Minecraft EULA needs to be accepted. MinecraftServer start aborted.');
                await this.log('Use the web interface to view and accept the Minecraft license agreement, or accept it manually.');
                await this.detachFromMinecraft();
                await this.stop();
                return Promise.reject(new Error('The Minecraft EULA needs to be accepted.'));
            } else if (line.toLowerCase().indexOf('failed') !== -1) {
                // TODO: Get smarter here and show the error
                this.properties.starting = false;
                this.properties.started = false;
                await this.log('An error occurred starting MinecraftServer. Check the Minecraft log.');
                await this.detachFromMinecraft();
                return Promise.reject(new Error('Minecraft startup failed.'));
            } else if (line.toLowerCase().indexOf('stopping server') !== -1) {
                // TODO: Get smarter here and show the error
                this.properties.starting = false;
                this.properties.started = false;
                await this.log('An error occurred starting MinecraftServer. Check the Minecraft log.');
                await this.detachFromMinecraft();
                return Promise.reject(new Error('Minecraft startup failed.'));
            } else if (line.indexOf('server version') !== -1) {
                versionParts = line.split('.');
                major = versionParts.shift();
                minor = versionParts.shift();
                release = versionParts.shift().trim() || "0";
                versionParts = major.split('version ');
                major = versionParts[versionParts.length - 1];
                this.properties.detectedVersion.major = parseInt(major);
                this.properties.detectedVersion.minor = parseInt(minor);
                this.properties.detectedVersion.release = parseInt(release);
                this.properties.detectedVersion.full = major + '.' + minor + '.' + release;
                this.properties.starting = true;
                this.properties.started = false;
                await this.log(`Detected MinecraftServer version: ${this.properties.detectedVersion.full}`);
                continue;
            } else if (line.indexOf('Done') !== -1) {
                this.properties.started = true;
                this.properties.starting = false;
                this.properties.startTime = Date.now();
                await this.log('MinecraftServer started.');
                await this.detachFromMinecraft();
                return Promise.resolve();
            }
        }
    }

    async checkForMinecraftToBeStopped (checkCount) {
        let properties = this.properties;
        let threshold = 20;
        let outputLines = [];
        let outputString = '';

        if (!checkCount) {
            checkCount = 0;
        }

        if (checkCount > threshold) {
            // Pop back out. Minecraft may or may not ever be stopped.
            await this.log('Failed to detect Minecraft completely stopped.');
            return Promise.reject(new Error('Failed to detect Minecraft completely stopped.'));
        }

        await this.log(`Checking for Minecraft to be stopped (${checkCount} of ${threshold})...`);
        await this.waitForBufferToBeFull();
        
        // Output buffer could be array of arrays, so combine into something usable.
        if (Array.isArray(properties.serverOutput) && properties.serverOutput.length) {
            outputString = properties.serverOutput.join('\n');
            outputLines = outputString.split('\n');
        }
        for (let line of outputLines) {
            if (line.indexOf('Saving chunks') !== -1 || line.indexOf('Stopping server') !== -1) {
                await this.log('MinecraftServer stopped.');
                properties.serverProcess = {};
                properties.started = false;
                properties.startTime = null;
                properties.stopping = false;
                properties.stopped = true;
                properties.allowedCommands = [];
                properties.playerInfo = {
                    players: [],
                    summary: ''
                };
                break;
            }
        }

        if (properties.started) {
            await this.waitForBufferToBeFull();
            await this.checkForMinecraftToBeStopped(++checkCount);
        } else {
            return Promise.resolve();
        }
    }

    /**
     * Checks for a newer release of the Minecraft server jar.
     */
    async checkForMinecraftUpdate () {
        await this.log('Checking for Minecraft server update...');

        await this.getMinecraftVersions();

        let detectedVersion = this.properties.detectedVersion;
        let release = {major: '', minor: '', release: '', full: this.properties.versions.latest.release};
        let releaseParts = [];

        releaseParts = release.full.split('.');
        release.major = parseInt(releaseParts[0]);
        release.minor = parseInt(releaseParts[1]);
        release.release = parseInt(releaseParts[2]) || 0;
        if (release.full !== detectedVersion.full) {
            if (release.major > detectedVersion.major) {
                this.properties.updateAvailable = true;
                await this.log(`Minecraft version ${release.full} available.`);
            } else if (release.major == detectedVersion.major && release.minor > detectedVersion.minor) {
                this.properties.updateAvailable = true;
                await this.log(`Minecraft version ${release.full} available.`);
            } else if (release.major == detectedVersion.major && release.minor == detectedVersion.minor && release.release > detectedVersion.release) {
                this.properties.updateAvailable = true;
                await this.log(`Minecraft version ${release.full} available.`);
            }
        } else {
            this.properties.updateAvailable = false;
            await this.log('No update available.');
        }

        await this.log('Done checking for Minecraft server update.');
        return Promise.resolve();
    }

    /**
     * Gets and stores the home directory and the Java executable found in PATH.
     */
    async detectJavaHome () {
        this.log(`Detecting Java home path...`);

        let properties = this.properties;
        // Requst Java's internal properties, that are printed to 'stderr'
        const { stdout, stderr } = await exec('java -XshowSettings:properties -version');

        return new Promise (async (resolve, reject) => {
            if (stdout) {
                await this.log(`Could not find a Java executable in the environment PATH. Make sure Java is properly installed.`);
                reject(stdout);
            } else {
                // RegExp that matches the line 'java.home = [path_to_home]'
                const javaHomeRegExp = /^\s*java.home/;
                // Finds and normalizes the java home path
                let javaHome = path.normalize(stderr
                    // Loop through lines as an array
                    .split(os.EOL)
                    // Find the first line that matches our regexp
                    .find(line => javaHomeRegExp.test(line))
                    // Split the line in two and return the path
                    .split(/\s*=\s*/)[1]);
                properties.settings.javaHome = javaHome;
                properties.settings.javaPath = path.join(javaHome, 'bin', 'java');
                await this.log(`Using java from ${properties.settings.javaHome}`);
                resolve(properties.settings.javaHome);
            }
        });
    }

    async detectMinecraftJar () {
        await this.log('Detecting MinecraftServer jar...');
        let properties = this.properties;
        let settings = properties.settings;
        let minecraftDirectory = settings.minecraftDirectory;
        let installedVersions = [];
        let minecraftFiles = [];
        
        try {
            // Find a Minecraft server.jar to run.
            // We download versions and name them {release}_minecraft_server.jar in the install function.
            minecraftFiles = await fs.readdir(minecraftDirectory);
            minecraftFiles.forEach(file => {
                // Detect versions we've downloaded.
                if (file.indexOf('_minecraft_server.jar') !== -1) {
                    installedVersions.push(file);
                // Detect running versions.
                } else if (file.indexOf(settings.serverJar) !== -1) {
                    properties.installed = true;
                    properties.needsInstallation = false;
                }
            });
            properties.versions.installed = installedVersions;
            return Promise.resolve(path.resolve(minecraftDirectory, settings.serverJar));
        } catch (err) {
            properties.installed = false;
            properties.needsInstallation = true;
            return Promise.reject(err);
        }
    }

    async determineBanStatus (player) {
        await this.log(`Determining ban status for player: ${player.name}`);

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

        return Promise.resolve(banned);
    }

    async determineOpStatus (player) {
        await this.log(`Determining op status for player: ${player.name}`);

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

        return Promise.resolve(op);
    }

    async determineWhitelistStatus (player) {
        await this.log(`Determining whitelist status for player: ${player.name}`);

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

        return Promise.resolve(whitelisted);
    }

    /**
     * 
     * @param {string} version An optional version to download.
     */
    async downloadRelease (version = "lastest") {
        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        let release = properties.versions.release[0];
        let fileStream;

        if (version === "latest") {
            version = properties.versions.latest.release;
        }

        properties.versions.installed = properties.versions.installed || [];

        properties.versions.release.forEach(releaseVersion => {
            if (releaseVersion.id === version) {
                release = releaseVersion;
            }
        });

        await this.log(`Fetching release information for: ${release.id}...`);
        try {
            let response = await axios.get(release.url);
            let versionInfo = response.data;
            if (versionInfo.downloads && versionInfo.downloads.server && versionInfo.downloads.server.url) {
                let jar = `${release.id}_minecraft_server.jar`;
                let url = versionInfo.downloads.server.url
                fileStream = fs.createWriteStream(path.join(minecraftDirectory, jar));
                response = await axios({
                    url,
                    method: "GET",
                    responseType: "stream"
                });
                response.data.pipe(fileStream);
                properties.versions.installed.push(jar);
                this.log(`Download of Minecraft server version ${release.id} complete.`);
                return new Promise((resolve, reject) => {
                    fileStream.on("finish", resolve);
                    fileStream.on("error", reject);
                });
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }

    async getBannedIps () {
        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;

        if (properties.installed) {
            await this.log('Getting MinecraftServer banned IPs...');

            try {
                properties.bannedIps = JSON.parse(await fs.readFile(path.join(minecraftDirectory, 'banned-ips.json'), 'utf8'));
                return Promise.resolve();
            } catch (err) {
                properties.bannedIps = [];
                await this.log('Failed to read banned-ips.json:');
                await this.log(err);
                return Promise.reject();
            }
        } else {
            return Promise.reject('Minecraft not installed.');
        }
    }

    async getBannedPlayers () {
        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;

        if (properties.installed) {
            await this.log('Getting MinecraftServer banned players...');

            try {
                properties.bannedPlayers = JSON.parse(await fs.readFile(path.join(minecraftDirectory, 'banned-players.json'), 'utf8'));
                return Promise.resolve();
            } catch (err) {
                properties.bannedPlayers = [];
                await this.log('Failed to read banned-players.json:');
                await this.log(err);
                return Promise.reject(err);
            }
        } else {
            return Promise.reject('Minecraft not installed.');
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

    async getEula () {
        await this.log('Getting MinecraftServer EULA acceptance state...');

        let eula;
        let eulaUrlLine;
        let line;
        let lineNumber;
        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;

        await this.log('Reading MinecraftServer eula.txt...');
        try {
            eula = await fs.readFile(path.join(minecraftDirectory, 'eula.txt'), 'utf8');
            eula = eula.split(os.EOL);
            for (lineNumber = 0; lineNumber < eula.length; lineNumber++) {
                if (eula[lineNumber]) {
                    eulaUrlLine = eula[lineNumber].split('https://');
                    if (eulaUrlLine.length == 2) {
                        properties.eulaUrl = 'https://' + eulaUrlLine[1].substr(0, eulaUrlLine[1].indexOf(')'));
                        await this.log('MinecraftServer EULA location: ' + properties.eulaUrl);
                    }
                    line = eula[lineNumber].split('=');
                    if (line.length == 2) {
                        properties.acceptedEula = !!JSON.parse(line[1]);
                        await this.log(`MinecraftServer EULA accepted? ${properties.acceptedEula}`);
                    }
                }
            }
            properties.eulaFound = true;
            properties.installed = true;
            return Promise.resolve();
        } catch (err) {
            await this.log('Failed to read eula.txt.');
            await this.log(err);
            await this.log('Minecraft probably needs to be run once to stage new files.');
            await this.log('Use the web interface to start the Minecraft server and accept the license agreement.');
            properties.eulaFound = false;
            properties.installed = false;
            return Promise.reject(err);
        }
    }

    async getMinecraftVersions () {
        // TODO enable snapshot updates with a property/preference
        let minecraftVersions = [];
        let releaseVersions = [];
        let snapshotVersions = [];

        try {
            await this.log('Getting releases available from Minecraft...');
            let response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest.json');
            minecraftVersions = response.data;
            minecraftVersions.versions.forEach(version => {
                if (version.type === 'release') {
                    releaseVersions.push(version);
                } else if (version.type === 'snapshot') {
                    snapshotVersions.push(version);
                }
            });
            this.properties.versions = {
                installed: this.properties.versions.installed || null,
                latest: minecraftVersions.latest,
                release: releaseVersions,
                snapshot: snapshotVersions };
            await this.log('Got releases from Minecraft.');
            return Promise.resolve(this.properties.versions);
        } catch (err) {
            await this.log(`Unable to get release information from https://launchermeta.mojang.com/mc/game/version_manifest.json`);
            return Promise.reject(err);
        }
    }

    async getOps () {
        await this.log('Getting MinecraftServer ops...');

        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;

        if (properties.installed) {
            try {
                properties.ops = JSON.parse(await fs.readFile(path.join(minecraftDirectory, 'ops.json'), 'utf8'));
                return Promise.resolve();
            } catch (err) {
                properties.ops = [];
                await this.log('Failed to read ops.json:')
                await this.log(err);
                return Promise.reject(err);
            }
        } else {
            return Promise.reject('Minecraft not installed.');
        }
    }

    async getServerProperties () {
        await this.log('Getting MinecraftServer properties...');

        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;

        if (properties.installed) {
            try {
                let serverPropertiesFile = await fs.readFile(path.join(minecraftDirectory, 'server.properties'), 'utf8');
                properties.serverProperties = Util.convertPropertiesToObjects(serverPropertiesFile);
                return Promise.resolve();
            } catch (err) {
                properties.serverProperties = [];
                this.log('Failed to read server.properties:');
                await this.log(err);
                return Promise.reject(err);
            }
        } else {
            return Promise.reject('Minecraft not installed.');
        }
    }

    async getUserCache () {
        await this.log('Getting MinecraftServer user cache...');

        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;

        if (properties.installed) {
            try {
                properties.userCache = JSON.parse(await fs.readFile(path.join(minecraftDirectory, 'usercache.json'), 'utf8'));
                return Promise.resolve();
            } catch (err) {
                properties.userCache = [];
                await this.log('Failed to read usercache.json:');
                await this.log(err);
                return Promise.reject(err);
            }
        } else {
            return Promise.reject('Minecraft not installed.');
        }
    }

    async getWhitelist () {
        await this.log('Getting MinecraftServer whitelist...');

        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;

        if (properties.installed) {
            try {
                properties.whitelist = JSON.parse(await fs.readFile(path.join(minecraftDirectory, 'whitelist.json'), 'utf8'));
                return Promise.resolve();
            } catch (e) {
                properties.whitelist = [];
                await this.log('Failed to read whitelist.json:');
                await this.log(err);
                return Promise.reject(err);
                }
        } else {
            return Promise.reject('Minecraft not installed.');
        }
    }

    async install (version = "latest", newWorld = false) {
        let download = false;
        let releaseJarName = '';
        let properties = this.properties;
        let detectedVersion = properties.detectedVersion;
        let versions = this.properties.versions;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        let installed = properties.versions.installed;
        let serverJar = properties.settings.serverJar;
        let releaseJarPath = path.join(minecraftDirectory, releaseJarName);
        let serverJarPath = path.join(minecraftDirectory, serverJar);
        let release = {};

        if (version === "latest") {
            version = versions.latest.release.id;
        }
        // Get the release info for the version specified.
        versions.release.forEach(releaseVersion => {
            if (releaseVersion.id === version) {
                release = releaseVersion;
            }
        });
        if (!release || !release.id) {
            return Promise.reject(`Invalid version ${version} specified.`);
        }

        releaseJarName = `${release.id}_minecraft_${serverJar}`;

        // Make sure we have an up to date list of available jars from disk.
        this.detectMinecraftJar();
        // See if we have already downloaded the requested version.
        if (installed.length > 0) {
            for (let installedVersion of installed) {
                if (installedVersion.indexOf(release.id) !== -1) {
                    // already downloaded.
                    download = false;
                    releaseJarName = installedVersion;
                    break;
                }
            }
            if (!releaseJarName) {
                download = true;
            }
        } else {
            download = true;
        }

        if (download) {
            await this.downloadRelease(release.id);
        }

        await this.stop();
        await this.log(`Deleting Minecraft server version: ${properties.detectedVersion.full}...`);
        try {
            await fs.unlink(serverJarPath);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                return Promise.reject(err);
            }
        }
        await this.log(`Installing MinecraftServer version ${version}...`);
        try {
            await fs.copyFile(releaseJarPath, serverJarPath);
        } catch (err) {
            return Promise.reject(err);
        }

        properties.installed = true;
        properties.needsInstallation = false;
        await this.log(`Done installing Minecraft server version ${version}.`);

        // TODO: Only create new world on downgrade and use `newWorld` argument.
        let majorminorrelease = `${detectedVersion.major}.${detectedVersion.minor}.${detectedVersion.release}`;
        properties.detectedVersion = {major: '', minor: '', release: ''};
        if (version !== majorminorrelease) {
            await this.newWorld(false);
            return Promise.resolve();
        } else {
            return Promise.resolve();
        }   
    }

    async listCommands (checkCount) {
        let properties = this.properties;
        let serverProcess = properties.serverProcess;
        let threshold = 20;
        let line = "";
        let outputString = "";
        let outputLines = [];

        if (!checkCount) {
            checkCount = 0;
        }

        if (checkCount > threshold) {
            await this.log('Cannot fetch commands.');
            return Promise.reject(new Error('Cannot fetch commands.'));
        }

        // Output buffer could be array of arrays, so combine into something usable.
        if (Array.isArray(properties.serverOutput) && properties.serverOutput.length) {
            outputString = properties.serverOutput.join('\n');
            outputLines = outputString.split('\n');
        }
        properties.allowedCommands = [];
        try {
            await this.log('Listing Minecraft commands...');
            
            serverProcess.stdin.write(`/help${os.EOL}`);
            await this.waitForBufferToBeFull();

            // Output buffer could be array of arrays, so combine into something usable.
            if (Array.isArray(properties.serverOutput) && properties.serverOutput.length) {
                outputString = properties.serverOutput.join('\n');
                outputLines = outputString.split('\n');
            }
            for (line of outputLines) {
                if (line.indexOf('Showing help page') !== -1) {
                    // Versions prior to 1.13 "page" the help
                    await this.detachFromMinecraft();

                    let part1 = line.split('Showing help page ');
                    let part2 = part1[1].split(' ');
                    properties.helpPages = parseInt(part2[2]);

                    await this.attachToMinecraft();
                    try {
                        for (let i = 1; i <= properties.helpPages; i++) {
                            // Get all of the help at once
                            serverProcess.stdin.write(`/help ${i}${os.EOL}`);
                        }
                    } catch (er) {
                        return Promise.reject(er);
                    }
                    while (properties.serverOutput.length <= 0) {
                        await this.waitForBufferToBeFull();
                    }
                    await this.waitForBufferToBeFull();
                    await this.parseHelpOutput();
                    break;
                } else {
                    // Versions 1.13 and later display all of the help at once, no need to page it
                    await this.waitForBufferToBeFull();
                    await this.parseHelpOutput();
                    break;
                }
            }
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    async listPlayers () {
        await this.log('Listing Minecraft players.');

        let properties = this.properties;
        let serverProcess = properties.serverProcess;
        let started = properties.started;
        let playersList = {
            summary: '',
            players: []
        };
        let players;
        let minecraftLogTimeRegex = /\[[0-2]?[0-9]:[0-5]?[0-9]:[0-5]?[0-9]\] /;
        let minecraftLogPrefixRegex = /\[\w*\s\w*\/\w*\]:/;
        let outputLines = [];
        let outputString = '';

        // Get current online players
        if (started) {
            // debugger; // to go join for testing
            await this.attachToMinecraft();
            serverProcess.stdin.write(`/list${os.EOL}`);
            
            while (!properties.serverOutput.length) {
                await this.waitForBufferToBeFull();
            }
        
            // Output buffer could be array of arrays, so combine into something usable.
            if (Array.isArray(properties.serverOutput) && properties.serverOutput.length) {
                outputString = properties.serverOutput.join('\n');
                outputLines = outputString.split('\n');
            }
            
            // First line is the summary,
            // followed by line(s) of player names, comma+space separated.
            for (let line of outputLines) {
                // Take off the timestamp bits.
                line = line.split(minecraftLogTimeRegex)[1];
                // Take off the logging prefix bits.
                line = line.split(minecraftLogPrefixRegex)[1];
                // Nuke preceding and trailing whitespace.
                line = line.trim();

                if (line !== "") {
                    if (line.indexOf("players online") !== -1) {
                        playersList.summary = line.trim().slice(0, -1);
                        continue;
                    }
    
                    players = line.split(',');
                    for (let player of players) {
                        player = {
                            name: player.trim(),
                            online: true
                        };
                        for (let cachedPlayer of this.properties.userCache) {
                            if (cachedPlayer.name === player.name) {
                                player.key = cachedPlayer.uuid;
                            }
                        }
                        player.banned = await this.determineBanStatus(player);
                        player.opped = await this.determineOpStatus(player);
                        player.whitelisted = await this.determineWhitelistStatus(player);
                        playersList.players.push(player);
                    }
                }
            }

            await this.detachFromMinecraft();

            // Add cached "offline" users.
            for (let cachedPlayer of this.properties.userCache) {
                if (playersList.players.length) {
                    for (let player of playersList.players) {
                        if (cachedPlayer.name !== player.name) {
                            cachedPlayer.key = cachedPlayer.uuid;
                            cachedPlayer.banned = await this.determineBanStatus(cachedPlayer);
                            cachedPlayer.opped = await this.determineOpStatus(cachedPlayer);
                            cachedPlayer.whitelisted = await this.determineWhitelistStatus(cachedPlayer);
                            cachedPlayer.online = false;
                            playersList.players.push(cachedPlayer);
                        }
                    }
                } else {
                    cachedPlayer.key = cachedPlayer.uuid;
                    cachedPlayer.banned = await this.determineBanStatus(cachedPlayer);
                    cachedPlayer.opped = await this.determineOpStatus(cachedPlayer);
                    cachedPlayer.whitelisted = await this.determineWhitelistStatus(cachedPlayer);
                    cachedPlayer.online = false;
                    playersList.players.push(cachedPlayer);
                }
            }
            properties.playerInfo = playersList;

            return Promise.resolve(playersList);
        } else {
            return Promise.resolve(playersList);
        }
    }

    async listWorldBackups () {
        await this.log('Getting list of MinecraftServer world backups...');

        let properties = this.properties;
        let settings = properties.settings;
        let backupDir = path.resolve(settings.backups.path);
        let backupList = [];
        let files = [];

        return new Promise(async (resolve, reject) => {
            properties.backupList = [];
            try {
                files = await fs.readdir(backupDir)
            } catch (err) {
                if (err.code === 'ENOENT') {
                    resolve(properties.backupList)
                }
                await this.log(`There was a problem accessing ${backupDir}.`);
                reject(err);
            }
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
            resolve(properties.backupList);
        });
    }

    async deleteWorldBackups () {
        let properties = this.properties;
        let settings = properties.settings;
        let backupDir = path.resolve(settings.backups.path);

        return new Promise(async (resolve, reject) => {
            await this.listWorldBackups();
            for (let backup of properties.backupList) {
                try {
                    await fs.unlink(path.resolve(path.join(backupDir, backup.fileName)));
                } catch (err) {
                    await this.log(`An error ccurred removing backup ${JSON.stringify(backup)}.`);
                    await this.log(err);
                    reject(err);
                }
            }
            await this.listWorldBackups();
            resolve();
        });
    }

    async newWorld (backupWorld = false) {
        await this.log('Deleting MinecraftServer world...');

        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        let worldName = '';
        let worldPath = '';
        for (let item in properties.serverProperties) {
            if (item.name === 'level-name') {
                worldName = item.value;
            }
        }
        if (!worldName) {
            worldName = 'world';
        }

        worldPath = path.resolve(path.join(minecraftDirectory, worldName));

        if (backupWorld) {
            await this.backupWorld();
        }

        try {
            await fs.access(worldPath, FS.F_OK | FS.R_OK | FS.W_OK);
            await this.log(`World to be deleted: ${worldName} @ ${worldPath}`);
            await fs.unlink(worldPath);
            await this.log(`World ${worldName} deleted.`);
            return Promise.resolve();
        }
        catch (err) {
            await this.log(`An error occurred deleting world data.`);
            await this.log(err);
            return Promise.reject(err);
        }
    }

    async parseHelpOutput () {
        await this.log('Parsing help output.');
        let properties = this.properties;
        let minecraftFullHelp = properties.fullHelp;
        let minecraftOutput = properties.serverOutput;
        let line;

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
        // await this.log(`Got fullHelp: ${JSON.stringify(this.properties.fullHelp)}`);
        return Promise.resolve();
    }

    /**
     * Executes a Minecraft command against the Minecraft server.
     * @param {string} command - A Minecraft command to execute.
     * @return {string} output - The output from the command.
     */
    async runCommand (command) {
        // TODO: make sure command passed is valid
        await this.log(`Running Minecraft command: ${command}`);

        let properties = this.properties;
        let serverOutput = properties.serverOutput;
        let serverProcess = properties.serverProcess;
        let started = properties.started;
        let minecraftLogTimeRegex = /\[[0-2]?[0-9]:[0-5]?[0-9]:[0-5]?[0-9]\] /;
        let minecraftLogPrefixRegex = /\[\w*\s\w*\/\w*\]:/;
        let outputLines = [];
        let outputString = "";

        if (started) {
            await this.attachToMinecraft();
            serverProcess.stdin.write(`${command}${os.EOL}`);
            while (serverOutput.length <= 0) {
                await this.waitForBufferToBeFull();
            }
            // Output buffer could be array of arrays, so combine into something usable.
            if (Array.isArray(this.properties.serverOutput) && this.properties.serverOutput.length) {
                outputString = this.properties.serverOutput.join('\n');
                outputLines = outputString.split(os.EOL);
            }
            for (let l=0; l<outputLines.length; l++) {
                // Take off the timestamp bits.
                outputLines[l] = outputLines[l].split(minecraftLogTimeRegex)[1];
                // Take off the logging prefix bits.
                outputLines[l] = outputLines[l].split(minecraftLogPrefixRegex)[1];
                // Nuke preceding and trailing whitespace.
                outputLines[l] = outputLines[l].trim();
            }
            let output = outputLines.join(os.EOL);
            return Promise.resolve(output);
        } else {
            return Promise.reject(new Error('Minecraft is not running.'));
        }
    }

    /**
     * Saves server properties to disk for use on Minecraft server start.
     * @param {object} newProperties Contains the new properties to save to disk.
     */
    async saveProperties (newProperties) {
        await this.log('Saving new Minecraft server.properties file.');

        let contents = Util.convertObjectsToProperties(newProperties);
        let properties = this.properties;
        let settings = properties.settings;
        let backupDir = path.resolve(properties.settings.backups.path);
        let minecraftDirectory = settings.minecraftDirectory;
        let propertiesFile = path.resolve(path.join(minecraftDirectory, 'server.properties'));
        let backupPropertiesFileName = `${Util.getDateTime()}-server.properties`;
        let backupPropertiesFile = path.join(backupDir, backupPropertiesFileName);
        let minecraftWasRunning = false;

        if (properties.started) {
            minecraftWasRunning = true;
        }

        try {
            // Backup current properties file
            await fs.copyFile(propertiesFile, backupPropertiesFile);
            await this.stop();
            await fs.writeFile(propertiesFile, contents);
            if (minecraftWasRunning) {
                await this.start();
            }
            return Promise.resolve();
        } catch (err) {
            await this.log('An error occurred backing up the current properties file.');
            await this.log(err);
            return Promise.reject(err);
        }
    }

    /**
     * Starts the Minecraft server process.
     */
    async start () {
        let properties = this.properties;
        let settings = properties.settings;
        let minecraftDirectory = settings.minecraftDirectory;
        let serverJar = settings.serverJar;
        let serverProcess = properties.serverProcess;
        let starting = properties.starting;

        if (properties.installed) {
            if (serverProcess && serverProcess.pid) {
                return Promise.resolve(new Error(`Minecraft is already running.`));
            }

            if (settings.javaPath) {
                if (!starting) {
                    try {
                        await this.log(`Starting MinecraftServer with ${settings.memory.maximum}${settings.memory.units}B memory...`);
                        // TODO: Make the Java + args configurable
                        properties.serverProcess = spawn(settings.javaPath, [
                            `-Xmx${settings.memory.maximum}${settings.memory.units}`,
                            `-Xms${settings.memory.minimum}${settings.memory.units}`,
                            '-jar',
                            serverJar,
                            'nogui'
                        ], {
                            cwd: minecraftDirectory,
                            stdio: [
                                'pipe', // Use parent's stdin for child stdin
                                'pipe', // Pipe child's stdout to parent stdout
                                'pipe'  // Direct child's stderr to parent stderr
                            ]
                        });
                        
                        starting = true;
                        
                        await this.checkForMinecraftToBeStarted();
                        await this.updateStatus();
                        await this.attachToMinecraft();
                        await this.listCommands();
                        await this.detachFromMinecraft();
                        await this.log('Minecraft started.');
                        return Promise.resolve();
                    } catch (err) {
                        return Promise.reject(err);
                    }
                } else {
                    await this.log('Minecraft is already starting up.');
                    return Promise.resolve('Minecraft is already starting up.');
                }
            } else {
                await this.log(`Java not detected.`);
                return Promise.reject(new Error(`Java not detected.`));
            }
        } else {
            return Promise.reject(new Error('Minecraft is not installed.'));
        }
    }

    /**
     * Stops the Minecraft server process.
     */
    async stop () {
        await this.log('Stopping MinecraftServer...');

        let properties = this.properties;
        let serverProcess = properties.serverProcess;
        let started = properties.started;
        let stopping = properties.stopping;

        if (started) {
            if (!stopping) {
                stopping = true;
                await this.attachToMinecraft();
                serverProcess.stdin.write(`/stop${os.EOL}`);
                await this.waitForBufferToBeFull();
                await this.checkForMinecraftToBeStopped();
                return Promise.resolve();
            } else {
                return Promise.reject(new Error('Minecraft is already shutting down.'));
            }
        } else {
            stopping = false;
            properties.stopped = true;
            return Promise.resolve();
        }
    }

    /**
     * Reads the current state of files from the Minecraft server and gets
     * player status if running.
     */
    async updateStatus () {
        let properties = this.properties;
        
        await this.log('Updating Minecraft status.');
        if (this.properties.installed) {
            await this.checkForMinecraftUpdate();
            await this.getEula();
            await this.getServerProperties();
            await this.getUserCache();
            await this.getOps();
            await this.getBannedIps();
            await this.getBannedPlayers();
            await this.getWhitelist();
            if (properties.serverProcess && properties.serverProcess.pid) {
                await this.listPlayers();
                return Promise.resolve();
            } else {
                return Promise.resolve();
            }
        } else {
            this.checkForMinecraftUpdate();
            return Promise.resolve();
        }
    }

    async attachToMinecraft () {
        await this.log('Attaching to Minecraft output.');
        
        let properties = this.properties;
        
        try {
            if (properties.serverProcess && properties.serverProcess.pid) {
                properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                properties.serverOutput.length = 0;
                properties.serverProcess.stdout.addListener('data', this.bufferMinecraftOutput);
                properties.serverOutputCaptured = true;
                return Promise.resolve();
            } else {
                return Promise.reject(new Error(`Minecraft does not appear to be running.`));
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }
    
    async detachFromMinecraft () {
        let properties = this.properties;
        
        await this.log('Detaching from Minecraft output.');
        try {
            if (properties.serverProcess) {
                properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
            }
            properties.serverOutput.length = 0;
            properties.serverOutputCaptured = false;
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    bufferMinecraftOutput (data) {
        this.properties.serverOutput.push(data.toString().trim());
    }

    /**
     * Watches the Minecraft stdout lines. If they stop growing, return.
     */
    async waitForBufferToBeFull () {
        let properties = this.properties;
        let serverOutput = properties.serverOutput;
        let length = serverOutput.length;

        // await this.log('Waiting on Minecraft buffer...');
        await Util.wait(2);
        if (properties.serverOutputCaptured) {
            if (serverOutput.length && serverOutput.length > length) {
                await this.waitForBufferToBeFull();
            } else {
                // this.log('Minecraft buffer appers to be full.');
                return Promise.resolve();
            }
        } else {
            this.log('Lost the connection to the Minecraft buffer.');
            return Promise.reject(new Error('Lost the connection to the Minecraft buffer.'));
        }
    }

    /**
     * Logs things to a file.
     * @param {string} data The data to log.
     */
    async log (data) {
        try {
            await Util.log(data, 'minecraft-server.log');
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /**
     * Clears the log file.
     */
    async clearLog () {
        try {
            await Util.clearLog('minecraft-server.log');
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

module.exports = MinecraftServer;

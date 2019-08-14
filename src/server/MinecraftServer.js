// NodeJS Imports
const archiver = require('archiver');
const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const FS = fs.constants;
const os = require('os');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);


// minecraft-server-manager Imports
const Util = require('../util/util');
const Eula = require('./Eula');

let minecraftProperties = {
    settings: {
        javaHome: "",
        javaPath: "",
        minecraftDirectory: path.join(Util.homeDir, 'minecraft_server'),
        serverJar: 'server.jar',
        memory: {
            minimum: 1,
            maximum: 1,
            units: "G"
        },
        backups: {
            path: path.join(Util.homeDir, 'minecraft_server', 'backups', 'worlds'),
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
    versions: {
        installed: [],
        latest: {},
        release: [],
        snapshot: []
    },
    whitelist: [],
    worldName: ""
};

class MinecraftServer {
    constructor () {
        this.properties = Object.assign({}, minecraftProperties);
        this.eula = new Eula();
        this.bufferMinecraftOutput = this.bufferMinecraftOutput.bind(this);
        this.properties.ipAddress = require('underscore')
            .chain(require('os').networkInterfaces())
            .values()
            .flatten()
            .find({family: 'IPv4', internal: false})
            .value()
            .address;
    }
        
    async init () {
        let properties = this.properties;
        try {
            await this.clearLog();
            properties.settings = await Util.readSettings(properties.settingsFileName, properties.settings);
            await this.log('Initializing MinecraftServer...');
            await Promise.all([
                this.detectJavaHome(),
                this.checkForMinecraftInstallation(),
                this.getMinecraftVersions()
            ]);
        } catch (err) {
            debugger;
        }
    }

    async acceptEula () {
        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        
        try {
            await this.log('Checking and accepting MinecraftServer EULA...');
            if (properties.installed && (properties.acceptedEula === 'false' || !properties.acceptedEula)) {
                await this.log('Accepting EULA...');
                await this.eula.accept(minecraftDirectory);
                properties.acceptedEula = true;
            }
        } catch (err) {
            await this.log(`An error occurred accepting the Minecraft EULA. ${err}`);
            await this.log(err);
        }
    }

    async backupWorld (worldName) {
        return new Promise(async (resolve, reject) => {
            await this.log('Backing up MinecraftServer world...');
    
            let properties = this.properties;
            let minecraftDirectory = properties.settings.minecraftDirectory;
            let minecraftWasRunning = false;
            let backupDir = path.resolve(properties.settings.backups.path);
            let archive;
            let output;
    
            worldName = worldName || 'world';
            if (properties.started) {
                minecraftWasRunning = true;
                await this.stop();
            }
    
            await fs.mkdir(backupDir, {recursive: true});
            output = await fs.createWriteStream(path.join(backupDir, `${worldName}_${Util.getDateTime()}.zip`));
    
            archive = archiver('zip', {
                zlib: { level: 9 }
            });
            archive
                .directory(path.join(minecraftDirectory, worldName), false)
                .on('error', err => reject(err))
                .pipe(output);
            
            output.on('close', async () => {
                await this.log(`Backup size: ${archive.pointer()} total bytes.`);
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
        let properties = this.properties;
        let minecraftDirectory = path.resolve(properties.settings.minecraftDirectory);
        try {
            await this.log('Checking for Minecraft installation.');
            await fs.access(minecraftDirectory, FS.F_OK | FS.R_OK | FS.W_OK)
            await Promise.all([
                this.detectMinecraftJar(),
                this.getEula()
            ]);
        } catch (err) {
            if (err.code === 'ENOENT') {
                await this.log(`Creating directory at ${minecraftDirectory}...`);
                try {
                    await fs.mkdir(minecraftDirectory);
                    properties.installed = false;
                } catch (er) {
                    await this.log('An error occurred creating the Minecraft server directory.');
                    await this.log(er);
                }
            } else {
                await this.log(err);
            }
        }
    }

    async checkForMinecraftToBeStarted () {
        let outputLines = [];
        let outputString = '';
        let versionParts = [];
        let major, minor, release;

        try {
            await this.log(`Checking for Minecraft to be started...`);

            await this.attachToMinecraft();
            await this.waitForBufferToBeFull(18);
            // Output buffer could be array of arrays, so combine into something usable.
            if (Array.isArray(this.properties.serverOutput) && this.properties.serverOutput.length) {
                outputString = this.properties.serverOutput.join(os.EOL);
                outputLines = outputString.split(os.EOL);
            }
    
            for (let line of outputLines) {
                if (line.indexOf('eula.txt') !== -1) {
                    // Minecraft has changed the wording of EULA errors in the log as of 1.14.4. BEWARE.
                    this.properties.starting = false;
                    this.properties.started = false;
                    await this.log('The Minecraft EULA needs to be accepted. MinecraftServer start aborted.');
                    await this.log('Use the web interface to view and accept the Minecraft license agreement, or accept it manually.');
                    await this.detachFromMinecraft();
                    await this.stop();
                    return Promise.reject(new Error('The Minecraft EULA needs to be accepted.'));
                } else if (line.toLowerCase().indexOf('failed') !== -1 && line.toLowerCase().indexOf('warn') === -1) {
                    // TODO: Get smarter here and show the error
                    this.properties.starting = false;
                    this.properties.started = false;
                    this.properties.stopped = true;
                    await this.log('An error occurred starting MinecraftServer. Check the Minecraft log.');
                    await this.log('Minecraft startup failed.');
                    await this.detachFromMinecraft();
                    await this.stop();
                    return Promise.reject(new Error('Minecraft startup failed.'));
                } else if (line.toLowerCase().indexOf('stopping server') !== -1) {
                    // TODO: Get smarter here and show the error
                    this.properties.starting = false;
                    this.properties.started = false;
                    this.properties.stopped = true;
                    await this.log('An error occurred starting MinecraftServer. Check the Minecraft log.');
                    await this.log('Minecraft startup failed.');
                    await this.detachFromMinecraft();
                    await this.stop();
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
                    this.properties.detectedVersion.full = `${major}.${minor}.${release}`;
                    this.properties.starting = true;
                    this.properties.started = false;
                    await this.log(`Detected MinecraftServer version: ${this.properties.detectedVersion.full}`);
                    continue;
                } else if (line.indexOf('Done') !== -1) {
                    this.properties.started = true;
                    this.properties.starting = false;
                    this.properties.stopped = false;
                    this.properties.startTime = Date.now();
                    await this.log('MinecraftServer.checkForMinecraftToBeStarted: MinecraftServer started.');
                    await this.detachFromMinecraft();
                }
            }
            if (!this.properties.started && this.properties.starting) {
                await this.detachFromMinecraft();
                await this.checkForMinecraftToBeStarted();
            }
        } catch (err) {
            await this.detachFromMinecraft();
            await this.log('An error occurred waiting for Minecraft to be started.');
            await this.log(err);
            return Promise.reject(err);
        }
    }

    async checkForMinecraftToBeStopped () {
        let properties = this.properties;
        let outputLines = [];
        let outputString = '';

        try {
            await this.log(`Checking for Minecraft to be stopped...`);
            await this.waitForBufferToBeFull();
            
            // Output buffer could be array of arrays, so combine into something usable.
            if (Array.isArray(properties.serverOutput) && properties.serverOutput.length) {
                outputString = properties.serverOutput.join(os.EOL);
                outputLines = outputString.split(os.EOL);
            }

            for (let line of outputLines) {
                if (line.indexOf('Saving chunks') !== -1 || line.indexOf('Stopping server') !== -1) {
                    // Minecraft is at a far enough point in shutdown to return now.
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
        } catch (err) {
            await this.log('An error occurred waiting for Minecraft to be stopped.');
            await this.log(err.stack);
        }
    }

    /**
     * Checks for a newer release of the Minecraft server jar.
     */
    async checkForMinecraftUpdate () {
        try {
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
                } else if (release.major == detectedVersion.major && release.minor > detectedVersion.minor) {
                    this.properties.updateAvailable = true;
                } else if (release.major == detectedVersion.major && release.minor == detectedVersion.minor && release.release > detectedVersion.release) {
                    this.properties.updateAvailable = true;
                }
                await this.log(`Minecraft version ${release.full} available.`);
            } else {
                this.properties.updateAvailable = false;
                await this.log('No update available.');
            }
            await this.log('Done checking for Minecraft server update.');
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /**
     * Gets and stores the home directory and the Java executable found in PATH.
     */
    async detectJavaHome () {
        let properties = this.properties;
        try {
            await this.log(`Detecting Java home path...`);
            // Request Java's internal properties, that are printed to 'stderr'
            const { stdout, stderr } = await exec('java -XshowSettings:properties -version');
            if (stdout) {
                await this.log(`Could not find a Java executable in the environment PATH. Make sure Java is properly installed.`);
                return Promise.reject(new Error(stdout));
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
                return properties.settings.javaHome;
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }

    async detectMinecraftJar () {
        let properties = this.properties;
        let settings = properties.settings;
        let minecraftDirectory = settings.minecraftDirectory;
        let installedVersions = [];
        let minecraftFiles = [];
        try {
            await this.log('Detecting MinecraftServer jar...');
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
            return path.resolve(minecraftDirectory, settings.serverJar);
        } catch (err) {
            properties.installed = false;
            properties.needsInstallation = true;
            if (err.code !== 'ENOENT') {
                await this.log('An error occurred detecting the Minecraft jar.');
                await this.log(err);
            } else {
                await this.log('Minecraft needs to be installed.');
            }
        }
    }

    async determineBanStatus (player) {
        try {
            await this.log(`Determining ban status for player: ${player.name}`);
            let properties = this.properties;
            let banned = false;
            if (properties.bannedPlayers.length) {
                for (let bannedPlayer of properties.bannedPlayers) {
                    if (bannedPlayer.name === player.name) {
                        banned = true;
                    }
                }
            }
            return banned;
        } catch (err) {
            await this.log(`An error occurred determining player ${player.name}'s ban status.`);
            await this.log(err.stack);
            return Promise.reject(err);
        }
    }

    async determineOpStatus (player) {
        try {
            await this.log(`Determining op status for player: ${player.name}`);
            let properties = this.properties;
            let op = false;
            if (properties.ops.length) {
                for (let oppedPlayer of properties.ops) {
                    if (oppedPlayer.name === player.name) {
                        op = true;
                    }
                }
            }
            return op;
        } catch (err) {
            await this.log(`An error occurred determining player ${player.name}'s op status.`);
            await this.log(err.stack);
            return Promise.reject(err);
        }
    }

    async determineWhitelistStatus (player) {
        try {
            await this.log(`Determining whitelist status for player: ${player.name}`);
            let properties = this.properties;
            let whitelisted = false;
            if (properties.whitelist.length) {
                for (let whitelistedPlayer of properties.whitelist) {
                    if (whitelistedPlayer.name === player.name) {
                        whitelisted = true;
                    }
                }
            }
            return whitelisted;
        } catch (err) {
            await this.log(`An error occurred determining player ${player.name}'s whitelist status.`);
            await this.log(err.stack);
            return Promise.reject(err);
        }
    }

    /**
     * Downloads a release from the Minecraft servers.
     * @param {string} version An optional version to download. Default version is 'latest'.
     */
    async downloadRelease (version = "latest") {
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
        try {
            await this.log(`Fetching release information for: ${release.id}...`);
            let response = await axios.get(release.url);
            let versionInfo = response.data;
            if (versionInfo.downloads && versionInfo.downloads.server && versionInfo.downloads.server.url) {
                let jar = `${release.id}_minecraft_server.jar`;
                let url = versionInfo.downloads.server.url;
                fileStream = await fs.createWriteStream(path.join(minecraftDirectory, jar));
                response = await axios({
                    url,
                    method: "GET",
                    responseType: "stream"
                });
                response.data.pipe(fileStream);
                properties.versions.installed.push(jar);
                await this.log(`Download of Minecraft server version ${release.id} complete.`);
                return new Promise((resolve, reject) => {
                    fileStream.on("finish", resolve);
                    fileStream.on("error", reject);
                });
            }
        } catch (err) {
            await this.log(JSON.stringify(err));
        }
    }

    async getBannedIps () {
        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        try {
            if (properties.installed) {
                await this.log('Getting MinecraftServer banned IPs...');
                properties.bannedIps = await fs.readJSON(path.join(minecraftDirectory, 'banned-ips.json'));
            } else {
                await this.log('Minecraft is not installed.');
            }
        } catch (err) {
            properties.bannedIps = [];
            await this.log('Failed to read banned-ips.json:');
            await this.log(err.stack);
        }
    }

    async getBannedPlayers () {
        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        try {
            if (properties.installed) {
                await this.log('Getting MinecraftServer banned players...');
                properties.bannedPlayers = await fs.readJSON(path.join(minecraftDirectory, 'banned-players.json'));
            } else {
                await this.log('Minecraft is not installed.');
            }
        } catch (err) {
            properties.bannedPlayers = [];
            await this.log('Failed to read banned-players.json:');
            await this.log(err.stack);
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
        // let eula;
        // let eulaUrlLine;
        // let line;
        // let lineNumber;
        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        try {
            await this.log('Getting MinecraftServer EULA acceptance state...');
            await this.log('Reading MinecraftServer eula.txt...');
            // eula = await fs.readFile(path.join(minecraftDirectory, 'eula.txt'), 'utf8');
            // eula = eula.split(os.EOL);
            // for (lineNumber = 0; lineNumber < eula.length; lineNumber++) {
            //     if (eula[lineNumber]) {
            //         eulaUrlLine = eula[lineNumber].split('https://');
            //         if (eulaUrlLine.length == 2) {
            //             properties.eulaUrl = 'https://' + eulaUrlLine[1].substr(0, eulaUrlLine[1].indexOf(')'));
            //             await this.log('MinecraftServer EULA location: ' + properties.eulaUrl);
            //         }
            //         line = eula[lineNumber].split('=');
            //         if (line.length == 2) {
            //             properties.acceptedEula = !!JSON.parse(line[1]);
            //             await this.log(`MinecraftServer EULA accepted? ${properties.acceptedEula}`);
            //         }
            //     }
            // }
            this.properties.eulaUrl = await this.eula.getUrl(minecraftDirectory);
            this.properties.acceptedEula = await this.eula.check(minecraftDirectory);
            this.properties.eulaFound = true;
        } catch (err) {
            await this.log(`Failed to read eula.txt. ${err}`);
            await this.log(err);
            await this.log('Minecraft probably needs to be run once to stage new files.');
            await this.log('Use the web interface to start the Minecraft server and accept the license agreement.');
            properties.eulaFound = false;
        }
    }

    async getMinecraftVersions () {
        let minecraftVersions = [];
        let releaseVersions = [];
        let snapshotVersions = [];
        try {
            // TODO enable snapshot updates with a property/preference
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
                installed: this.properties.versions.installed || [],
                latest: minecraftVersions.latest,
                release: releaseVersions,
                snapshot: snapshotVersions
            };
            await this.log('Got releases from Minecraft.');
            return this.properties.versions;
        } catch (err) {
            await this.log(`An error occurred getting release information from Minecraft.`);
            await this.log(err.stack);
        }
    }

    async getOps () {
        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        try {
            await this.log('Getting MinecraftServer ops...');
            if (properties.installed) {
                properties.ops = await fs.readJSON(path.join(minecraftDirectory, 'ops.json'));
            } else {
                await this.log('Minecraft not installed.');
            }
        } catch (err) {
            properties.ops = [];
            await this.log('Failed to read ops.json:')
            await this.log(err.stack);
        }
    }

    async getServerProperties () {
        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        try {
            await this.log('Getting MinecraftServer properties...');
            if (properties.installed) {
                let serverPropertiesFile = await fs.readFile(path.join(minecraftDirectory, 'server.properties'), 'utf8');
                properties.serverProperties = Util.convertPropertiesToObjects(serverPropertiesFile);
                // Detect world name.
                for (let item in properties.serverProperties) {
                    if (item.name === 'level-name') {
                        properties.worldName = item.value;
                        break;
                    }
                }
            } else {
                await this.log('Minecraft not installed.');
            }
        } catch (err) {
            properties.serverProperties = [];
            await this.log('Failed to read server.properties:');
            await this.log(err.stack);
        }
    }

    async getUserCache () {
        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        try {
            await this.log('Getting MinecraftServer user cache...');
            if (properties.installed) {
                properties.userCache = await fs.readJSON(path.join(minecraftDirectory, 'usercache.json'));
            }
        } catch (err) {
            properties.userCache = [];
            await this.log('Failed to read Minecraft usercache.json:');
            await this.log(err.stack);
        }
    }

    async getWhitelist () {
        let properties = this.properties;
        let minecraftDirectory = properties.settings.minecraftDirectory;
        try {
            await this.log('Getting MinecraftServer whitelist...');
            if (properties.installed) {
                properties.whitelist = await fs.readJSON(path.join(minecraftDirectory, 'whitelist.json'));
            }
        } catch (err) {
            properties.whitelist = [];
            await this.log('Failed to read whitelist.json:');
            await this.log(err.stack);
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

        try {
            if (version === "latest") {
                version = versions.latest.release;
            }
            // Get the release info for the version specified.
            versions.release.forEach(releaseVersion => {
                if (releaseVersion.id === version) {
                    release = releaseVersion;
                }
            });

            if (!release || !release.id) {
                await this.log(`Invalid version ${version} specified.`);
                return;
            }

            releaseJarName = `${release.id}_minecraft_${serverJar}`;
            releaseJarPath = path.join(minecraftDirectory, releaseJarName);

            // Make sure we have an up to date list of available jars from disk.
            await this.detectMinecraftJar();
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

            if (this.properties.installed) {
                await this.stop();
                await this.log(`Deleting Minecraft server version: ${properties.detectedVersion.full}...`);
                try {
                    await fs.remove(serverJarPath);
                } catch (err) {
                    if (err.code !== 'ENOENT') {
                        reject(err);
                    }
                }
            }

            await this.log(`Installing MinecraftServer version ${version}...`);
            try {
                await fs.copyFile(releaseJarPath, serverJarPath);
            } catch (err) {
                reject(err);
            }
            await this.log(`Done installing Minecraft server version ${version}.`);

            // TODO: Only create new world on downgrade and use `newWorld` argument.
            // Right now this deletes the world upon any installation.
            if (properties.installed) {
                let majorminorrelease = `${detectedVersion.major}.${detectedVersion.minor}.${detectedVersion.release}`;
                properties.detectedVersion = {major: '', minor: '', release: ''};
                if (version !== majorminorrelease) {
                    await this.newWorld(false);
                }
            }

            properties.installed = true;
            properties.needsInstallation = false;
        } catch (err) {
            await this.log(err.stack);
            properties.installed = false;
            properties.needsInstallation = true;
        }
    }

    async listCommands () {
        let properties = this.properties;
        let serverProcess = properties.serverProcess;
        let line = "";
        let outputString = "";
        let outputLines = [];

        properties.allowedCommands = [];

        try {
            if (properties.acceptedEula && !properties.needsInstallation) {

                await this.log('Listing Minecraft commands...');
                await this.attachToMinecraft();
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
                            await this.log(er);
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
                await this.detachFromMinecraft();
            }
        } catch (err) {
            await this.detachFromMinecraft();
            await this.log(err);
        }
    }

    async listPlayers () {
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
        try {
            await this.log('Listing Minecraft players.');
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
                    cachedPlayer.key = cachedPlayer.uuid;
                    cachedPlayer.banned = await this.determineBanStatus(cachedPlayer);
                    cachedPlayer.opped = await this.determineOpStatus(cachedPlayer);
                    cachedPlayer.whitelisted = await this.determineWhitelistStatus(cachedPlayer);
                    cachedPlayer.online = false;

                    if (playersList.players.length) {
                        for (let player of playersList.players) {
                            if (cachedPlayer.name !== player.name) {
                                playersList.players.push(cachedPlayer);
                            }
                        }
                    } else {
                        playersList.players.push(cachedPlayer);
                    }
                }
            }
        } catch (err) {
            await this.log('An error occurred listing Minecraft players.');
            await this.log(err);
            playersList = {players: [], summary: ""};
        }
        properties.playerInfo = playersList;
        return playersList;
    }

    async listWorldBackups () {
        let properties = this.properties;
        let settings = properties.settings;
        let backupDir = path.resolve(settings.backups.path);
        let backupList = [];
        let files = [];
        
        try {
            await this.log('Getting list of MinecraftServer world backups...');
            properties.backupList = [];
            files = await fs.readdir(backupDir)
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
        } catch (err) {
            await this.log('An error occurred listing world backups.');
            await this.log(err);
            properties.backupList = [];
        }

        return properties.backupList;
    }

    async deleteWorldBackups () {
        let properties = this.properties;
        let settings = properties.settings;
        let backupDir = path.resolve(settings.backups.path);
        
        try {
            await this.listWorldBackups();
            for (let backup of properties.backupList) {
                await fs.remove(path.resolve(path.join(backupDir, backup.fileName)));
            }
            await this.listWorldBackups();
        } catch (err) {
            await this.log('An error occurred deleting world backups.');
            await this.log(err);
        }
    }

    async newWorld (backupWorld = false) {
        try {
            await this.log(`Deleting MinecraftServer world. Backup: ${backupWorld}`);

            let properties = this.properties;
            let minecraftDirectory = properties.settings.minecraftDirectory;
            let worldName = '';
            let worldPath = '';
            let minecraftWasRunning = false;

            if (properties.started) {
                minecraftWasRunning = true;
                await this.stop();
            }

            for (let item in properties.serverProperties) {
                if (item.name === 'level-name') {
                    worldName = item.value;
                    break;
                }
            }
            if (!worldName) {
                worldName = 'world';
            }

            worldPath = path.resolve(path.join(minecraftDirectory, worldName));

            if (backupWorld) {
                await this.backupWorld();
            }
            await fs.access(worldPath, FS.F_OK | FS.R_OK | FS.W_OK);
            await this.log(`World to be deleted: ${worldName} @ ${worldPath}`);
            await fs.remove(worldPath);
            await this.log(`World ${worldName} deleted.`);
            if (minecraftWasRunning) {
                await this.start();
            }
        } catch (err) {
            await this.log(`An error occurred creating a new world.`);
            await this.log(err);
            throw(err);
        }
    }

    async parseHelpOutput () {
        return new Promise(async (resolve, reject) => {
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
            resolve();
        });
    }

    /**
     * Executes a Minecraft command against the Minecraft server.
     * @param {string} command - A Minecraft command to execute.
     * @return {string} output - The output from the command.
     */
    async runCommand (command) {
        // TODO: make sure command passed is valid
        let properties = this.properties;
        let serverOutput = properties.serverOutput;
        let serverProcess = properties.serverProcess;
        let started = properties.started;
        let minecraftLogTimeRegex = /\[[0-2]?[0-9]:[0-5]?[0-9]:[0-5]?[0-9]\] /;
        let minecraftLogPrefixRegex = /\[\w*\s\w*\/\w*\]:/;
        let outputLines = [];
        let outputString = "";
        
        try {
            await this.log(`Running Minecraft command: ${command}`);
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
                await this.detachFromMinecraft();
                for (let l=0; l<outputLines.length; l++) {
                    // Take off the timestamp bits.
                    outputLines[l] = outputLines[l].split(minecraftLogTimeRegex)[1];
                    // Take off the logging prefix bits.
                    outputLines[l] = outputLines[l].split(minecraftLogPrefixRegex)[1];
                    // Nuke preceding and trailing whitespace.
                    outputLines[l] = outputLines[l].trim();
                }
                let output = outputLines.join(os.EOL);
                return output;
            } else {
                return Promise.reject(new Error('Minecraft is not running.'));
            }
        } catch (err) {
            await this.detachFromMinecraft();
            return Promise.reject(err);
        }
    }

    /**
     * Saves server properties to disk for use on Minecraft server start.
     * @param {object} newProperties Contains the new properties to save to disk.
     */
    async saveProperties (newProperties) {
        return new Promise(async (resolve, reject) => {
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
                await this.stop();
            }
    
            try {
                // Backup current properties file
                await fs.copyFile(propertiesFile, backupPropertiesFile);
                await fs.writeFile(propertiesFile, contents);
                if (minecraftWasRunning) {
                    await this.start();
                }
                resolve();
            } catch (err) {
                await this.log('An error occurred backing up the current properties file.');
                await this.log(err);
                reject(err);
            }
        });
    }

    /**
     * Starts the Minecraft server process.
     */
    async start () {
        return new Promise(async (resolve, reject) => {
            let properties = this.properties;
            let settings = properties.settings;
            let minecraftDirectory = settings.minecraftDirectory;
            let serverJar = settings.serverJar;
            let serverProcess = properties.serverProcess;
            let starting = properties.starting;
            if (properties.installed) {
                if (serverProcess && serverProcess.pid) {
                    resolve(`Minecraft is already running.`);
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
                            await this.getEula();
                            await this.updateStatus();
                            await this.listCommands();
                            await this.log('MinecraftServer.start: Minecraft started.');
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    } else {
                        await this.log('Minecraft is already starting up.');
                        resolve('Minecraft is already starting up.');
                    }
                } else {
                    await this.log(`Java not detected.`);
                    reject(new Error(`Java not detected.`));
                }
            } else {
                reject(new Error('Minecraft is not installed.'));
            }
        });
    }

    /**
     * Stops the Minecraft server process.
     */
    async stop (force = false) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.log('Stopping MinecraftServer...');
        
                let properties = this.properties;
                let serverProcess = properties.serverProcess;
                let started = properties.started;
                let stopping = properties.stopping;
    
                if (properties.starting) {
                    force = true;
                }
        
                if (started) {
                    // Gracefully stop Minecraft.
                    if (!stopping) {
                        stopping = true;
                        await this.attachToMinecraft();
                        serverProcess.stdin.write(`/stop${os.EOL}`);
                        await this.waitForBufferToBeFull(5);
                        await this.checkForMinecraftToBeStopped();
                        await this.detachFromMinecraft();
                        await Util.saveSettings(this.properties.settingsFileName, this.properties.settings);
                        stopping = false;
                        started = false;
                        properties.stopped = true;
                    } else {
                        reject(new Error('Minecraft is already shutting down.'));
                    }
                } else if (force) {
                    // Kill all the things.
                    await this.log('Forcing shutdown of MinecraftServer.');
                    await this.detachFromMinecraft();
                    await Util.saveSettings(this.properties.settingsFileName, this.properties.settings);
                    serverProcess.kill();
                    stopping = false;
                    starting = false;
                    started = false;
                    properties.stopped = true;
                    await this.log('Force shutdown complete.');
                } else {
                    // Already shut down.
                    stopping = false;
                    properties.stopped = true;
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Reads the current state of files from the Minecraft server and gets
     * player status if running.
     */
    async updateStatus () {
        let properties = this.properties;
        await this.log('Updating Minecraft status.');
        if (properties.installed && properties.acceptedEula && !properties.needsInstallation) {
            await Promise.all([
                this.checkForMinecraftUpdate(),
                this.getServerProperties(),
                this.getUserCache(),
                this.getOps(),
                this.getBannedIps(),
                this.getBannedPlayers(),
                this.getWhitelist(),
            ]);
            if (properties.started && properties.serverProcess && properties.serverProcess.pid) {
                await this.listPlayers();
            }
        } else {
            await this.checkForMinecraftUpdate();
        }
    }

    async attachToMinecraft () {
        // TODO: Figure out a blocking+retry mechanism... for example listPlayers and runCommand could race here.
        // potentially a `return attached` that the caller can wait for. still might have a race condition though...
        // and that may break methods that call here twice (checkForMinecraftToBeStarted is one).
        try {
            let properties = this.properties;
            if (properties.serverProcess && properties.serverProcess.pid && !properties.serverOutputCaptured) {
                await this.log('Attaching to Minecraft output.');
                properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                properties.serverOutput.length = 0;
                properties.serverProcess.stdout.addListener('data', this.bufferMinecraftOutput);
                properties.serverOutputCaptured = true;
            } else {
                return Promise.reject(new Error('Already attached to Minecraft.'));
            }
        } catch (err) {
            throw(err);
        }
    }
    
    async detachFromMinecraft () {
        try {
            let properties = this.properties;
            await this.log('Detaching from Minecraft output.');
            if (properties.serverProcess && properties.serverProcess.pid) {
                properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
            }
            properties.serverOutput.length = 0;
            properties.serverOutputCaptured = false;
        } catch (err) {
            throw(err);
        }
    }

    bufferMinecraftOutput (data) {
        this.properties.serverOutput.push(data.toString().trim());
    }

    /**
     * Watches the Minecraft stdout lines. If they stop growing, return.
     */
    async waitForBufferToBeFull (time, max = 30) {
        let properties = this.properties;
        let serverOutput = properties.serverOutput;
        let length = serverOutput.length + 0;

        if (!time) {
            time = 2;
        }

        await this.log('Waiting on Minecraft buffer...');
        await Util.wait(time);
        if (properties.serverOutputCaptured) {
            if (serverOutput.length && serverOutput.length != length) {
                await this.log(`Minecraft buffer appers to be full with ${serverOutput.length} entries.`);
            } else {
                if (time < max) {
                    await this.waitForBufferToBeFull(1, time - 1);
                }
            }
        } else {
            await this.log('Lost the connection to the Minecraft buffer.');
        }
    }

    /**
     * Logs things to a file.
     * @param {string} data The data to log.
     */
    async log (data) {
        try {
            await Util.log(data, 'minecraft-server.log');
        } catch (err) {
            throw(err);
        }
    }

    /**
     * Clears the log file.
     */
    async clearLog () {
        try {
            await Util.clearLog('minecraft-server.log');
        } catch (err) {
            throw(err);
        }
    }
}

module.exports = MinecraftServer;

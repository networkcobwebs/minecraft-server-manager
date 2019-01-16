
const archiver = require('archiver');
const exec = require('child_process').exec;
const fs = require('fs-extra');
const https = require('https');
const os = require('os');
const spawn = require('child_process').spawn;

const debug = false;

let defaultProperties = {
    acceptedEula: false,
    allowedCommands: [],
    backupList: [],
    bannedIps: {},
    bannedPlayers: {},
    detectedVersion: null,
    eulaFound: false,
    eulaUrl: 'https://account.mojang.com/documents/minecraft_eula',
    fullHelp: [],
    helpPages: 0,
    installed: false,
    javaHome: '',
    ops: {},
    osType: os.type(),
    pathToMinecraftDirectory: 'minecraft_server',
    serverJar: 'minecraft_server.jar',
    serverLog: 'minecraft_server.log',
    serverLogDir: 'logs',
    serverOutput: [],
    serverOutputCaptured: false,
    serverProperties: {},
    serverProcess: null,
    starting: false,
    started: false,
    startedTimer: null,
    startTime: null,
    stopping: false,
    stopped: false,
    stoppedTimer: null,
    userCache: {},
    versions: {},
    whitelist: {}
};

// Convert name=value properties to JSON
function convertPropertiesToObjects (props) {
    if (debug) {
        console.log('Converting properties', props, 'to object.');
    }

    let properties = [],
        incomingProperties = props.split(/\n/),
        line, lineNumber, property;

    for (lineNumber = 0; lineNumber < incomingProperties.length; lineNumber++) {
        // Skip blank lines
        if (incomingProperties[lineNumber]) {
            line = incomingProperties[lineNumber].split('=');
            if (line.length == 2) {
                // Got name=value pair
                // TODO: Ignore commented out values: '//', '#', etc.?
                property = {};
                property.name = line[0];
                property.value = line[1];
                properties.push(property);
            }
        }
    }

    if (debug) {
        console.log('Converted to:');
        console.log(properties);
    }

    return properties;
}

function createDateTimestamp (aDate) {
    let theDate, theTime;
        
    if (!aDate) {
        theDate = new Date();
        theTime = createTimestamp(theDate);
    } else {
        theDate = aDate;
        theTime = createTimestamp(theDate);
    }

    theDate = theDate.getFullYear() + '-'
        + ('0' + (theDate.getMonth()+1)).slice(-2) + '-'
        + ('0' + (theDate.getDate())).slice(-2) + '_'
        + theTime;
    
    return theDate;
}

function createTimestamp (aDate) {
    let theDate;

    if (!aDate) {
        theDate = new Date();
    } else {
        theDate = aDate;
    }
    
    theDate = ('0' + theDate.getHours()).slice(-2) + ':'
        + ('0' + (theDate.getMinutes()+1)).slice(-2) + ':'
        + ('0' + (theDate.getSeconds())).slice(-2);

    return theDate;
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

    constructor () {
        // TODO Deal with properties passed in
        if (!this._properties) {
            this._properties = defaultProperties;
        }
        
        this.acceptEula = this.acceptEula.bind(this);
        this.bufferMinecraftOutput = this.bufferMinecraftOutput.bind(this);
        this.checkForMinecraftToBeStarted = this.checkForMinecraftToBeStarted.bind(this);
        this.checkForMinecraftToBeStopped = this.checkForMinecraftToBeStopped.bind(this);
        this.detectJavaHome = this.detectJavaHome.bind(this);
        this.detectMinecraftDir = this.detectMinecraftDir.bind(this);
        this.detectMinecraftJar = this.detectMinecraftJar.bind(this);
        this.getBannedIps = this.getBannedIps.bind(this);
        this.getBannedPlayers = this.getBannedPlayers.bind(this);
        this.getEula = this.getEula.bind(this);
        this.getMinecraftVersions = this.getMinecraftVersions.bind(this);
        this.getServerProperties = this.getServerProperties.bind(this);
        this.getUserCache = this.getUserCache.bind(this);
        this.install = this.install.bind(this);
        this.listCommands = this.listCommands.bind(this);
        this.getMinecraftPlayers = this.getMinecraftPlayers.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.waitForHelpOutput = this.waitForHelpOutput.bind(this);
        
        this.detectMinecraftDir();
        this.detectMinecraftJar();
        this.getMinecraftVersions();
        this.getEula();
        this.getServerProperties();
        this.getUserCache();
        this.getOps();
        this.getBannedIps();
        this.getBannedPlayers();
        this.getWhitelist();
    }

    acceptEula () {
        if (debug) {
            console.log('Checking and accepting MinecraftServer EULA...');
        }

        let properties = this.properties;
        let eula;
        let line;
        let lineNumber;
    
        if (properties.acceptedEula === 'false' || !properties.acceptedEula) {
            console.log('Accepting EULA...');
            try {
                eula = fs.readFileSync(properties.pathToMinecraftDirectory + '/eula.txt', 'utf8').split(/\n/);
                for (lineNumber = 0; lineNumber < eula.length; lineNumber++) {
                    if (eula[lineNumber]) {
                        line = eula[lineNumber].split('=');
                        if (line.length == 2) {
                            eula[lineNumber] = 'eula=true';
                        }
                    }
                }
            } catch (e) {
                if (debug) {
                    console.log('Failed to read eula.txt:', e.stack);
                }
            }
    
            // write the eula.txt file
            fs.writeFile(properties.pathToMinecraftDirectory + '/eula.txt', eula.join('\n'), (err) => {
                if (err) {
                    console.log('Failed to write eula.txt:', err);
                    throw err;
                }
                properties.acceptedEula = true;
            });
        }
    }

    backupWorld (worldName) {
        if (debug) {
            console.log('Backing up MinecraftServer world...');
        }

        let properties = this.properties;
        worldName = worldName || 'world';

        // TODO Allow backup path to be set
        let backupDir = properties.pathToMinecraftDirectory + '/worldBackups',
            archive, output;
        
        fs.ensureDirSync(backupDir);
        
        try {
            fs.accessSync(backupDir, fs.F_OK | fs.R_OK | fs.W_OK);
    
            archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });
            output = fs.createWriteStream(backupDir + '/' + worldName + '_' + createDateTimestamp() + '.zip');
    
            archive.on('error', function(err) {
                throw err;
            });
            output.on('close', function() {
                this.start(() => {
                    console.log('Backup size: ' + archive.pointer() + ' total bytes');
                    // console.log('Archive has been finalized and the output file descriptor has closed.');
                    console.log('MinecraftServer World backed up.');
                });
            });
    
            if (properties.started) {
                this.stop(() => {
                    // zip world dir
                    archive.pipe(output);
                    archive.directory(properties.pathToMinecraftDirectory + '/' + worldName, false);
                    archive.finalize();
                });
            } else {
                // zip world dir
                archive.pipe(output);
                archive.directory(properties.pathToMinecraftDirectory + '/' + worldName, false);
                archive.finalize();
                console.log('MinecraftServer World backed up.');
            }
        } catch (e) {
            console.log('Backup directory does not exist, creating.');
            fs.ensureDirSync(backupDir);
            output.close();
        }
    }

    bufferMinecraftOutput (data) {
        this.properties.serverOutput.push(data.toString().trim());
    }

    checkForMinecraftToBeStarted (checkCount, callback) {
        if (debug) {
            console.log('Checking for MinecraftServer process to be started ('+ checkCount +')...');
        }

        let properties = this.properties;
        let threshold = 1000;
        let line = "";
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
            while( (line = properties.serverOutput.shift()) !== undefined ) {
                if (line.indexOf('eula.txt') !== -1) {
                    properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                    properties.serverOutput.length = 0;
                    properties.serverOutputCaptured = false;
                    shouldContinueStart = false;
                    if (typeof callback === 'function') {
                        this.stop(callback);
                    }
                    console.log('The Minecraft EULA needs to be accepted. MinecraftServer start aborted.');
                    console.log('Use the web interface to view and accept the Minecraft license agreement, or accept it manually.');
                    if (!properties.eulaFound) {
                        this.getEula();
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
                } else if (!properties.detectedVersion && line.indexOf('server version') !== -1) {
                    versionParts = line.toString().split('.');
                    major = versionParts.shift();
                    minor = versionParts.shift();
                    release = versionParts.shift().trim();
                    versionParts = major.split('version ');
                    major = versionParts[versionParts.length - 1];
                    properties.detectedVersion = major + '.' + minor + '.' + release;
                    console.log('Detected MinecraftServer version:', properties.detectedVersion);
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
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            }
        
            if (!properties.started && shouldContinueStart) {
                properties.startedTimer = setTimeout(() => {
                    this.checkForMinecraftToBeStarted(++checkCount, callback);
                }, 100);
            }
        }
    }
    
    checkForMinecraftToBeStopped (checkCount, callback) {
        if (debug) {
            console.log('Checking for MinecraftServer process to be stopped...');
        }

        let properties = this.properties;
        let threshold = 1000;
    
        if (checkCount > threshold) {
            // Pop back out. Minecraft may or may not ever be stopped.
            properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
            properties.serverOutputCaptured = false;
            properties.serverProcess.kill();
            properties.serverOutput.length = 0;
            console.log('MinecraftServer was forced to stop.');
            if (typeof callback === 'function') {
                callback();
            }
        } else {
            properties.serverOutput.forEach((line) => {
                if (line.indexOf('Shutdown Thread') !== -1 && line.indexOf('Saving') !== -1) {
                    console.log('MinecraftServer stopped.');
                    properties.started = false;
                    properties.startTime = null;
                    properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                    properties.serverOutputCaptured = false;
                    properties.serverOutput.length = 0;
                    properties.stopping = false;
                    properties.serverProcess.kill();
                    properties.stopped = true;
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            });
        
            if (properties.started) {
                properties.stoppedTimer = setTimeout(() => {
                    this.checkForMinecraftToBeStopped(++checkCount, callback);
                }, 500);
            }
        }
    }
    
    deleteWorld (worldName, backupWorld) {
        if (debug) {
            console.log('Deleting MinecraftServer world...');
        }

        let properties = this.properties;

        worldName = worldName || 'world';
        backupWorld = backupWorld || false;

        if (backupWorld) {
            // TODO backup the world
        }
        
        try {
            fs.accessSync(__dirname + '/' + properties.pathToMinecraftDirectory + '/' + worldName,
                fs.F_OK | fs.R_OK | fs.W_OK);
    
            console.log('World to be deleted: ' + properties.pathToMinecraftDirectory + '/' + worldName);
            fs.removeSync(properties.pathToMinecraftDirectory + '/' + worldName);
            console.log('World deleted.');
        }
        catch (e) {
            console.log('An error occurred deleting world data:', e.stack);
        }
    }

    detectJavaHome (callback) {
        if (debug) {
            console.log('Detecting Java...');
        }
        let properties = this.properties;
        let osType = properties.osType;

        if (osType.indexOf('Windows') !== -1) {
            // do Windows related things
            // set javaHome from Windows? LOTS OF POTENTIAL PLACES
        } else if (osType.indexOf('Linux') !== -1) {
            // do Linux related things
            // set javaHome from profile? bash_profile? bash_rc? TOO MANY PLACES
        } else if (osType.indexOf('Darwin') !== -1) {
            // do Mac related things
            exec('/usr/libexec/java_home', (err, stdout, stderr) => {
                if (err) {
                    console.log('Could not set JAVA_HOME. Make sure Java is properly installed.');
                    console.log(stderr);
                    throw err;
                } else {
                    properties.javaHome = stdout.trim();
                    if (debug) {
                        console.log('Using java from', properties.javaHome);
                    }
                }
                if (typeof callback === 'function') {
                    callback();
                }
                if (debug) {
                    console.log('Done detecting Java.');
                }
            });
        }
    }

    detectMinecraftDir () {
        // find the Minecraft server directory
        if (debug) {
            console.log('Detecting MinecraftServer directory...');
        }

        let properties = this.properties;
        
        try {
            fs.accessSync(properties.pathToMinecraftDirectory, fs.F_OK | fs.R_OK | fs.W_OK);
            console.log('Found MinecraftServer directory.');
        } catch (e) {
            console.log('MinecraftServer directory does not exist.');
            if (debug) {
                console.log('An error occurred reading the Minecraft server directory:', e.stack);
            }
        }

        if (debug) {
            console.log('Done detecting MinecraftServer directory.');
        }
    }

    detectMinecraftJar () {
        // find the server.jar to run
        // We download versions and name them release_serverJar in the install function
        if (debug) {
            console.log('Detecting MinecraftServer jar...');
        }

        let properties = this.properties;
        let minecraftFiles;

        try {
            minecraftFiles = fs.readdirSync(properties.pathToMinecraftDirectory);
            minecraftFiles.forEach(file => {
                if (file.indexOf('server.jar') !== -1) {
                    properties.installed = true;
                    properties.serverJar = file; // TODO what about multiple versions?
                    console.log('Found Minecraft jar.');
                }
            });
        } catch (e) {
            console.log('MinecraftServer not installed.');
            properties.installed = false;
            if (debug) {
                console.log(e.stack);
            }
        }

        if (debug) {
            console.log('Done detecting MinecraftServer jar.');
        }
    }

    getBannedIps () {
        let properties = this.properties;
        
        if (properties.eulaFound) {
            if (debug) {
                console.log('Getting MinecraftServer banned IPs...');
            }

            try {
                properties.bannedIps = JSON.parse(fs.readFileSync(properties.pathToMinecraftDirectory + '/banned-ips.json', 'utf8'));
            } catch (e) {
                properties.bannedIps = {};
                if (debug) {
                    console.log('Failed to read banned-ips.json:', e.stack);
                }
            }
        }
    }
    
    getBannedPlayers () {
        let properties = this.properties;
        
        if (properties.eulaFound) {
            if (debug) {
                console.log('Getting MinecraftServer banned players...');
            }

            try {
                properties.bannedPlayers = JSON.parse(fs.readFileSync(properties.pathToMinecraftDirectory + '/banned-players.json', 'utf8'));
            } catch (e) {
                properties.bannedPlayers = {};
                if (debug) {
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
        if (debug) {
            console.log('Getting MinecraftServer EULA acceptance state...');
        }

        let eula;
        let eulaUrlLine;
        let line;
        let lineNumber;
        let properties = this.properties;
    
        console.log('Reading MinecraftServer eula.txt...');
        try {
            eula = fs.readFileSync(this.properties.pathToMinecraftDirectory + '/eula.txt', 'utf8').split(/\n/);
            
            for (lineNumber = 0; lineNumber < eula.length; lineNumber++) {
                if (eula[lineNumber]) {
                    eulaUrlLine = eula[lineNumber].split('https://');
                    if (eulaUrlLine.length == 2) {
                        properties.eulaUrl = 'https://' + eulaUrlLine[1].substr(0, eulaUrlLine[1].indexOf(')'));
                        console.log('MinecraftServer EULA location: ' + properties.eulaUrl);
                    }
                    line = eula[lineNumber].split('=');
                    if (line.length == 2) {
                        properties.acceptedEula = !!JSON.parse(line[1]);
                        console.log('MinecraftServer EULA accepted?', properties.acceptedEula);
                    }
                }
            }
            properties.eulaFound = true;
            properties.installed = true;
        } catch (e) {
            console.log('Failed to read eula.txt.');
            if (debug) {
                console.log(e.stack);
            }
            console.log('Minecraft probably needs to be run once to stage new files.');
            console.log('Use the web interface to start the Minecraft server and accept the license agreement.');
            properties.eulaFound = false;
            properties.installed = false;
        }
    }
    
    getMinecraftVersions () {
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
                    if (debug) {
                        console.log('Got Minecraft version list.');
                    }
                    minecraftVersions.versions.forEach(version => {
                        if (version.type === 'release') {
                            releaseVersions.push(version);
                        } else if (version.type === 'snapshot') {
                            snapshotVersions.push(version);
                        }
                    });
                    this.properties.versions = { "releaseVersions": releaseVersions, "snapshotVersions":snapshotVersions };
                    this.install();
                } catch (e) {
                    console.log('An error occurred processing the Minecraft official version list:', e.stack);
                    console.log(minecraftVersionsArray.join(''));
                }
            });
        }).on('error', (e) => {
            console.error('An error occurred retrieving the Minecraft official version list:', e.stack);
        });
    }
    
    getOps () {
        if (debug) {
            console.log('Getting MinecraftServer ops...');
        }

        let properties = this.properties;

        if (this.properties.eulaFound) {
            try {
                properties.ops = JSON.parse(fs.readFileSync(properties.pathToMinecraftDirectory + '/ops.json', 'utf8'));
            } catch (e) {
                properties.ops = {};
                if (debug) {
                    console.log('Failed to read ops.json:', e.stack);
                }
            }
        }
    }

    getServerProperties () {
        if (debug) {
            console.log('Getting MinecraftServer properties...');
        }

        let properties = this.properties;

        if (this.properties.eulaFound) {
            try {
                let serverPropertiesFile = fs.readFileSync(properties.pathToMinecraftDirectory + '/server.properties', 'utf8');
                properties.serverProperties = convertPropertiesToObjects(serverPropertiesFile);
            } catch (e) {
                properties.serverProperties = {};
                if (debug) {
                    console.log('Failed to read server.properties:', e.stack);
                }
            }
        }
    }

    getUserCache () {
        if (debug) {
            console.log('Getting MinecraftServer user cache...');
        }

        let properties = this.properties;

        if (this.properties.eulaFound) {
            try {
                properties.userCache = JSON.parse(fs.readFileSync(properties.pathToMinecraftDirectory + '/usercache.json', 'utf8'));
            } catch (e) {
                properties.userCache = {};
                if (debug) {
                    console.log('Failed to read usercache.json:', e.stack);
                }
            }
        }
    }

    getWhitelist () {
        if (debug) {
            console.log('Getting MinecraftServer white list...');
        }

        let properties = this.properties;

        if (properties.eulaFound) {
            try {
                properties.whitelist = JSON.parse(fs.readFileSync(properties.pathToMinecraftDirectory + '/whitelist.json', 'utf8'));
            } catch (e) {
                properties.whitelist = {};
                if (debug) {
                    console.log('Failed to read whitelist.json:', e.stack);
                }
            }
        }
    }

    install () {
        let minecraftVersionInfo = [];
        let properties = this.properties;
        let pathToMinecraftDirectory = properties.pathToMinecraftDirectory;
        let serverJar = properties.serverJar;
        
        if (properties.versions.releaseVersions) {
            let release = properties.versions.releaseVersions[0];
            try {
                fs.accessSync(pathToMinecraftDirectory, fs.F_OK | fs.R_OK | fs.W_OK);
                fs.accessSync(pathToMinecraftDirectory + '/' + serverJar, fs.F_OK | fs.R_OK | fs.W_OK);
            } catch (e) {
                try {
                    fs.accessSync(pathToMinecraftDirectory, fs.F_OK | fs.R_OK | fs.W_OK);
                    console.log('Minecraft server directory exists.');
                } catch (e) {
                    console.log('Creating MinecraftServer directory...');
                    fs.mkdirSync(pathToMinecraftDirectory);
                    console.log('Complete.');
                }
                try {
                    fs.accessSync(pathToMinecraftDirectory + '/' + release.id + '_' + serverJar, fs.F_OK | fs.R_OK | fs.W_OK);
                    properties.serverJar = release.id + '_' + serverJar;
                    console.log('Minecraft server jar found.');
                } catch (e) {
                    // Fetch latest release
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
                                    let version = release.id + '_' + serverJar;
                                    let fileStream = fs.createWriteStream(pathToMinecraftDirectory + '/' + version);
                                    https.get(minecraftVersionInfo.downloads.server.url, (aJar) => {
                                        aJar.pipe(fileStream);
                                        fileStream.on('finish', ()  => {
                                            fileStream.close();  // close() is async.
                                            console.log('Download of Minecraft server complete.');
                                            if (!properties.eulaFound) {
                                                this.getEula();
                                            }
                                        });
                                    });
                                } else {
                                    console.log('Minecraft server not available for installation.');
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
            }
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
            } else {
                setTimeout(() => {
                    this.listCommands(++checkCount, callback);
                }, 100);
            }
        } else {
            console.log('Could not get MinecraftServer commands.');
        }
    }

    listWorldBackups () {
        if (debug) {
            console.log('Getting list of MinecraftServer world backups...');
        }

        let properties = this.properties;

        // TODO Allow backup path to be set
        let backupDir = properties.pathToMinecraftDirectory + '/worldBackups';
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

    start (version, callback) {
        // TODO: Fix the async-ness of detectJavaHome
        this.detectJavaHome( () => {
            console.info('Starting MinecraftServer...');

            let properties = this.properties;
            let javaHome = properties.javaHome;
            let java = javaHome + '/bin/java';
            let pathToMinecraftDirectory = properties.pathToMinecraftDirectory;
            let serverJar = properties.serverJar;
            let serverOutput = properties.serverOutput;
            let serverOutputCaptured = properties.serverOutputCaptured;
            let serverProcess = properties.serverProcess;
            let startedTimer = properties.startedTimer;
            let starting = properties.starting;

            if (typeof version === 'function') {
                callback = version;
                version = null;
            }

            if (javaHome) {
                try {
                    fs.accessSync(pathToMinecraftDirectory + '/' + serverJar, fs.F_OK | fs.R_OK | fs.W_OK);
                    // TODO: Make the Java + args configurable
                    serverProcess = properties.serverProcess = spawn(java, [
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
                
                    if (!serverOutputCaptured) {
                        starting = true;
                        serverOutputCaptured = true;
                        serverOutput.length = 0;
                        serverProcess.stdout.addListener('data', this.bufferMinecraftOutput);
                
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
                    } else {
                        setTimeout(() => {
                            this.start(callback);
                        }, 1000);
                    }
                } catch (e) {
                    console.log('MinecraftServer executable not found.');
                    if (debug) {
                        console.error(e.stack);
                    }
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            } else {
                console.log('JAVA_HOME not set.');
            }
        });
    }

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
            if (!serverOutputCaptured) {
                stopping = true;
                serverOutputCaptured = true;
                serverOutput.length = 0;
                serverProcess.stdout.addListener('data', this.bufferMinecraftOutput);
    
                serverProcess.stdin.write('/stop\n');
    
                if (stoppedTimer) {
                    clearTimeout(stoppedTimer);
                }
    
                stoppedTimer = setTimeout(() => {
                    this.checkForMinecraftToBeStopped(0, callback);
                }, 1000);
            } else if (stopping && serverOutputCaptured) {
                clearTimeout(stoppedTimer);
                stoppedTimer = setTimeout(() => {
                    this.checkForMinecraftToBeStopped(0, callback);
                }, 1000);
            } else {
                setTimeout(() => {
                    this.stop(callback);
                }, 100);
            }
        } else {
            if (typeof callback === 'function') {
                stopping = false;
                callback();
            }
        }
    }

    waitForHelpOutput (buffer, callback) {
        let bufferMinecraftOutput = this.bufferMinecraftOutput;
        let minecraftFullHelp = this.properties.fullHelp;
        let minecraftHelpPages = this.properties.helpPages;
        let minecraftOutput = this.properties.serverOutput;
        let minecraftServerProcess = this.properties.serverProcess;
        let line;

        while( (line = this.properties.serverOutput.shift()) !== undefined ) {
            if (line.indexOf('Showing help page') !== -1) {
                this.properties.serverProcess.stdout.removeListener('data', bufferMinecraftOutput);
                this.properties.serverOutput.length = 0;
    
                let part1 = line.split('Showing help page ');
                let part2 = part1[1].split(' ');
                this.properties.helpPages = parseInt(part2[2]);
    
                this.properties.serverProcess.stdout.addListener('data', bufferMinecraftOutput);
                for (let i = 1; i <= minecraftHelpPages; i++) {
                    minecraftServerProcess.stdin.write('/help ' + i + '\n');
                }
                setTimeout(() => {
                    this.properties.serverProcess.stdout.removeListener('data', bufferMinecraftOutput);
                    while ( (line = minecraftOutput.shift()) !== undefined ) {
                        let command = {};
                        let commandLine = line.split(' [Server thread/INFO]: ');
    
                        if (commandLine[1].indexOf('/') === 0) {
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
        
                            this.properties.allowedCommands.push(command);
                        }
                    }
                    // console.log("playerList:", playerList);
                    if (typeof callback === 'function') {
                        callback(playersInfo);
                    }
                }.bind(this), 250);
            }

        } else {
            console.log('TODO: complete error handling');
        }
    }
}

module.exports = MinecraftServer;

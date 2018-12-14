const fs = require('fs-extra');
const archiver = require('archiver');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const os = require('os');

const debug = false;

defaultProperties = {
    acceptedEula: false,
    allowedCommands: [],
    backupList: [],
    bannedIps: {},
    bannedPlayers: {},
    version: null,
    eulaUrl: 'https://account.mojang.com/documents/minecraft_eula',
    fullHelp: [],
    helpPages: 0,
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
    version: '',
    whitelist: {}
}

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

    constructor (props) {
        // TODO Deal with properties passed in
        if (!this._properties) {
            this._properties = defaultProperties;
        }
        
        this.acceptEula = this.acceptEula.bind(this);
        this.bufferMinecraftOutput = this.bufferMinecraftOutput.bind(this);
        this.checkForMinecraftToBeStarted = this.checkForMinecraftToBeStarted.bind(this);
        this.checkForMinecraftToBeStopped = this.checkForMinecraftToBeStopped.bind(this);
        this.getBannedIps = this.getBannedIps.bind(this);
        this.getBannedPlayers = this.getBannedPlayers.bind(this);
        this.getEula = this.getEula.bind(this);
        this.getServerProperties = this.getServerProperties.bind(this);
        this.listCommands = this.listCommands.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.waitForHelpOutput = this.waitForHelpOutput.bind(this);
        
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

        let eula, line, lineNumber;
    
        if (this.properties.acceptedEula === 'false' || !this.properties.acceptedEula) {
            console.log('Accepting EULA...');
            try {
                eula = fs.readFileSync(this.properties.pathToMinecraftDirectory + '/eula.txt', 'utf8').split(/\n/);
                for (lineNumber = 0; lineNumber < eula.length; lineNumber++) {
                    if (eula[lineNumber]) {
                        line = eula[lineNumber].split('=');
                        if (line.length == 2) {
                            eula[lineNumber] = 'eula=true';
                        }
                    }
                }
            } catch (e) {
                console.log('Failed to read eula.txt:', e);
                throw e;
            }
    
            // write the eula.txt file
            fs.writeFile(this.properties.pathToMinecraftDirectory + '/eula.txt', eula.join('\n'), (err) => {
                if (err) {
                    console.log('Failed to write eula.txt:', e);
                    throw e
                }
                this.properties.acceptedEula = true;
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
        let backupDir = properties.pathToMinecraftDirectory + '/worldBackups';
        
        fs.ensureDirSync(backupDir);
        
        try {
            fs.accessSync(backupDir, fs.F_OK | fs.R_OK | fs.W_OK);
    
            let archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });
            let output = fs.createWriteStream(backupDir + '/' + worldName + '_' + createDateTimestamp() + '.zip');
    
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
            console.log('Checking for MinecraftServer process to be started...');
        }

        let threshold = 1000,
            line = "",
            versionParts = [],
            major, minor, release;
    
        if (checkCount > threshold) {
            // Pop back out. Minecraft may or may not come up.
            this.properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
            this.properties.serverOutput.length = 0;
            this.properties.serverOutputCaptured = false;
            console.log('Failed to detect running MinecraftServer. Continuing.');
            if (typeof callback === 'function') {
                callback();
            }
        } else {
            while( (line = this.properties.serverOutput.shift()) !== undefined ) {
                if (line.indexOf('eula.txt') !== -1) {
                    this.properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                    this.properties.serverOutput.length = 0;
                    this.properties.serverOutputCaptured = false;
                    this.stopMinecraft(callback);
                } else if (line.toLowerCase().indexOf('failed') !== -1) {
                    console.log('An error occurred starting MinecraftServer. Check the Minecraft log.');
                    this.properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                    this.properties.serverOutput.length = 0;
                    this.properties.serverOutputCaptured = false;
                    process.exit(1);
                } else if (line.toLowerCase().indexOf('stopping server') !== -1) {
                    console.log('An error occurred starting MinecraftServer. Check the Minecraft log.');
                    this.properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                    this.properties.serverOutput.length = 0;
                    this.properties.serverOutputCaptured = false;
                    process.exit(1);
                } else if (!this.properties.version && line.indexOf('server version') !== -1) {
                    versionParts = line.toString().split('.');
                    major = versionParts.shift();
                    minor = versionParts.shift();
                    release = versionParts.shift().trim();
                    versionParts = major.split('version ');
                    major = versionParts[versionParts.length - 1];
                    this.properties.version = major + '.' + minor + '.' + release;
                    console.log('Detected MinecraftServer version:', this.properties.version);
                } else if (!this.properties.started && line.indexOf('Done') !== -1) {
                    console.log('MinecraftServer started.');
                    this.properties.acceptedEula = true;
                    this.properties.started = true;
                    this.properties.startTime = Date.now();
                    this.properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                    this.properties.serverOutput.length = 0;
                    this.properties.serverOutputCaptured = false;
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            }
        
            if (!this.properties.started) {
                this.properties.startedTimer = setTimeout(() => {
                    this.checkForMinecraftToBeStarted(++checkCount, callback);
                }, 100);
            }
        }
    }
    
    checkForMinecraftToBeStopped (checkCount, callback) {
        if (debug) {
            console.log('Checking for MinecraftServer process to be stopped...');
        }

        let threshold = 1000;
    
        if (checkCount > threshold) {
            // Pop back out. Minecraft may or may not ever be stopped.
            this.properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
            this.properties.serverOutputCaptured = false;
            this.properties.serverProcess.kill();
            this.properties.serverOutput.length = 0;
            console.log('MinecraftServer was forced to stop.');
            if (typeof callback === 'function') {
                callback();
            }
        } else {
            this.properties.serverOutput.forEach((line) => {
                if (line.indexOf('Shutdown Thread') !== -1 && line.indexOf('Saving') !== -1) {
                    console.log('MinecraftServer stopped.');
                    this.properties.started = false;
                    this.properties.startTime = null;
                    this.properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
                    this.properties.serverOutputCaptured = false;
                    this.properties.serverOutput.length = 0;
                    this.properties.stopping = false;
                    this.properties.serverProcess.kill();
                    this.properties.stopped = true;
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            });
        
            if (this.properties.started) {
                this.properties.stoppedTimer = setTimeout(() => {
                    this.checkForMinecraftToBeStopped(++checkCount, callback);
                }, 500);
            }
        }
    }
    
    deleteWorld (worldName, backupWorld) {
        if (debug) {
            console.log('Deleting MinecraftServer world...');
        }

        worldName = worldName || 'world';
        backupWorld = backupWorld || false;
        
        try {
            fs.accessSync(__dirname + '/' + this.properties.pathToMinecraftDirectory + '/' + worldName,
                fs.F_OK | fs.R_OK | fs.W_OK);
    
            console.log('World to be deleted: ' + this.properties.pathToMinecraftDirectory + '/' + worldName);
            fs.removeSync(this.properties.pathToMinecraftDirectory + '/' + worldName);
            console.log('World deleted.');
        }
        catch (e) {
            console.log('An error occurred deleting world data:', e);
        }
    }

    getBannedIps () {
        if (debug) {
            console.log('Getting MinecraftServer banned IPs...');
        }

        try {
            this.properties.bannedIps = JSON.parse(fs.readFileSync(this.properties.pathToMinecraftDirectory + '/banned-ips.json', 'utf8'));
        } catch (e) {
            this.properties.bannedIps = {};
            console.log('Failed to read banned-ips.json:', e);
        }
    }
    
    getBannedPlayers () {
        if (debug) {
            console.log('Getting MinecraftServer banned players...');
        }

        try {
            this.properties.bannedPlayers = JSON.parse(fs.readFileSync(this.properties.pathToMinecraftDirectory + '/banned-players.json', 'utf8'));
        } catch (e) {
            this.properties.bannedPlayers = {};
            console.log('Failed to read banned-players.json:', e);
        }
    }

    getEula () {
        if (debug) {
            console.log('Getting MinecraftServer EULA acceptance state...');
        }

        let eula, eulaUrlLine, line, lineNumber;
    
        console.log('Reading MinecraftServer eula.txt...');
        try {
            eula = fs.readFileSync(this.properties.pathToMinecraftDirectory + '/eula.txt', 'utf8').split(/\n/);
            
            for (lineNumber = 0; lineNumber < eula.length; lineNumber++) {
                if (eula[lineNumber]) {
                    eulaUrlLine = eula[lineNumber].split('https://');
                    if (eulaUrlLine.length == 2) {
                        this.properties.eulaUrl = 'https://' + eulaUrlLine[1].substr(0, eulaUrlLine[1].indexOf(')'));
                        console.log('MinecraftServer EULA location: ' + this.properties.eulaUrl);
                    }
                    line = eula[lineNumber].split('=');
                    if (line.length == 2) {
                        this.properties.acceptedEula = !!JSON.parse(line[1]);
                        console.log('MinecraftServer EULA accepted?', this.properties.acceptedEula);
                    }
                }
            }
        } catch (e) {
            console.log('Failed to read eula.txt:', e);
            throw e;
        }
    }
    
    getOps () {
        if (debug) {
            console.log('Getting MinecraftServer ops...');
        }

        try {
            this.properties.ops = JSON.parse(fs.readFileSync(this.properties.pathToMinecraftDirectory + '/ops.json', 'utf8'));
        } catch (e) {
            this.properties.ops = {};
            console.log('Failed to read ops.json:', e);
        }
    }

    getServerProperties () {
        if (debug) {
            console.log('Getting MinecraftServer properties...');
        }
        try {
            let serverPropertiesFile = fs.readFileSync(this.properties.pathToMinecraftDirectory + '/server.properties', 'utf8');
            this.properties.serverProperties = convertPropertiesToObjects(serverPropertiesFile);
        } catch (e) {
            this.properties.serverProperties = {};
            console.log('Failed to read server.properties:', e);
            // return e;
        }
    }

    getUserCache () {
        if (debug) {
            console.log('Getting MinecraftServer user cache...');
        }
        try {
            this.properties.userCache = JSON.parse(fs.readFileSync(this.properties.pathToMinecraftDirectory + '/usercache.json', 'utf8'));
        } catch (e) {
            this.properties.userCache = {};
            console.log('Failed to read usercache.json:', e);
        }
    }

    getWhitelist () {
        if (debug) {
            console.log('Getting MinecraftServer white list...');
        }
        try {
            this.properties.whitelist = JSON.parse(fs.readFileSync(this.properties.pathToMinecraftDirectory + '/whitelist.json', 'utf8'));
        } catch (e) {
            this.properties.whitelist = {};
            console.log('Failed to read whitelist.json:', e);
        }
    }

    listCommands (checkCount, callback) {
        let allowedCommands = this.properties.allowedCommands,
            serverOutputCaptured = this.properties.serverOutputCaptured,
            serverOutput = this.properties.serverOutput,
            serverProcess = this.properties.serverProcess,
            threshold = 100;
    
        if (!checkCount) {
            checkCount = 0;
        }
    
        if (checkCount < threshold) {
            if (started && !serverOutputCaptured) {
                allowedCommands = [];
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

        // TODO Allow backup path to be set
        let backupDir = this.properties.pathToMinecraftDirectory + '/worldBackups'
            backupList = [],
            files = [],
            readError = {};
        
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
        
        this.properties.backupList = backupList;
    }

    waitForHelpOutput (buffer, callback) {
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
                            let aThing = {}
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
                                let things = getCommand(c, true, false);
                                for (let thing of things) {
                                    args.push(thing);
                                }
                            }
                            if (args.length) {
                                command['requiredArgs'] = Array.from(new Set(args));
                            }
    
                            args.length = 0;
                            for (let c of commands) {
                                let things = getCommand(c, false, true);
                                for (let thing of things) {
                                    args.push(thing);
                                }
                            }
                            if (args.length) {
                                command['optionalArgs'] = Array.from(new Set(args));
                            }
        
                            this.properties.allowedCommands.push(command);
                        }
                    }
    
                    this.properties.serverOutput.length = 0;
                    this.properties.serverOutputCaptured = false;
                    if (typeof callback === 'function') {
                        callback();
                    }
                }, 500);
            }
        }
    }

    start (callback) {
        console.info('Starting MinecraftServer...');

        let properties = this.properties,
            serverOutput = properties.serverOutput,
            pathToMinecraftDirectory = properties.pathToMinecraftDirectory,
            serverJar = properties.serverJar,
            serverProcess = properties.serverProcess,
            serverOutputCaptured = properties.serverOutputCaptured,
            startedTimer = properties.startedTimer,
            starting = properties.starting;

        try {
            fs.accessSync(pathToMinecraftDirectory + '/' + serverJar, fs.F_OK | fs.R_OK | fs.W_OK);
            // TODO: Make the Java + args configurable
            serverProcess = this.properties.serverProcess = spawn('java', [
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
                    this.start(callback)
                }, 1000);
            }
        } catch (e) {
            console.log('MinecraftServer executable not found.');
            console.error(e);
            if (typeof callback === 'function') {
                callback();
            }
        }
    }

    stop (callback) {
        console.log('Stopping MinecraftServer...');

        let properties = this.properties,
            serverOutput = properties.serverOutput,
            serverProcess = properties.serverProcess,
            serverOutputCaptured = properties.serverOutputCaptured,
            started = properties.started,
            stoppedTimer = properties.stoppedTimer,
            stopping = properties.stopping;

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
}

module.exports = MinecraftServer;

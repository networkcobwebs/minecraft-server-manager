const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const os = require('os');
const https = require('https');

let pathToMinecraftDirectory = 'minecraft_server',
    minecraftServerJar = 'minecraft_server.jar',
    minecraftServerProcess,
    minecraftServerLog = 'minecraft_server.log',
    minecraftStarting, minecraftStarted, minecraftStartedTimer, minecraftStartTime,
    minecraftStopping, minecraftStoppedTimer,
    minecraftOutput = [],
    minecraftServerOutputCaptured = false,
    minecraftCurrentVersion,
    minecraftCommands = [],
    minecraftHelpPages,
    minecraftFullHelp = [],
    minecraftEulaUrl = 'https://account.mojang.com/documents/minecraft_eula',
    minecraftAcceptedEula = false,
    javaHome, javaMaxMem, javaMinMem,
    ipAddress = '127.0.0.1', // or 0.0.0.0 for all interfaces
    ipPort = 3001,
    players, ops, serverProperties,
    startTime = Date.now(),
    osType = os.type();

process.on('exit', function() {
    if (minecraftStarted) {
        stopMinecraft();
    }
});

function bufferMinecraftOutput (d) {
    minecraftOutput.push(d.toString().trim());
}

function startMinecraft (callback) {
    console.log('Starting Minecraft server...');
    
    try {
        fs.accessSync(pathToMinecraftDirectory + '/' + minecraftServerJar, fs.F_OK | fs.R_OK | fs.W_OK);
        // TODO: Make the Java + args configurable
        minecraftServerProcess = spawn('java', [
            '-Xmx1G',
            '-Xms1G',
            '-jar',
            minecraftServerJar,
            'nogui'
        ], {
            cwd: pathToMinecraftDirectory,
            stdio: [
                'pipe', // Use parent's stdin for child
                'pipe', // Pipe child's stdout to parent
                'pipe'  // Direct child's stderr to parent
            ]
        });
    
        if (!minecraftServerOutputCaptured) {
            minecraftStarting = true;
            minecraftServerOutputCaptured = true;
            minecraftOutput.length = 0;
            minecraftServerProcess.stdout.addListener('data', bufferMinecraftOutput);
    
            if (minecraftStartedTimer) {
                clearTimeout(minecraftStartedTimer);
            }
        
            minecraftStartedTimer = setTimeout(() => {
                checkForMinecraftToBeStarted(0, callback);
            }, 100);
        } else if (minecraftStarting && minecraftServerOutputCaptured) {
            clearTimeout(minecraftStartedTimer);
            minecraftStartedTimer = setTimeout(() => {
                checkForMinecraftToBeStarted(0, callback);
            }, 100);
        } else {
            setTimeout(() => {
                startMinecraft(callback)
            }, 1000);
        }
    } catch (e) {
        console.log('Minecraft Server executable not found.');
        callback();
    }
}

function checkForMinecraftToBeStarted (checkCount, callback) {
    let threshold = 1000,
        versionParts = [],
        major, minor, release;

    if (checkCount > threshold) {
        // Pop back out. Minecraft may or may not come up.
        minecraftServerProcess.stdout.removeListener('data', bufferMinecraftOutput);
        minecraftOutput.length = 0;
        minecraftServerOutputCaptured = false;
        console.log('Failed to detect running Minecraft server. Continuing.');
        if (typeof callback === 'function') {
            callback();
        }
    } else {
        while( (line = minecraftOutput.shift()) !== undefined ) {
            if (line.indexOf('eula.txt') !== -1) {
                minecraftServerProcess.stdout.removeListener('data', bufferMinecraftOutput);
                minecraftOutput.length = 0;
                minecraftServerOutputCaptured = false;
                // acceptEula();
                // startMinecraft(callback);
                stopMinecraft(callback);
            } else if (line.toLowerCase().indexOf('failed') !== -1) {
                console.log('An error occurred starting Minecraft. Check the Minecraft log.');
                minecraftServerProcess.stdout.removeListener('data', bufferMinecraftOutput);
                minecraftOutput.length = 0;
                minecraftServerOutputCaptured = false;
                process.exit(1);
            } else if (line.toLowerCase().indexOf('stopping server') !== -1) {
                console.log('An error occurred starting Minecraft. Check the Minecraft log.');
                minecraftServerProcess.stdout.removeListener('data', bufferMinecraftOutput);
                minecraftOutput.length = 0;
                minecraftServerOutputCaptured = false;
                process.exit(1);
            } else if (!minecraftCurrentVersion && line.indexOf('server version') !== -1) {
                versionParts = line.toString().split('.');
                major = versionParts.shift();
                minor = versionParts.shift();
                release = versionParts.shift().trim();
                versionParts = major.split('version ');
                major = versionParts[versionParts.length - 1];
                minecraftCurrentVersion = major + '.' + minor + '.' + release;
                console.log('Detected Minecraft version:', minecraftCurrentVersion);
            } else if (!minecraftStarted && line.indexOf('Done') !== -1) {
                console.log('Minecraft server started.');
                minecraftStarted = true;
                minecraftStartTime = Date.now();
                minecraftServerProcess.stdout.removeListener('data', bufferMinecraftOutput);
                minecraftOutput.length = 0;
                minecraftServerOutputCaptured = false;
                if (typeof callback === 'function') {
                    callback();
                }
            }
        }
    
        if (!minecraftStarted) {
            minecraftStartedTimer = setTimeout(() => {
                checkForMinecraftToBeStarted(++checkCount, callback);
            }, 100);
        }
    }
}

function stopMinecraft (callback) {
    console.log('Stopping Minecraft server.');
    if (minecraftStarted) {
        if (!minecraftServerOutputCaptured) {
            minecraftStopping = true;
            minecraftServerOutputCaptured = true;
            minecraftOutput.length = 0;
            minecraftServerProcess.stdout.addListener('data', bufferMinecraftOutput);

            minecraftServerProcess.stdin.write('/stop\n');

            if (minecraftStoppedTimer) {
                clearTimeout(minecraftStoppedTimer);
            }

            minecraftStoppedTimer = setTimeout(() => {
                checkForMinecraftToBeStopped(0, callback);
            }, 1000);
        } else if (minecraftStopping && minecraftServerOutputCaptured) {
            clearTimeout(minecraftStoppedTimer);
            minecraftStoppedTimer = setTimeout(() => {
                checkForMinecraftToBeStopped(0, callback);
            }, 1000);
        } else {
            setTimeout(() => {
                stopMinecraft(callback);
             }, 100);
        }
    } else {
        callback();
    }
}

function checkForMinecraftToBeStopped (checkCount, callback) {
    let threshold = 1000;

    if (checkCount > threshold) {
        // Pop back out. Minecraft may or may not be stopped.
        minecraftServerProcess.stdout.removeListener('data', bufferMinecraftOutput);
        minecraftServerOutputCaptured = false;
        minecraftServerProcess.kill();
        minecraftOutput.length = 0;
        console.log('Minecraft server had to be forced to stop.');
        if (typeof callback === 'function') {
            callback();
        }
    } else {
        minecraftOutput.forEach((line) => {
            if (line.indexOf('Shutdown Thread') !== -1 && line.indexOf('Saving') !== -1) {
                console.log('Minecraft server stopped.');
                minecraftStarted = false;
                minecraftStartTime = null;
                minecraftServerProcess.stdout.removeListener('data', bufferMinecraftOutput);
                minecraftServerOutputCaptured = false;
                minecraftServerProcess.kill();
                minecraftOutput.length = 0;
                if (typeof callback === 'function') {
                    callback();
                }
            }
        });
    
        if (minecraftStarted) {
            minecraftStoppedTimer = setTimeout(() => {
                checkForMinecraftToBeStopped(++checkCount, callback);
            }, 500);
        }
    }
}

function getMinecraftVersions() {
    // TODO enable snapshot updates with a property/preference
    let minecraftVersionsArray = [],
        minecraftVersions = {};

    https.get('https://launchermeta.mojang.com/mc/game/version_manifest.json', (res) => {
        res.on('data', (d) => {
            minecraftVersionsArray.push(d);
        });
        res.on('end', () => {
            try {
                minecraftVersions = JSON.parse(minecraftVersionsArray);
                console.log('Got Minecraft version list.');
                // TODO Actually do something here
                return minecraftVersions;
            } catch (e) {
                console.log('An error occurred processing the Minecraft official version list:', e);
            }
        });
      }).on('error', (e) => {
        console.error('An error occurred retrieving the Minecraft official version list:', e);
      });
}

function getBannedIps () {
    try {
        return JSON.parse(fs.readFileSync(pathToMinecraftDirectory + '/banned-ips.json', 'utf8'));
    } catch (e) {
        console.log('Failed to read banned-ips.json:', e);
    }
}

function getBannedPlayers () {
    try {
        return JSON.parse(fs.readFileSync(pathToMinecraftDirectory + '/banned-players.json', 'utf8'));
    } catch (e) {
        console.log('Failed to read banned-players.json:', e);
    }
}

function getWhitelist () {
    try {
        return JSON.parse(fs.readFileSync(pathToMinecraftDirectory + '/whitelist.json', 'utf8'));
    } catch (e) {
        console.log('Failed to read whitelist.json:', e);
    }
}

function getOps () {
    try {
        return JSON.parse(fs.readFileSync(pathToMinecraftDirectory + '/ops.json', 'utf8'));
    } catch (e) {
        console.log('Failed to read ops.json:', e);
    }
}

function getUserCache () {
    try {
        return JSON.parse(fs.readFileSync(pathToMinecraftDirectory + '/usercache.json', 'utf8'));
    } catch (e) {
        console.log('Failed to read usercache.json:', e);
    }
}

function getServerProperties () {
    try {
        let properties = fs.readFileSync(pathToMinecraftDirectory + '/server.properties', 'utf8');
        return convertPropertiesToObjects(properties);
    } catch (e) {
        console.log('Failed to read server.properties:', e);
        return e;
    }
}

function getCommand (line, required, optional) {
    let start = 0;
    let end = 0;
    let args = [];
    let startChar, endChar;

    if (required) {
        startChar = '<';
        endChar = '>'
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

    return args
}

function waitForHelpOutput (buffer, callback) {
    while( (line = minecraftOutput.shift()) !== undefined ) {
        if (line.indexOf('Showing help page') !== -1) {
            minecraftServerProcess.stdout.removeListener('data', bufferMinecraftOutput);
            minecraftOutput.length = 0;

            let part1 = line.split('Showing help page ');
            let part2 = part1[1].split(' ');
            minecraftHelpPages = parseInt(part2[2]);

            minecraftServerProcess.stdout.addListener('data', bufferMinecraftOutput);
            for (let i = 1; i <= minecraftHelpPages; i++) {
                minecraftServerProcess.stdin.write('/help ' + i + '\n');
            }
            setTimeout(() => {
                minecraftServerProcess.stdout.removeListener('data', bufferMinecraftOutput);
                while ( (line = minecraftOutput.shift()) !== undefined ) {
                    let command = {};
                    let commandLine = line.split(' [Server thread/INFO]: ');

                    if (commandLine[1].indexOf('/') === 0) {
                        let aThing = {}
                        aThing.key = minecraftFullHelp.length;
                        aThing.command = commandLine[1];
                        minecraftFullHelp.push(aThing);
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
    
                        minecraftCommands.push(command);
                    }
                }

                minecraftOutput.length = 0;
                minecraftServerOutputCaptured = false;
                if (typeof callback === 'function') {
                    callback();
                }
            }, 500);
        }
    }
}

function listMinecraftCommands (checkCount, callback) {
    let threshold = 100;

    if (!checkCount) {
        checkCount = 0;
    }

    if (checkCount < threshold) {
        if (minecraftStarted && !minecraftServerOutputCaptured) {
            let minecraftCommands = [];
            minecraftServerOutputCaptured = true;
            minecraftOutput.length = 0;
            minecraftServerProcess.stdout.addListener('data', bufferMinecraftOutput);
    
            minecraftServerProcess.stdin.write('/help\n');
        
            setTimeout(() => {
                waitForHelpOutput(minecraftOutput, callback);
            }, 100);
        } else {
            setTimeout(() => {
                listMinecraftCommands(++checkCount, callback);
            }, 100);
        }
    } else {
        console.log('Couldn\'t get Minecraft help.');
    }
}

function getEula () {
    let eula, eulaUrlLine, line, lineNumber;

    console.log('Reading eula.txt...');
    try {
        eula = fs.readFileSync(pathToMinecraftDirectory + '/eula.txt', 'utf8').split(/\n/);
        
        for (lineNumber = 0; lineNumber < eula.length; lineNumber++) {
            if (eula[lineNumber]) {
                eulaUrlLine = eula[lineNumber].split('https://');
                if (eulaUrlLine.length == 2) {
                    minecraftEulaUrl = 'https://' + eulaUrlLine[1].substr(0, eulaUrlLine[1].indexOf(')'));
                    console.log('Minecraft EULA: ' + minecraftEulaUrl);
                }
                line = eula[lineNumber].split('=');
                if (line.length == 2) {
                    minecraftAcceptedEula = !!JSON.parse(line[1]);
                    // console.log('EULA accepted?', minecraftAcceptedEula);
                }
            }
        }
    } catch (e) {
        console.log('Failed to read eula.txt:', e);
        throw e;
    }

}

function acceptEula () {
    let eula, line, lineNumber;

    if (minecraftAcceptedEula === 'false' || !minecraftAcceptedEula) {
        console.log('Accepting EULA...');
        try {
            eula = fs.readFileSync(pathToMinecraftDirectory + '/eula.txt', 'utf8').split(/\n/);
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
        fs.writeFile(pathToMinecraftDirectory + '/eula.txt', eula.join('\n'), (err) => {
            if (err) {
                console.log('Failed to write eula.txt:', e);
                throw e
            }
            minecraftAcceptedEula = true;
        });
    }
}

// Convert name=value properties to JSON
function convertPropertiesToObjects (props) {
    let properties = [],
        incomingProperties = props.split(/\n/),
        line, lineNumber, property;

    for (lineNumber = 0; lineNumber < incomingProperties.length; lineNumber++) {
        // Skip blank lines
        if (incomingProperties[lineNumber]) {
            line = incomingProperties[lineNumber].split('=');
            if (line.length == 2) {
                // Got name=value pair
                // TODO: Ignore commented out values: '//' ?
                property = {};
                property.name = line[0];
                property.value = line[1];
                properties.push(property);
            }
        }
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

function backupWorld (worldName) {
    worldName = worldName || 'world';

    let backupDir = pathToMinecraftDirectory + '/worldBackups';
    
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
            startMinecraft(() => {
                console.log('Backup size: ' + archive.pointer() + ' total bytes');
                // console.log('Archive has been finalized and the output file descriptor has closed.');
                console.log('World backed up.');
            });
        });

        if (minecraftStarted) {
            stopMinecraft(() => {
                // zip world dir
                archive.pipe(output);
                archive.directory(pathToMinecraftDirectory + '/' + worldName, false);
                archive.finalize();
            });
        } else {
            // zip world dir
            archive.pipe(output);
            archive.directory(pathToMinecraftDirectory + '/' + worldName, false);
            archive.finalize();
            console.log('World backed up.');
        }
    } catch (e) {
        console.log('Backup directory does not exist, creating.');
        fs.ensureDirSync(backupDir);
        output.close();
    }
}

function listWorldBackups () {
    let backupDir = pathToMinecraftDirectory + '/worldBackups'
        backupList = [],
        files = [],
        readError = {};
    
    files = fs.readdirSync(backupDir);

    files.forEach(file => {
        let fileItem = {},
            fileParts = file.split('.');

        if (fileParts[1] === 'zip') {
            let fileInfo = fileParts[0].split('_');
            fileItem.fileName = file;
            fileItem.worldName = fileInfo[0];
            fileItem.date = fileInfo[1];
            fileItem.time = fileInfo[2];
            backupList.push(fileItem);
        }
    });
    
    return backupList;
}

function deleteWorld (worldName, backupWorld) {
    worldName = worldName || 'world';
    backupWorld = backupWorld || false;
    
    try {
        fs.accessSync(__dirname + '/' + pathToMinecraftDirectory + '/' + worldName,
            fs.F_OK | fs.R_OK | fs.W_OK);

        console.log('path to be deleted: ' + pathToMinecraftDirectory + '/' + worldName);
        fs.removeSync(pathToMinecraftDirectory + '/' + worldName);
        console.log('World deleted.');
    }
    catch (e) {
        console.log('An error occurred accessing world data:', e);
    }
}

// Create an express web app - HTTPS?
let app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Serve web app @ '/'
// TODO Make the path on disk make sense - BUILD PROCESS!
app.use(express.static(path.join(__dirname, 'minecraftservermanager/build')));

app.use(function(request, response, next) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    response.setHeader('Access-Control-Allow-Credentials', true);

    // TODO: Better filtering
    // if (!minecraftStarted && request.query.command !== '/start' && request.query.command !== '/getOps' && request.query.command !== '/getProps' && request.query.command !== '/newWorld') {
        // response.contentType('json');
        // response.json({
        //     response: 'Failed to connect to Minecraft Server'
        // });
    // } else {
        next();
    // }
});

app.get('/api/status', function (request, response) {
    let rightNow = Date.now(),
        uptime = rightNow - startTime,
        mcuptime = minecraftStartTime? rightNow - minecraftStartTime : null;
    
    response.contentType('json');
    response.json({
        minecraftOnline: minecraftStarted,
        minecraftUptime: mcuptime,
        minecraftVersion: minecraftCurrentVersion,
        minecraftAcceptedEula: minecraftAcceptedEula,
        minecraftEulaUrl: minecraftEulaUrl,
        uptime: uptime
    });
});

app.get('/api/properties', function (request, response) {
    let properties = getServerProperties();
    
    response.contentType('json');
    response.json({
        properties: properties
    });
});

app.get('/api/bannedIps', function (request, response) {
    let bannedIps = getBannedIps();
    
    response.contentType('json');
    response.json({
        bannedIps: bannedIps
    });
});

app.get('/api/bannedPlayers', function (request, response) {
    let bannedPlayers = getBannedPlayers();
    
    response.contentType('json');
    response.json({
        bannedPlayers: bannedPlayers
    });
});

app.get('/api/whitelist', function (request, response) {
    let whitelist = getWhitelist();
    
    response.contentType('json');
    response.json({
        whitelist: whitelist
    });
});

app.get('/api/ops', function (request, response) {
    let ops = getOps();
    
    response.contentType('json');
    response.json({
        ops: ops
    });
});

app.get('/api/userCache', function (request, response) {
    let userCache = getUserCache();
    
    response.contentType('json');
    response.json({
        userCache: userCache
    });
});

app.get('/api/listWorldBackups', function (request, response) {
    let backupList = listWorldBackups();
    
    response.contentType('json');
    response.json({
        backupList: backupList
    });
});

app.get('/api/commands', function (request, response) {
    if (minecraftFullHelp) {
        response.contentType('json');
        response.json({
            commands: minecraftFullHelp
        });
    } else {
        response.contentType('json');
        response.json({
            commands: null
        })
    }
});

app.get('/api/command', function (request, response) {
    let command = request.query.command;
    
    if (command === '/list') {
        if (minecraftStarted) {
            // buffer output for a quarter of a second, then reply to HTTP request
            let buffer = [],
                collector = function (data) {
                    data = data.toString();
                    buffer.push(data);
                };

            minecraftServerProcess.stdout.removeListener('data', collector);
            minecraftServerProcess.stdout.on('data', collector);

            try {
                minecraftServerProcess.stdin.write(command + '\n');
            }
            catch (e) {
                debugger;
            }
            finally {
                // Delay for a bit, then send a response with the latest server output
                setTimeout(function () {
                    minecraftServerProcess.stdout.removeListener('data', collector);
                    // respond with the output of the Minecraft server
                    // TODO: Make this update a web element on the page
                    response.contentType('json');
                    response.json({
                        response: buffer.join('')
                    });
                }, 250);
            }

        } else {
            response.contentType('json');
            response.json({
                response: 'Minecraft server not running.'
            });
        }
    }
});

app.post('/api/acceptEula', function(request, response) {    
    acceptEula();
    
    startMinecraft(() => {
        let rightNow = Date.now(),
            uptime = rightNow - startTime,
            mcuptime = minecraftStartTime? rightNow - minecraftStartTime : null;

        listMinecraftCommands(0);

        response.contentType('json');
        response.json({
            minecraftOnline: minecraftStarted,
            minecraftUptime: mcuptime,
            minecraftVersion: minecraftCurrentVersion,
            minecraftAcceptedEula: minecraftAcceptedEula,
            minecraftEulaUrl: minecraftEulaUrl,
            uptime: uptime
        });
    });
});

// Handle Minecraft Server Command requests
app.post('/api/command', function(request, response) {
    // TODO: Cancel processing if the message was not sent by an admin/allowed address
    // if (request.param('From') !==  ADMIN ){
    //     response.status(403).send('you are not an admin :(');
    //     return;
    // }
    let command = request.query,
        worldName, backupToo;

    if (command.command) {
        command = command.command;

        // TODO: Some commands should only be available to app admins, some only to ops, etc.etc.
        // TODO: This means we need a permissions model
        //     linked between this server and the webapp making these requests - oof.

        if (command === '/start') {
            if (!minecraftStarted) {
                startMinecraft(() => {
                    response.contentType('json');
                    response.json({
                        minecraftOnline: true
                    });
                });
            } else {
                response.contentType('json');
                response.json({
                    response: 'Server already running.'
                });
            }
        } else if (command === '/stop') {
            stopMinecraft(() => {
                response.contentType('json');
                response.json({
                    minecraftOnline: false
                });
            });
        } else if (command === '/backupWorld') {
            worldName = request.query.worldName || 'world';
            
            backupWorld(worldName);
            response.contentType('json');
            response.json({
                response: 'World backup complete.'
            });
        } else if (command === '/newWorld') {
            console.log('Gonna nuke the planet. Literally.');
            worldName = request.query.worldName || 'world';
            backupToo = request.query.backup || false;
            if (minecraftStarted) {
                stopMinecraft(() => {
                    deleteWorld(worldName, backupToo);
                    startMinecraft(() => {
                        // Starting Minecraft will create a new world by default, so respond to the command accordingly
                        response.contentType('json');
                        response.json({
                            response: 'New world created.'
                        });
                    });
                });
            } else {
                deleteWorld(worldName, backupToo);

                response.contentType('json');
                response.json({
                    response: 'New world will be created at startup.'
                });
            }
        } else if (command === '/restoreWorld') {
            console.log('Gonna restore a world now.');
            // worldName = request.query.worldName || 'world';
            // backupName = request.query.backupFile;
            // backupToo = request.query.backup || false;
            // if (minecraftStarted) {
            //     stopMinecraft(() => {
            //         deleteWorld(worldName, backupToo);
            //         restoreWorld(backupName); // TODO handle world renames too!
            //         startMinecraft(() => {
            //             response.contentType('json');
            //             response.json({
            //                 response: 'World restored.'
            //             });
            //         });
            //     });
            // } else {
            //     deleteWorld(worldName, backupToo);
            //     restoreWorld(backupName); // TODO handle world renames too!
            //     response.contentType('json');
            //     response.json({
            //         response: 'New world will be created at startup.'
            //     });
            // }
            response.contentType('json');
            response.json({
                response: 'World restored.'
            });
        } else {
            if (minecraftStarted) {
                // buffer output for a quarter of a second, then reply to HTTP request
                let buffer = [],
                    collector = function (data) {
                        data = data.toString();
                        buffer.push(data);
                    };
    
                minecraftServerProcess.stdout.removeListener('data', collector);
                minecraftServerProcess.stdout.on('data', collector);
                minecraftServerProcess.stdin.write(command + '\n');
    
                // Delay for a bit, then send a response with the latest server output
                setTimeout(function () {
                    minecraftServerProcess.stdout.removeListener('data', collector);
                    // respond with the output of the Minecraft server
                    // TODO: Make this update a web element on the page
                    response.contentType('json');
                    response.json({
                        response: buffer.join('')
                    });
                }, 250);
            } else {
                response.contentType('json');
                response.json({
                    response: 'Minecraft server not running.'
                });
            }
        }
    } else {
        console.log('Got command with nothing to do.');
        response.contentType('json');
        response.json({
            response: 'Invalid command'
        });
    }
});

if (osType.indexOf('Windows') !== -1) {
    // do Windows related things
    // set javaHome from Windows? LOTS OF POTENTIAL PLACES
} else if (osType.indexOf('Linux') !== -1) {
    // do Linux related things
    // set javaHome from profile? bash_profile? bash_rc? TOO MANY PLACES
} else if (osType.indexOf('Darwin') !== -1) {
    // do Mac related things
    // set javaHome from java_home
    exec('/usr/libexec/java_home', (err, stdout, stderr) => {
        if (err) {
            console.log('Could not set JAVA_HOME. Make sure Java is properly installed.');
            throw err;
        } else {
            // console.log('Using java from', stdout);
            javaHome = stdout;
            app.listen(ipPort);
            console.log('Web app running.');
            getMinecraftVersions();
            startMinecraft(() => {
                getEula();
                listMinecraftCommands(0);
            });
        }
    });
}

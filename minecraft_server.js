const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const os = require('os');
const https = require('https');

let pathToMinecraftDirectory = 'minecraft_server',
    minecraftServerJar = 'minecraft_server.jar',
    minecraftServerProcess,
    minecraftServerLog = 'minecraft_server.log',
    minecraftStarted, minecraftStartedTimer, minecraftStartTime,
    minecraftStoppedTimer,
    minecraftOutput = [],
    minecraftCurrentVersion,
    javaHome, javaMaxMem, javaMinMem,
    ipAddress = '127.0.0.1',
    ipPort = '3001',
    players, ops, serverProperties,
    startTime = Date.now(),
    osType = os.type();

// Make sure the Minecraft server quits with this process
process.on('exit', function() {
    stopMinecraft();
});

function startMinecraft (callback) {
    console.log('Starting Minecraft server...');
    // TODO: Make the Java + args configurable
    minecraftServerProcess = spawn('java', [
        '-Xmx1G',
        '-Xms1G',
        '-jar',
        minecraftServerJar,
        'nogui'
    ], {
        cwd: pathToMinecraftDirectory
    });

    minecraftServerProcess.stdout.on('data', (d) => {
        // buffer while we wait for 'started'
        minecraftOutput.push(d);
    });

    if (minecraftStartedTimer) {
        clearTimeout(minecraftStartedTimer);
    }

    minecraftStartedTimer = setTimeout(() => {
        checkForMinecraftToBeStarted(minecraftOutput, 0, callback);
    }, 1000);
}

function checkForMinecraftToBeStarted (buffer, checkCount, callback) {
    let threshold = 240,
        versionParts = [],
        major, minor, release;

    if (checkCount > threshold) {
        // Pop back out. Minecraft may or may not come up.
        callback();
    } else {
        buffer.join('');
        buffer.forEach((line) => {
            // TODO get minecraft version here too?
            if (line.toString().indexOf('server version') !== -1) {
                versionParts = line.toString().split('.');
                major = versionParts.shift();
                minor = versionParts.shift();
                release = versionParts.shift().trim();
                versionParts = major.split('version ');
                major = versionParts[versionParts.length - 1];
                minecraftCurrentVersion = major + '.' + minor + '.' + release;
                console.log('Detected Minecraft version:', minecraftCurrentVersion);
            } else if (line.toString().indexOf('Done') !== -1) {
                console.log('Minecraft server started.');
                minecraftStarted = true;
                minecraftStartTime = Date.now();
                minecraftServerProcess.stdout.on('data', (d) => {
                    // noop
                });
                callback();
            }
        });
    
        buffer.length = 0;
    
        if (!minecraftStarted) {
            minecraftStartedTimer = setTimeout(() => {
                checkForMinecraftToBeStarted(minecraftOutput, ++checkCount, callback);
            }, 500);
        }
    }
}

function stopMinecraft (callback) {
    console.log('Stopping Minecraft server.');
    if (minecraftServerProcess) {
        minecraftOutput.length = 0;
        minecraftServerProcess.stdout.on('data', (d) => {
            // buffer while we wait for 'stopped'
            minecraftOutput.push(d);
        });

        minecraftServerProcess.stdin.write('/stop\n');

        if (minecraftStoppedTimer) {
            clearTimeout(minecraftStoppedTimer);
        }

        minecraftStoppedTimer = setTimeout(() => {
            checkForMinecraftToBeStopped(minecraftOutput, 0, callback);
        }, 1000);
    }
}

function checkForMinecraftToBeStopped (buffer, checkCount, callback) {
    let threshold = 240;

    if (checkCount > threshold) {
        // Pop back out. Minecraft may or may not be stopped.
        console.log('Minecraft server may not have stopped.');
        callback();
    } else {
        buffer.join('');
        buffer.forEach((line) => {
            // TODO get minecraft version here too?
            if (line.indexOf('Shutdown Thread') !== -1 && line.indexOf('Saving') !== -1) {
                console.log('Minecraft server stopped.');
                minecraftStarted = false;
                minecraftStartTime = null;
                minecraftServerProcess.stdout.on('data', (d) => {
                    // noop
                });
                minecraftServerProcess.kill();
                buffer.length = 0;
                callback();
            }
        });
    
        if (minecraftStarted) {
            minecraftStoppedTimer = setTimeout(() => {
                checkForMinecraftToBeStopped(minecraftOutput, ++checkCount, callback);
            }, 500);
        }
    }
}

function getMinecraftVersions() {
    // TODO enable snapshot updates?
    let minecraftVersionsArray = [],
        minecraftVersions = {};

    https.get('https://launchermeta.mojang.com/mc/game/version_manifest.json', (res) => {
        res.on('data', (d) => {
            minecraftVersionsArray.push(d);
        });
        res.on('end', () => {
            minecraftVersions = JSON.parse(minecraftVersionsArray);
            console.log('Got Minecraft version list.');
        });
      }).on('error', (e) => {
        console.error(e);
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
                // console.log('property found:', property);
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

// Create an express web app
let app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Serve web app
app.use(express.static(path.join(__dirname, 'web/minecraftservermanager/build')));

app.use(function(request, response, next) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    response.setHeader('Access-Control-Allow-Credentials', true);

    if (!minecraftStarted && request.query.command !== '/start' && request.query.command !== '/getOps' && request.query.command !== '/getProps' && request.query.command !== '/newWorld') {
        response.contentType('json');
        response.json({
            response: 'Failed to connect to Minecraft Server'
        });
    } else {
        next();
    }
});

app.get('/api/status', function (request, response) {
    let rightNow = Date.now(),
        uptime = rightNow - startTime,
        mcuptime = minecraftStartTime? rightNow - minecraftStartTime : null;
    
    if (minecraftStarted) {
        response.contentType('json');
        response.json({
            uptime: uptime,
            minecraftOnline: true,
            minecraftUptime: mcuptime,
            minecraftVersion: minecraftCurrentVersion
        });
    } else {
        response.contentType('json');
        response.json({
            uptime: uptime,
            minecraftOnline: false
        });
    }
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
});

// Handle Minecraft Server Command requests
app.post('/api/command', function(request, response) {
    // TODO: Cancel processing if the message was not sent by an admin/allowed address
    // if (request.param('From') !==  ADMIN ){
    //     response.status(403).send('you are not an admin :(');
    //     return;
    // }
    let command = request.query,
        ops, props, worldName, backupWorld;

    if (command.command) {
        command = command.command;

        // TODO: Some commands should only be available to app admins, some only to ops, etc.etc.
        // TODO: This means we need a permissions model
        //     linked between this server and the webapp making these requests - oof.

        if (command === '/getOps') {
            ops = getOps();

            response.contentType('json');
            response.json({
                response: ops
            });
        } else if (command === '/getProps') {
            props = getServerProperties();

            response.contentType('json');
            response.json({
                response: props
            });
        } else if (command === '/start') {
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
                    response: 'Server already running'
                });
            }
        } else if (command === '/stop') {
            stopMinecraft(() => {
                response.contentType('json');
                response.json({
                    minecraftOnline: false
                });
            });
        } else if (command === '/newWorld') {
            console.log('Gonna nuke the planet. Literally.');
            worldName = request.query.worldName || 'world';
            backupWorld = request.query.backup || false;
            console.log('path to be deleted: ', __dirname + '/' + pathToMinecraftDirectory + '/' + worldName);
            if (!minecraftStarted) {
                stopMinecraft(() => {
                    console.log('Stopped Minecraft server.');
                });
            }
            // This try/catch may need to move into the ^^ callback passed to stopMinecraft
            try {
                // see if dir exists
                fs.access(__dirname + '/' + pathToMinecraftDirectory + '/' + worldName,
                    fs.F_OK | fs.R_OK | fs.W_OK,
                    function (err) {
                        if (!err) {
                            if (backupWorld) {
                                // TODO: back it up
                            }
                            fs.rmdirSync(pathToMinecraftDirectory + '/' + worldName);

                            startMinecraft(() => {
                                // Starting Minecraft will create a new world by default, so respond to the command accordingly
                                response.contentType('json');
                                response.json({
                                    response: 'New world created'
                                });
                            });
                        } else {
                            console.log('An error occurred deleteing the existing world', err);
                        }
                    }
                );
            }
            catch (e) {
                console.log('An error occurred accessing the world data:', e);
            }
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
    // set javaHome from Windows
} else if (osType.indexOf('Linux') !== -1) {
    // do Linux related things
    // set javaHome from profile?
} else if (osType.indexOf('Darwin') !== -1) {
    // do Mac related things
    // set javaHome from java_home
    exec('/usr/libexec/java_home', (err, stdout, stderr) => {
        if (err) {
            console.log('Could not set JAVA_HOME. Make sure Java is installed.');
            return;
        } else {
            // console.log('Using java from', stdout);
            javaHome = stdout;
            startMinecraft(() => {
                getMinecraftVersions();
                console.log('Starting web app.');
                app.listen(ipPort);
                console.log('Web app running.');
            });
        }
    });
}

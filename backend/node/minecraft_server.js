var ipAddress = '127.0.0.1';
var ipPort = '3000';

var bodyParser = require('body-parser');
var express = require('express');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var pathToMinecraftDirectory = '../minecraft_server',
    minecraftServerJar = 'minecraft_server.jar',
    minecraftServerProcess,
    minecraftServerLog = 'minecraft_server.log',
    webServerAddress = 'localhost',
    webServerPort = '1841';

// Make sure the Minecraft server quits with this process
process.on('exit', function() {
    stopMinecraft();
});

// TODO: add minecraft_server_VERSION.jar detection

// TODO: Make the Java args configurable
function startMinecraft() {
    console.log('trying to start minecraft');
    minecraftServerProcess = spawn('java', [
        '-Xmx1G',
        '-Xms512M',
        '-jar',
        minecraftServerJar,
        'nogui'
    ], {
        cwd: pathToMinecraftDirectory
    });
    console.log('Minecraft server started');
}

function stopMinecraft() {
    minecraftServerProcess.kill();
}

function getOps () {
    var ops;
    try {
        ops = JSON.parse(fs.readFileSync(pathToMinecraftDirectory + '/ops.json', 'utf8'));
        return ops;
    } catch (e) {
        console.log('Failed to read ops.json:', e);
    }
}

function getServerProperties () {
    var props;
    try {
        props = fs.readFile(pathToMinecraftDirectory + '/server.properties', 'utf8', function (err, data) {
            if (!err) {
                return convertPropsToObject(data);
            } else {
                return err;
            }
        });
    } catch (e) {
        console.log('Failed to read server.properties:', e);
    }
}

// Convert name=value properties to JSON
function convertPropsToObject(props) {
    var properties = [],
        incomingProps = props.split(/\n/),
        line, lineNumber, property;

    for (lineNumber = 0; lineNumber < incomingProps.length; lineNumber++) {
        // Skip blank lines
        if (incomingProps[lineNumber]) {
            line = incomingProps[lineNumber].split('=');
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

// Start Minecraft Server
startMinecraft();

// Create an express web app
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(request, response, next) {
    var theDate = new Date();
    theDate = ('0' + theDate.getHours()).slice(-2) + ':'
        + ('0' + (theDate.getMinutes()+1)).slice(-2) + ':'
        + ('0' + (theDate.getSeconds())).slice(-2);

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    response.setHeader('Access-Control-Allow-Credentials', true);

    if (minecraftServerProcess.killed && request.query.command !== '/start' && request.query.command !== '/getOps' && request.query.command !== '/getProps' && request.query.command !== '/getStatus' && request.query.command !== '/newWorld') {

        response.contentType('json');
        response.json({
            response: 'Failed to connect to Minecraft Server'
        });
        console.log('[' + theDate + '] [Server thread/INFO]: Failed to get status for request', request.query.command);
    } else {
        next();
    }
});

// Simple landing page
app.get('/', function(request, response) {
    // Delay for a bit, then send a response
    setTimeout(function() {
        // TODO: Set appropriate version/status
        response.type('text/plain');
        response.send('{"version": "0.11.2", "status": "online"}\n');
    }, 250);
});

// Handle Minecraft Server Command requests
app.post('/command', function(request, response) {
    // Cancel processing if the message was not sent by an admin/allowed address
    // TODO: Make this use server admins
    // if (request.param('From') !==  ADMIN ){
    //     response.status(403).send('you are not an admin :(');
    //     return;
    // }

    var command = request.query,
        theDate = new Date(),
        ops, props, worldName, backupWorld;

    theDate = ('0' + theDate.getHours()).slice(-2) + ':'
        + ('0' + (theDate.getMinutes()+1)).slice(-2) + ':'
        + ('0' + (theDate.getSeconds())).slice(-2);
    
    console.log('Created date of"', theDate, '"');

    if (command.command) {
        command = command.command;

        // TODO: Some commands will be available to app admins, some only to ops, etc.etc.
        // TODO: This means we need a permissions model
        //     linked between this server and the webapp making these requests - oof.

        if (command === '/getOps') {
            try {
                ops = getOps();

                response.contentType('json');
                response.json({
                    response: ops
                });
                console.log('[' + theDate + '] [Server thread/INFO]: Got ops');
            }
            catch (e) {
                console.log('[' + theDate + '] [Server thread/INFO]: Failed to get ops:', e);
            }
        } else if (command === '/getProps') {
            try {
                props = getServerProperties();

                response.contentType('json');
                response.json({
                    response: props
                });
                console.log('[' + theDate + '] [Server thread/INFO]: Got properties');
            }
            catch (e) {
                console.log('[' + theDate + '] [Server thread/INFO]: Failed to get properties:', e);
            }
        } else if (command === '/getStatus') {
            if (!minecraftServerProcess.killed) {
                response.contentType('json');
                response.json({
                    response: true
                });
                console.log('[' + theDate + '] [Server thread/INFO]: Got status');
            } else {
                response.contentType('json');
                response.json({
                    response: false
                });
                console.log('[' + theDate + '] [Server thread/INFO]: Failed to get status');
            }
        } else if (command === '/start') {
            // start minecraft if not already running (we don't want a rash of port conflicts, now do we?)
            if (minecraftServerProcess.killed) {
                startMinecraft();
                response.contentType('json');
                response.json({
                    response: 'Server started'
                });
                console.log('[' + theDate + '] [Server thread/INFO]: Started Minecraft server');
            } else {
                response.contentType('json');
                response.json({
                    response: 'Server already running'
                });
                console.log('[' + theDate + '] [Server thread/INFO]: Minecraft server already running');
            }
        } else if (command === '/stop') {
            stopMinecraft();
            response.contentType('json');
            response.json({
                response: 'Server stopped'
            });
            console.log('[' + theDate + '] [Server thread/INFO]: Stopped Minecraft server');
        } else if (command === '/newWorld') {
            console.log('Gonna nuke the planet. Literally.');
            worldName = request.query.worldName || 'world';
            backupWorld = request.query.backup || false;
            console.log('path to be deleted: ', __dirname + '/' + pathToMinecraftDirectory + '/' + worldName);
            if (!minecraftServerProcess.killed) {
                stopMinecraft();
                console.log('[' + theDate + '] [Server thread/INFO]: Stopped Minecraft server');
                // TODO: need to wait for async kill to finish before moving on, really.
            }
            if (backupWorld) {
                // TODO: back it up
            }

            try {
                // see if dir exists
                fs.access(__dirname + '/' + pathToMinecraftDirectory + '/' + worldName,
                    fs.F_OK | fs.R_OK | fs.W_OK,
                    function (err) {
                        if (!err) {
                            fs.rmdirSync(pathToMinecraftDirectory + '/' + worldName);

                            startMinecraft();
                            // Starting Minecraft will create a new world by default, so respond to the command accordingly
                            response.contentType('json');
                            response.json({
                                response: 'New world created'
                            });
                            console.log('[' + theDate + '] [Server thread/INFO]: New world created');
                        } else {
                            console.log('An error occurred deleteing the existing world', err);
                        }
                    }
                );
            }
            catch (e) {
                //
            }
        } else {
            // buffer output for a quarter of a second, then reply to HTTP request
            var buffer = [];
            var collector = function (data) {
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
        }
    } else {
        console.log('Got command with nothing to do.');
        response.contentType('json');
        response.json({
            response: 'Invalid command'
        });
    }
});

app.listen(ipPort);


// Your server's public IP address
// TODO: Make the address configurable
var IP_ADDRESS = '127.0.0.1';

var bodyParser = require('body-parser');
var express = require('express');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var lastCommand = '',
    lastOutput = '',
    pathToMinecraftDirectory = '../minecraft_server',
    minecraftServerJar = 'minecraft_server.1.10.2.jar',
    minecraftServerProcess,
    webServerAddress = 'localhost',
    webServerPort = '1841';

// Log process output to stdout
function log(data) {
    process.stdout.write(data.toString());
}

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

    minecraftServerProcess.stdout.on('data', log);
    minecraftServerProcess.stderr.on('data', log);
    console.log('minecraft server started');
}

function stopMinecraft() {
    minecraftServerProcess.kill();
}

// Convert name=value properties to JSON
function jsonifyProps(props) {
    var properties = [],
        incomingProps = props.split(/\n/),
        line, lineNumber, property;
    // ignore items that don't have name=value
    for (lineNumber = 0; lineNumber < incomingProps.length; lineNumber++) {
        if (incomingProps[lineNumber]) {
            line = incomingProps[lineNumber].split('=');
            if (line.length == 2) {
                // got name=value pair
                // TODO: Ignore commented out values: '//' ?
                property = {};
                property.name = line[0];
                property.value= line[1];
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
        lastOutput = lastOutput + '{\n' +
            '    response: Failed to get status for request', request.query.command + '\n' +
            '}';
        console.log('[' + theDate + '] [Server thread/INFO]: Failed to get status for request', request.query.command);
    } else {
        next();
    }
});

// Simple 'show me what just happened' landing page
app.get('/', function(request, response) {
    // Delay for a bit, then send a response with the latest server output
    setTimeout(function() {
        response.type('text/plain');
        response.send('Last command was:\n' +
            '    ' + lastCommand + '\n' +
            'with output of:\n' +
            '    ' + lastOutput + '\n');
    }, 250);
});

// Handle Minecraft Server Command requests
app.post('/command', function(request, response) {
    // Cancel processing if the message was not sent by an admin
    // TODO: Make this use server admins
    // if (request.param('From') !==  ADMIN_PHONE ){
    //     response.status(403).send('you are not an admin :(');
    //     return;
    // }

    var command = request.query,
        theDate = new Date(),
        ops, props, worldName;

    theDate = ('0' + theDate.getHours()).slice(-2) + ':'
        + ('0' + (theDate.getMinutes()+1)).slice(-2) + ':'
        + ('0' + (theDate.getSeconds())).slice(-2);

    // if (minecraftServerProcess.killed && request.query.command !== '/start' && request.query.command !== '/getOps' && request.query.command !== '/getProps' && request.query.command !== '/getStatus' && request.query.command !== '/newWorld') {
    //     response.contentType('json');
    //     response.json({
    //         response: 'Failed to connect to Minecraft Server'
    //     });
    //     lastOutput = lastOutput + '{\n' +
    //         '    response: Failed to connect to Minecraft Server\n' +
    //         '}';
    //     console.log('[' + theDate + '] [Server thread/INFO]: Failed to connect to Minecraft Server');
    //     return;
    // }

    if (command.command) {
        lastCommand = command = command.command;
        lastOutput = '';

        // TODO: Have our own custom commands (showOps, serverProps, resetAndNuke, etc).
        // TODO: Some commands will be available to app admins, some only to ops, etc.etc.
        // TODO: This means we need a permissions model, oof.

        if (command === '/getOps') {
            try {
                // TODO ignore commented out folks: '//'
                ops = JSON.parse(fs.readFileSync(pathToMinecraftDirectory + '/ops.json', 'utf8'));
                response.contentType('json');
                response.json({
                    response: ops
                });
                lastOutput = lastOutput + ops;
                console.log('[' + theDate + '] [Server thread/INFO]: Got ops');
            }
            catch (e) {
                console.log('[' + theDate + '] [Server thread/INFO]: Failed to get ops:', e);
            }
        } else if (command === '/getProps') {
            try {
                props = fs.readFileSync(pathToMinecraftDirectory + '/server.properties', 'utf8');
                props = JSON.parse(JSON.stringify(jsonifyProps(props)));
                response.contentType('json');
                response.json({
                    response: props
                });
                lastOutput = lastOutput + props;
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
                lastOutput = lastOutput + '{ \n' +
                    '    response: true\n' +
                    '}';
                console.log('[' + theDate + '] [Server thread/INFO]: Got status');
            } else {
                response.contentType('json');
                response.json({
                    response: false
                });
                lastOutput = lastOutput + '{\n' +
                    '    response: false\n' +
                    '}';
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
                lastOutput = lastOutput + '{\n' +
                    '    response: Server started\n' +
                    '}';
                console.log('[' + theDate + '] [Server thread/INFO]: Started Minecraft server');
            } else {
                response.contentType('json');
                response.json({
                    response: 'Server already running'
                });
                lastOutput = lastOutput + '{\n' +
                    '    response: Server already running\n' +
                    '}';
                console.log('[' + theDate + '] [Server thread/INFO]: Minecraft server already running');
            }
        } else if (command === '/stop') {
            stopMinecraft();
            response.contentType('json');
            response.json({
                response: 'Server stopped'
            });
            lastOutput = lastOutput + '{\n' +
                '    response: Server stopped\n' +
                '}';
            console.log('[' + theDate + '] [Server thread/INFO]: Stopped Minecraft server');
        } else if (command === '/newWorld') {
            console.log('Gonna nuke the planet. Literally.');
            console.log('request.query:', request.query);
            worldName = request.query.worldName || 'world';
            console.log('path to be deleted: ', __dirname + '/' + pathToMinecraftDirectory + '/' + worldName);
            if (!minecraftServerProcess.killed) {
                stopMinecraft();
                console.log('[' + theDate + '] [Server thread/INFO]: Stopped Minecraft server');
                // TODO: need to wait for async kill to finish before moving on, really.
            }
            if (command.backup) {
                // TODO: back it up?
            }

            try {
                // see if dir exists
                fs.access(__dirname + '/' + pathToMinecraftDirectory + '/' + worldName,
                    fs.F_OK | fs.R_OK | fs.W_OK,
                    function (err) {
                        if (!err) {
                            // del the sucker all destructive-like
                            fs.rmdirSync(pathToMinecraftDirectory + '/' + worldName);
                        }
                    }
                );
            }
            catch (e) {
                //
            }
            startMinecraft();

            response.contentType('json');
            response.json({
                response: 'New world created'
            });
            lastOutput = lastOutput + '{\n' +
                '    response: New world created\n' +
                '}';
            console.log('[' + theDate + '] [Server thread/INFO]: New world created');
        } else {
            // buffer output for a quarter of a second, then reply to HTTP request
            var buffer = [];
            var collector = function (data) {
                data = data.toString();
                // Split to omit timestamp and junk from Minecraft server output
                // buffer.push(data.split(']: ')[1]);
                buffer.push(data);
            };
            minecraftServerProcess.stdout.removeListener('data', collector);
            minecraftServerProcess.stdout.on('data', collector);
            minecraftServerProcess.stdin.write(command + '\n');

            // Delay for a bit, then send a response with the latest server output
            setTimeout(function () {
                minecraftServerProcess.stdout.removeListener('data', collector);

                // create a TwiML response with the output of the Minecraft server
                // TODO: Make this update a web element on the page instead of twilio
                // var twiml = new twilio.TwimlResponse();
                // twiml.message(buffer.join(''));
                //
                //response.type('text/xml');
                response.contentType('json');
                response.json({
                    response: buffer.join('')
                });
                lastOutput = lastOutput + buffer.join('');
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

// Listen for incoming HTTP requests on port 3000
// TODO: Make the listen port configurable
app.listen(3000);

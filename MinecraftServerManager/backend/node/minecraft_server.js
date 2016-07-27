
// Your server's public IP address
// TODO: Make the address configurable
var IP_ADDRESS = '127.0.0.1';

var bodyParser = require('body-parser');
var express = require('express');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var lastCommand = '',
    lastOutput = '';

// Our Minecraft multiplayer server process
// TODO: Make the Java args configurable
// TODO: Make the path to the minecraft_server.jar configurable (cwd)
var minecraftServerProcess = spawn('java', [
    '-Xmx1G',
    '-Xms512M',
    '-jar',
    'minecraft_server.jar',
    'nogui'
], {
    cwd: '../minecraft_server'
});

// Log process output to stdout
function log(data) {
    process.stdout.write(data.toString());
}
minecraftServerProcess.stdout.on('data', log);
minecraftServerProcess.stderr.on('data', log);

// Make sure the Minecraft server quits with this process
process.on('exit', function() {
    minecraftServerProcess.kill();
});

// Convert name=value properties to JSON
function jsonifyProps(props) {
    var properties = [],
        incomingProps = props.split(/\n/),
        line, lineNumber, property;
    // ignore items that don't have name=value
    for (lineNumber = 0; lineNumber < incomingProps.length; lineNumber++) {
        // console.log('jsonifyProps: incomingProps line[' + lineNumber + ']:', incomingProps[lineNumber]);
        if (incomingProps[lineNumber]) {
            line = incomingProps[lineNumber].split('=');
            // console.log('jsonifyProps: line:', line);
            if (line.length == 2) {
                // got name=value pair
                // TODO: Ignore commented out values: '//'
                property = {};
                property.name = line[0];
                property.value= line[1];
                properties.push(property);
            }
        }
    }
    // console.log('jsonifyProps: properties:', properties);
    return properties;
}

// Create an express web app
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:1841');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
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

    // Get the issued command and send it to the Minecraft server
    var command = request.query,
        theDate = new Date(),
        ops, props;

    if (command.command) {
        lastCommand = command = command.command;
        lastOutput = '';

        // TODO: Have our own custom commands (showOps, serverProps, resetAndNuke, etc).
        // TODO: Some commands will be available to app admins, some only to ops, etc.etc.
        // TODO: This means we need a permissions model, oof.

        if (command === '/getOps') {
            try {
                // read in and return ops.json
                // ../minecraft_server -> path from minecraftServerProcess above
                ops = JSON.parse(fs.readFileSync('../minecraft_server/ops.json', 'utf8'));
                response.contentType('json');
                response.json({
                    response: ops
                });
                lastOutput = lastOutput + ops;
                console.log('[' + theDate.getHours() + ':' + theDate.getMinutes() + ':' + theDate.getSeconds() + '] [Server thread/INFO]: Got ops');
            }
            catch (e) {
                console.log('[' + theDate.getHours() + ':' + theDate.getMinutes() + ':' + theDate.getSeconds() + '] [Server thread/INFO]: Failed to get ops:', e);
            }
        } else if (command === '/getProps') {
            try {
                // read in and return server.properties as JSON
                // ../minecraft_server -> path from minecraftServerProcess above
                props = fs.readFileSync('../minecraft_server/server.properties', 'utf8');
                props = JSON.parse(JSON.stringify(jsonifyProps(props)));
                response.contentType('json');
                response.json({
                    response: props
                });
                lastOutput = lastOutput + props;
                console.log('[' + theDate.getHours() + ':' + theDate.getMinutes() + ':' + theDate.getSeconds() + '] [Server thread/INFO]: Got properties');
            }
            catch (e) {
                console.log('[' + theDate.getHours() + ':' + theDate.getMinutes() + ':' + theDate.getSeconds() + '] [Server thread/INFO]: Failed to get properties:', e);
            }
        } else if (command === '/getStatus') {
            if (minecraftServerProcess) {
                response.contentType('json');
                response.json({
                    response: true
                });
                lastOutput = lastOutput + '{ ' +
                    '    response: true' +
                    '}';
                console.log('[' + theDate.getHours() + ':' + theDate.getMinutes() + ':' + theDate.getSeconds() + '] [Server thread/INFO]: Got status');
            } else {
                response.contentType('json');
                response.json({
                    response: false
                });
                lastOutput = lastOutput + '{' +
                    '    response: false' +
                    '}';
                console.log('[' + theDate.getHours() + ':' + theDate.getMinutes() + ':' + theDate.getSeconds() + '] [Server thread/INFO]: Failed to get status');
            }
        } else if (command === '/start') {
            console.log('Gonna start Minecraft now.');
            // start minecraft if not already running (we don't want a rash or port conflicts, now do we?
            // see getOps above
            console.log('[' + theDate.getHours() + ':' + theDate.getMinutes() + ':' + theDate.getSeconds() + '] [Server thread/INFO]: Started Minecraft server');
        } else if (command === '/stop') {
            console.log('Gonna stop Minecraft now.');
            // stop minecraft server - rework how it's tied to this process
            console.log('[' + theDate.getHours() + ':' + theDate.getMinutes() + ':' + theDate.getSeconds() + '] [Server thread/INFO]: Stopped Minecraft server');
        } else if (command === '/nukeTheWorld') {
            console.log('Gonna nuke the planet. Literally.');
            // stop minecraft server - rework how it's tied to this process
            // get server.properties
            // find world name -> 'level-name' from server.properties
            // optional: back it up?
            // rm world name directory
            // start minecraft
            // see getProps command above
            console.log('[' + theDate.getHours() + ':' + theDate.getMinutes() + ':' + theDate.getSeconds() + '] [Server thread/INFO]: Nuked Minecraft server');
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


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
// TODO: Make the path to the minecraft_server.jar configurable
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
minecraftServerProcess.on('exit', function() {
    process.exit();
});
process.on('exit', function() {
    minecraftServerProcess.kill();
});

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
        ops;

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
        } else if (command === '/getStatus') {
            if (minecraftServerProcess) {
                response.contentType('json');
                response.json({
                    response: true
                });
                lastOutput = lastOutput + '{ response: true }';
                console.log('[' + theDate.getHours() + ':' + theDate.getMinutes() + ':' + theDate.getSeconds() + '] [Server thread/INFO]: Got status');
            } else {
                response.contentType('json');
                response.json({
                    response: false
                });
                lastOutput = lastOutput + '{ response: false }';
                console.log('[' + theDate.getHours() + ':' + theDate.getMinutes() + ':' + theDate.getSeconds() + '] [Server thread/INFO]: Failed to get status');
            }
        } else {
            // minecraftServerProcess.stdout.removeListener('data', collector);
            minecraftServerProcess.stdin.write(command + '\n');

            // buffer output for a quarter of a second, then reply to HTTP request
            var buffer = [];
            var collector = function (data) {
                data = data.toString();
                // Split to omit timestamp and junk from Minecraft server output
                // buffer.push(data.split(']: ')[1]);
                buffer.push(data);
            };

            minecraftServerProcess.stdout.on('data', collector);

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
        //response.type('text/xml');
        response.contentType('json');
        response.json({
            response: 'Invalid command'
        });
    }
});

// Listen for incoming HTTP requests on port 3000
// TODO: Make the listen port configurable
app.listen(3000);

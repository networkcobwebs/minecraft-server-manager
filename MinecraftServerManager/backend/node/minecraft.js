// CONFIGURE THESE VALUES FIRST
// ----------------------------

// Your server's public IP address
// TODO: Make the address configurable
var IP_ADDRESS = '127.0.0.1';

var spawn = require('child_process').spawn;
var express = require('express');
var bodyParser = require('body-parser');

// Our Minecraft multiplayer server process
// TODO: Make the Java args configurable
// TODO: Make the path to the minecraft_server.jar configurable
var minecraftServerProcess = spawn('java', [
    '-Xmx1G',
    '-Xms256M',
    '-jar',
    'minecraft_server.jar',
    'nogui'
]);

// Log server output to stdout
function log(data) {
    process.stdout.write(data.toString());
}
minecraftServerProcess.stdout.on('data', log);
minecraftServerProcess.stderr.on('data', log);

// Create an express web app
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Handle Admin Command requests
app.post('/command', function(request, response) {
    // Cancel processing if the message was not sent by an admin
    // TODO: Make this use server admins instead of twilio
    // if (request.param('From') !==  ADMIN_PHONE ){
    //     response.status(403).send('you are not an admin :(');
    //     return;
    // }

    // Get the admin command and send it to the Minecraft server
    var command = request.param('Body');
    minecraftServerProcess.stdin.write(command+'\n');

    // buffer output for a quarter of a second, then reply to HTTP request
    var buffer = [];
    var collector = function(data) {
        data = data.toString();
        // Split to omit timestamp and junk from Minecraft server output
        buffer.push(data.split(']: ')[1]);
    };
    minecraftServerProcess.stdout.on('data', collector);

    // Delay for a bit, then send a response with the latest server output
    setTimeout(function() {
        minecraftServerProcess.stdout.removeListener('data', collector);

        // create a TwiML response with the output of the Minecraft server
        // TODO: Make this update a web element on the page instead of twilio
        // var twiml = new twilio.TwimlResponse();
        // twiml.message(buffer.join(''));
        //
        // response.type('text/xml');
        // response.send(twiml.toString());
    }, 250);
});

// Listen for incoming HTTP requests on port 3000
// TODO: Make the listen port configurable
app.listen(3000);

// Make sure the Minecraft server dies with this process
process.on('exit', function() {
    minecraftServerProcess.kill();
});

const bodyParser = require('body-parser');
const express = require('express');
// var https = require('https');
// var http = require('http');
const path = require('path');

const MinecraftServer = require('./minecraft-server.js');

let _defaultProperties = {
    app: {},
    ipAddress: '127.0.0.1', // or 0.0.0.0 for all interfaces
    ipPort: 3001,
    pathToWeb: 'minecraftservermanager/build',
    minecraftServer: {}
};

class MinecraftApi {
    get properties () {
        return this._properties;
    }

    set properties (props) {
        if (JSON.stringify(props) != {}) {
            this._properties = props;
        }
    }

    get ipAddress () {
        return this._properties.ipAddress;
    }

    set ipAddress (ip) {
        this._properties.ipAddress = ip;
    }

    get ipPort () {
        return this._properties.ipPort;
    }

    set ipPort (port) {
        this._properties.ipPort = port;
    }

    get minecraftServer () {
        return this._properties.minecraftServer;
    }

    set minecraftServer (server) {
        this._properties.minecraftServer = server;
    }

    constructor (minecraftServer, pathToWeb) {
        if (!this._properties) {
            this._properties = _defaultProperties;
        }

        let app = this.properties.app;
        
        if (!app.length) {
            if (!pathToWeb) {
                pathToWeb = this.properties.pathToWeb;
            }
            app = express();
            app.use(bodyParser.urlencoded({ extended: false }));
            
            // Serve React app @ root
            // TODO Make the path on disk make sense
            app.use(express.static(path.join(__dirname, pathToWeb)));
            // Allow browsers to make requests for us
            app.use(function(request, response, next) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
                response.setHeader('Access-Control-Allow-Credentials', true);
                next();
            });

            // Trap bad URLs and redirect to '/'
            // app.get('/*', function (req, res) {
            //     res.sendFile(path.join(__dirname, pathToWeb));
            // });
            
            this.properties.app = app;
        }
        
        if (minecraftServer) {
            this.properties.minecraftServer = minecraftServer;
        } else {
            this.properties.minecraftServer = new MinecraftServer();
        }

        this.connectMinecraftApi = this.connectMinecraftApi.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
    }

    connectMinecraftApi () {
        let app = this.properties.app;
        let minecraftServer = this.properties.minecraftServer;
        let minecraftFullHelp = this.properties.minecraftServer.properties.fullHelp;

        if (minecraftServer.properties) {
            app.get('/api/bannedIps', function (request, response) {
                response.contentType('json');
                response.json({
                    bannedIps: minecraftServer.properties.bannedIps
                });
            });
            app.get('/api/bannedPlayers', function (request, response) {
                response.contentType('json');
                response.json({
                    bannedPlayers: minecraftServer.properties.bannedPlayers
                });
            });
            app.get('/api/commands', function (request, response) {
                if (minecraftServer.properties.fullHelp) {
                    response.contentType('json');
                    response.json({
                        commands: minecraftServer.properties.fullHelp
                    });
                } else {
                    response.contentType('json');
                    response.json({
                        commands: null
                    });
                }
            });
            app.get('/api/listWorldBackups', function (request, response) {
                response.contentType('json');
                response.json({
                    backupList: minecraftServer.properties.backupList
                });
            });
            app.get('/api/ops', function (request, response) {
                response.contentType('json');
                response.json({
                    ops: minecraftServer.properties.ops
                });
            });
            app.get('/api/properties', function (request, response) {
                response.contentType('json');
                response.json({
                    properties: minecraftServer.properties.serverProperties
                });
            });
            app.get('/api/status', function (request, response) {
                // TODO: Make this more usable
                let rightNow = Date.now(),
                    uptime = rightNow - minecraftServer.properties.startTime,
                    mcuptime = minecraftServer.properties.startTime ? rightNow - minecraftServer.properties.startTime : null;
                
                response.contentType('json');
                response.json({
                    minecraftOnline: minecraftServer.properties.started,
                    minecraftUptime: mcuptime,
                    minecraftVersion: minecraftServer.properties.detectedVersion,
                    minecraftAcceptedEula: minecraftServer.properties.acceptedEula,
                    minecraftEulaUrl: minecraftServer.properties.eulaUrl,
                    uptime: uptime
                });
            });
            app.get('/api/userCache', function (request, response) {
                response.contentType('json');
                response.json({
                    userCache: minecraftServer.properties.userCache
                });
            });
            app.get('/api/whitelist', function (request, response) {
                response.contentType('json');
                response.json({
                    whitelist: minecraftServer.properties.whitelist
                });
            });
            app.post('/api/start', function (request, response) {
                minecraftServer.start();
                response.contentType('json');
                response.json({
                    response: 'started'
                });
            });
            app.post('/api/stop', function (request, response) {
                minecraftServer.stop();
                response.contentType('json');
                response.json({
                    response: 'stopped'
                });
            });
            app.post('/api/command', function (request, response) {
                let command = request.query.command;

                if (command === '/start') {
                    if (!minecraftServer.properties.started) {
                        minecraftServer.start(() => {
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
                } else if (command === '/list') {
                    minecraftServer.getMinecraftPlayers((list) => {
                        // debugger;
                        response.contentType('json');
                        response.json({
                            response: list
                        });
                    });
                } else {
                    response.contentType('json');
                    response.json({
                        response: 'stopped'
                    });
                }
            });
        } else {
            console.log('MinecraftServer not operational... ignoring MinecraftServer API requests.');
        }
    }

    start () {
        console.info('Starting MinecraftApi...');
        
        let properties = this.properties,
            app = properties.app,
            minecraftServer = properties.minecraftServer;

        this.connectMinecraftApi();

        app.listen(properties.ipPort, properties.ipAddress, function () {
            let url = 'http://' + this.address().address + ':' + this.address().port + '/';
            console.info('Web application running at ' + url);
        });
        
        // TODO - these appear to be broken. determine if need fixing. Might for SSL EVERYWHERE.
        // http.createServer(app).listen(8080, properties.ipAddress, function () {
        //     let url = 'http://' + this.address().address + ':' + this.address().port;
        //     console.log('Web application running at ' + url);
        // });
        // https.createServer(app).listen(8443, properties.ipAddress, function () {
        //     let url = 'https://' + this.address().address + ':' + this.address().port;
        //     console.log('Web application running at ' + url);
        // });
        
        // TODO Make starting Minecraft Server a preference, and check EULA?
        // if (minecraftServer.properties.acceptedEula) {
        //     minecraftServer.start();
        // } else {
        //     console.log('Minecraft EULA not accepted yet.');
        // }
        minecraftServer.start();

        console.info('MinecraftApi started.');
    }

    stop () {
        console.log('Stopping MinecraftApi...');
        
        let properties = this.properties,
            minecraftServer = properties.minecraftServer;
        
        if (minecraftServer.properties.started) {
            minecraftServer.stop(() => {
                console.log('MinecraftServer stopped.');
                properties.minecraftServer = null;
            });
        }
        console.log('MinecraftApi stopped.');
    }
}

module.exports = MinecraftApi;

// TODO Refactor these up^ there but after minecraft-server refactor.

// app.get('/api/command', function (request, response) {
//     let command = request.query.command;
    
//     if (command === '/list') {
//         if (minecraftStarted) {
//             // buffer output for a quarter of a second, then reply to HTTP request
//             let buffer = [],
//                 collector = function (data) {
//                     data = data.toString();
//                     buffer.push(data);
//                 };

//             minecraftServerProcess.stdout.removeListener('data', collector);
//             minecraftServerProcess.stdout.on('data', collector);

//             try {
//                 minecraftServerProcess.stdin.write(command + '\n');
//             }
//             catch (e) {
//                 debugger;
//             }
//             finally {
//                 // Delay for a bit, then send a response with the latest server output
//                 setTimeout(function () {
//                     minecraftServerProcess.stdout.removeListener('data', collector);
//                     // respond with the output of the Minecraft server
//                     // TODO: Make this update a web element on the page
//                     response.contentType('json');
//                     response.json({
//                         response: buffer.join('')
//                     });
//                 }, 250);
//             }

//         } else {
//             response.contentType('json');
//             response.json({
//                 response: 'Minecraft server not running.'
//             });
//         }
//     }
// });

// app.post('/api/acceptEula', function(request, response) {    
//     acceptEula();
    
//     startMinecraft(() => {
//         let rightNow = Date.now(),
//             uptime = rightNow - startTime,
//             mcuptime = minecraftStartTime? rightNow - minecraftStartTime : null;

//         listMinecraftCommands(0);

//         response.contentType('json');
//         response.json({
//             minecraftOnline: minecraftStarted,
//             minecraftUptime: mcuptime,
//             minecraftVersion: minecraftCurrentVersion,
//             minecraftAcceptedEula: minecraftAcceptedEula,
//             minecraftEulaUrl: minecraftEulaUrl,
//             uptime: uptime
//         });
//     });
// });

// // Handle Minecraft Server Command requests
// app.post('/api/command', function(request, response) {
//     // TODO: Cancel processing if the message was not sent by an admin/allowed address
//     // if (request.param('From') !==  ADMIN ){
//     //     response.status(403).send('you are not an admin :(');
//     //     return;
//     // }
//     let command = request.query,
//         worldName, backupToo;

//     if (command.command) {
//         command = command.command;

//         // TODO: Some commands should only be available to app admins, some only to ops, etc.etc.
//         // TODO: This means we need a permissions model
//         //     linked between this server and the webapp making these requests - oof.

//         if (command === '/start') {
//             if (!minecraftStarted) {
//                 startMinecraft(() => {
//                     response.contentType('json');
//                     response.json({
//                         minecraftOnline: true
//                     });
//                 });
//             } else {
//                 response.contentType('json');
//                 response.json({
//                     response: 'Server already running.'
//                 });
//             }
//         } else if (command === '/stop') {
//             stopMinecraft(() => {
//                 response.contentType('json');
//                 response.json({
//                     minecraftOnline: false
//                 });
//             });
//         } else if (command === '/backupWorld') {
//             worldName = request.query.worldName || 'world';
            
//             backupWorld(worldName);
//             response.contentType('json');
//             response.json({
//                 response: 'World backup complete.'
//             });
//         } else if (command === '/newWorld') {
//             console.log('Gonna nuke the planet. Literally.');
//             worldName = request.query.worldName || 'world';
//             backupToo = request.query.backup || false;
//             if (minecraftStarted) {
//                 stopMinecraft(() => {
//                     deleteWorld(worldName, backupToo);
//                     startMinecraft(() => {
//                         // Starting Minecraft will create a new world by default, so respond to the command accordingly
//                         response.contentType('json');
//                         response.json({
//                             response: 'New world created.'
//                         });
//                     });
//                 });
//             } else {
//                 deleteWorld(worldName, backupToo);

//                 response.contentType('json');
//                 response.json({
//                     response: 'New world will be created at startup.'
//                 });
//             }
//         } else if (command === '/restoreWorld') {
//             console.log('Gonna restore a world now.');
//             // worldName = request.query.worldName || 'world';
//             // backupName = request.query.backupFile;
//             // backupToo = request.query.backup || false;
//             // if (minecraftStarted) {
//             //     stopMinecraft(() => {
//             //         deleteWorld(worldName, backupToo);
//             //         restoreWorld(backupName); // TODO handle world renames too!
//             //         startMinecraft(() => {
//             //             response.contentType('json');
//             //             response.json({
//             //                 response: 'World restored.'
//             //             });
//             //         });
//             //     });
//             // } else {
//             //     deleteWorld(worldName, backupToo);
//             //     restoreWorld(backupName); // TODO handle world renames too!
//             //     response.contentType('json');
//             //     response.json({
//             //         response: 'New world will be created at startup.'
//             //     });
//             // }
//             response.contentType('json');
//             response.json({
//                 response: 'World restored.'
//             });
//         } else {
//             if (minecraftStarted) {
//                 // buffer output for a quarter of a second, then reply to HTTP request
//                 let buffer = [],
//                     collector = function (data) {
//                         data = data.toString();
//                         buffer.push(data);
//                     };
    
//                 minecraftServerProcess.stdout.removeListener('data', collector);
//                 minecraftServerProcess.stdout.on('data', collector);
//                 minecraftServerProcess.stdin.write(command + '\n');
    
//                 // Delay for a bit, then send a response with the latest server output
//                 setTimeout(function () {
//                     minecraftServerProcess.stdout.removeListener('data', collector);
//                     // respond with the output of the Minecraft server
//                     // TODO: Make this update a web element on the page
//                     response.contentType('json');
//                     response.json({
//                         response: buffer.join('')
//                     });
//                 }, 250);
//             } else {
//                 response.contentType('json');
//                 response.json({
//                     response: 'Minecraft server not running.'
//                 });
//             }
//         }
//     } else {
//         console.log('Got command with nothing to do.');
//         response.contentType('json');
//         response.json({
//             response: 'Invalid command'
//         });
//     }
// });

const bodyParser = require('body-parser');
const express = require('express');
// var https = require('https');
// var http = require('http');
const path = require('path');

const MinecraftServer = require('./minecraft-server.js');

const debugApi = false;

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
        try {
            let incoming = JSON.stringify(props);
            if (incoming.ipAddress) {
                // assume valid props
                this._properties = props;
            }
        } catch (e) {
            console.log('Somethings was wrong with the properties passed.');
            if (debugApi) {
                console.log(e.stack);
            }
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
        let properties = this.properties;
        let app = properties.app;
        let minecraftServer = properties.minecraftServer;
        let minecraftProperties = minecraftServer.properties;

        if (minecraftProperties) {
            app.get('/api/bannedIps', function (request, response) {
                response.contentType('json');
                response.json({
                    bannedIps: minecraftProperties.bannedIps
                });
            });
            app.get('/api/bannedPlayers', function (request, response) {
                response.contentType('json');
                response.json({
                    bannedPlayers: minecraftProperties.bannedPlayers
                });
            });
            app.get('/api/commands', function (request, response) {
                minecraftServer.listCommands(0, () => {
                    response.contentType('json');
                    response.json({
                        commands: minecraftProperties.fullHelp
                    });
                });
            });
            app.get('/api/ipInfo', function (request, response) {
                let ipInfo = {};
                if (minecraftProperties && minecraftProperties.serverProperties.length) {
                    for (let item of minecraftProperties.serverProperties) {
                        if (item.name === 'server-ip') {
                            if (item.value) {
                                ipInfo.address = item.value;
                            } else if (minecraftProperties.ipAddress) {
                                ipInfo.address = minecraftProperties.ipAddress;
                            }
                        } else if (item.name === 'server-port') {
                            ipInfo.port = item.value;
                        }
                    }
                }
                response.contentType('json');
                response.json(ipInfo);
            });
            app.get('/api/playerInfo', function (request, response) {
                minecraftServer.listPlayers((playerInfo) => {
                    response.contentType('json');
                    response.json(playerInfo);
                });
            });
            app.get('/api/listWorldBackups', function (request, response) {
                response.contentType('json');
                response.json({
                    backupList: minecraftProperties.backupList
                });
            });
            app.get('/api/ops', function (request, response) {
                response.contentType('json');
                response.json({
                    ops: minecraftProperties.ops
                });
            });
            app.get('/api/properties', function (request, response) {
                response.contentType('json');
                response.json({
                    properties: minecraftProperties.serverProperties
                });
            });
            app.get('/api/status', function (request, response) {
                // Some things in the MinecraftServer.properties cannot be sent back to the browser, so clone
                let serverProps = Object.assign({}, minecraftProperties);
                serverProps.serverProcess = {};
                serverProps.startedTimer = {};
                
                response.contentType('json');
                try {
                    JSON.stringify(serverProps);
                    response.json(serverProps);
                } catch (e) {
                    console.log('Got error from Minecraft properties.');
                    if (debugApi) {
                        console.log(e.stack);
                    }
                    response.json({response: 'An error occurred'});
                } finally {
                    serverProps = null;
                }
            });
            app.get('/api/userCache', function (request, response) {
                response.contentType('json');
                response.json({
                    userCache: minecraftProperties.userCache
                });
            });
            app.get('/api/whitelist', function (request, response) {
                response.contentType('json');
                response.json({
                    whitelist: minecraftProperties.whitelist
                });
            });
            app.post('/api/acceptEula', function (request, response) {
                minecraftServer.acceptEula();
                response.contentType('json');
                response.json({
                    response: 'accepted'
                });
            });
            app.post('/api/backupWorld', function (request, response) {
                minecraftServer.backupWorld(() => {
                    response.contentType('json');
                    response.json({
                        response: 'Backup complete.'
                    });
                });
            });
            app.post('/api/command', function (request, response) {
                let command = request.query.command;

                if (command === '/list') {
                    minecraftServer.getMinecraftPlayers((list) => {
                        response.contentType('json');
                        response.json({
                            response: list
                        });
                    });
                } else {
                    console.log('Got bum command:', command);
                    response.contentType('json');
                    response.json({
                        response: 'noop'
                    });
                }
            });
            app.post('/api/newWorld', function (request, response) {
                minecraftServer.newWorld(request.param('backup'), () => {
                    response.contentType('json');
                    response.json({
                        response: 'New world created.'
                    });
                });
            });
            app.post('/api/restart', function (request, response) {
                minecraftServer.stop(() => {
                    minecraftServer.start(() => {
                        response.contentType('json');
                        response.json({
                            response: 'restarted'
                        });
                    });
                });
            });
            app.post('/api/start', function (request, response) {
                minecraftServer.start(() => {
                    response.contentType('json');
                    response.json({
                        response: 'started'
                    });
                });
            });
            app.post('/api/stop', function (request, response) {
                minecraftServer.stop(() => {
                    response.contentType('json');
                    response.json({
                        response: 'stopped'
                    });
                });
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



        // this.properties.ipAddress = require('underscore')
        //     .chain(require('os').networkInterfaces())
        //     .values()
        //     .flatten()
        //     .find({family: 'IPv4', internal: false})
        //     .value()
        //     .address;

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

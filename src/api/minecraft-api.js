const bodyParser = require('body-parser');
const express = require('express');
// var https = require('https');
// var http = require('http');
const os = require('os');
const path = require('path');

const MinecraftServer = require(path.resolve('minecraft-server.js'));

const debugApi = false;

let _defaultProperties = {
    app: {},
    ipAddress: '127.0.0.1', // or 0.0.0.0 for all interfaces
    ipPort: 3001,
    minecraftServer: {},
    minecraftStatusTimerId: 0,
    nodeInfo: {
        cpus: os.cpus(),
        mem: os.totalmem(),
        version: process.version,
    },
    pathToWeb: 'minecraftservermanager/build',
    pollers: {}
};

class MinecraftApi {
    get properties () {
        return this._properties;
    }

    set properties (props) {
        try {
            let incoming = JSON.parse(JSON.stringify(props));
            if (incoming.ipAddress) {
                // TODO: Validate props. For now, assume valid props.
                this._properties = props;
            }
        } catch (e) {
            console.log('Something was wrong with the properties passed.');
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
            console.log(`pathToWeb: ${path.resolve(pathToWeb)}`);
            app = express();
            app.use(bodyParser.urlencoded({ extended: false }));
            
            // Serve React app @ root
            // TODO Make the path on disk make sense.
            app.use(express.static(path.resolve(pathToWeb)));
            // Allow browsers to make requests for us.
            // TODO: Tighten up the Allow-Origin. Preference in the web app?
            app.use(function(request, response, next) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
                response.setHeader('Access-Control-Allow-Credentials', true);
                next();
            });

            // TODO: Trap bad URLs and redirect to '/'.
            // This seems broken
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

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.startPollers = this.startPollers.bind(this);
        this.stopPollers = this.stopPollers.bind(this);
        this.connectMinecraftApi = this.connectMinecraftApi.bind(this);
        this.startMinecraft = this.startMinecraft.bind(this);
        this.stopMinecraft = this.stopMinecraft.bind(this);
        this.restartMinecraft = this.restartMinecraft.bind(this);
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
                response.contentType('json');
                if (minecraftProperties.started) {
                    minecraftServer.listCommands(0, () => {
                        response.json({
                            commands: minecraftProperties.fullHelp
                        });
                    });
                } else {
                    response.json({commands: {}});
                }
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
                response.contentType('json');
                response.json(minecraftProperties.playerInfo);
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
            app.get('/api/refreshServerProperties', [function (request, response) {
                minecraftServer.getServerProperties();
                response.contentType('json');
                response.json({
                    properties: minecraftProperties.serverProperties
                });
            }.bind(this)]);
            app.get('/api/status', function (request, response) {
                // Some things in the MinecraftServer.properties cannot be sent back to the browser, so clone and prune.
                let serverProps = Object.assign({}, minecraftProperties);
                serverProps.serverProcess = {};
                serverProps.startedTimer = {};
                serverProps.nodeInfo = properties.nodeInfo;
                
                response.contentType('json');
                try {
                    JSON.stringify(serverProps);
                    response.json(serverProps);
                } catch (e) {
                    console.log('Got error from Minecraft properties.');
                    if (debugApi) {
                        console.log(e.stack);
                    }
                    response.json({response: 'An error occurred.'});
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
                    response.contentType('json');
                    if (minecraftProperties.started) {
                        minecraftServer.listPlayers((list) => {
                            response.json({
                                response: list
                            });
                        });
                    } else {
                        response.json({response: []});
                    }
                } else if (command === '/restoreWorld') {
                    // TODO
                    console.log('Restore world called.');
                    response.contentType('json');
                    response.json({
                        output: 'Restore world disabled.'
                    });
                } else {
                    response.contentType('json');
                    if (minecraftProperties.started) {
                        minecraftServer.runCommand(command, function (output) {
                            response.json({
                                output: output
                            });
                        });
                    } else {
                        response.json({output: {}});
                    }
                }
            });
            app.post('/api/install', [function (request, response, next) {
                this.stopMinecraft(() => {
                    minecraftServer.install(request.param('version'), () => {
                        next();
                    });
                });
            }.bind(this), function (request, response) {
                this.startMinecraft(() => {
                    response.contentType('json');
                    response.json({
                        response: 'installed'
                    });
                });
            }.bind(this)]);
            app.post('/api/newWorld', function (request, response) {
                minecraftServer.newWorld(request.param('backup'), () => {
                    response.contentType('json');
                    response.json({
                        response: 'New world created.'
                    });
                });
            });
            app.post('/api/restart', function (request, response) {
                this.restartMinecraft(() => {
                    response.contentType('json');
                    response.json({
                        response: 'restarted'
                    });
                });
            }.bind(this));
            app.post('/api/saveMinecraftProperties', [function (request, response) {
                let newProperties = JSON.parse(request.param('newProperties'));
                minecraftServer.saveProperties(newProperties, () => {
                    response.contentType('json');
                    response.json({
                        response: 'saved'
                    });
                });
            }.bind(this)]);
            app.post('/api/start', function (request, response) {
                this.startMinecraft(() => {
                    response.contentType('json');
                    response.json({
                        response: 'started'
                    });
                });
            }.bind(this));
            app.post('/api/stop', function (request, response) {
                this.stopMinecraft(function () {
                    response.contentType('json');
                    response.json({
                        response: 'stopped'
                    });
                });
            }.bind(this));
        } else {
            console.log('MinecraftServer not operational... ignoring MinecraftServer API requests.');
        }
    }

    startPollers (pingWait) {
        let normalPingTime = 10 * 1000,
            appendTime = 1 * 1000,
            maxTime = 300 * 1000,
            pingTime;

        // Normally ping every 10 seconds.
        // If a fast ping was requested (from constructor/DidMount), honor it.
        // Once trouble hits, add 1 second until 5 minutes is reached, then reset to 10 seconds.
        // Once trouble fixed/successful, reset to 10 seconds.
        if (!pingWait) {
            pingTime = normalPingTime;
        } else if (pingWait < 1000) {
            pingTime = pingWait;
        } else if (pingWait > maxTime) {
            pingTime = normalPingTime;
        } else {
            pingTime = pingWait;
        }

        if (this.properties.pollers.minecraftStatusTimerId) {
            clearTimeout(this.properties.pollers.minecraftStatusTimerId);
        }

        this.properties.pollers.minecraftStatusTimerId = setTimeout(() => {
            if (this.minecraftServer.properties.installed) {
                pingTime = normalPingTime;
                this.minecraftServer.updateStatus(() => {
                    if (debugApi) {
                        console.log('Got Minecraft status:');
                        console.log(this.minecraftServer.properties);
                    }
    
                    if (debugApi) {
                        console.log('Setting Minecraft status poller to run in', pingTime/1000, 'seconds.');
                    }
                    this.startPollers(pingTime);
                });
            } else {
                pingTime = pingTime + appendTime;
                this.startPollers(pingTime);
            }
        }, pingTime);
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
        
        // TODO: These appear to be broken. Determine if need fixing (might for SSL-everywhere).
        // http.createServer(app).listen(8080, properties.ipAddress, function () {
        //     let url = 'http://' + this.address().address + ':' + this.address().port;
        //     console.log('Web application running at ' + url);
        // });
        // https.createServer(app).listen(8443, properties.ipAddress, function () {
        //     let url = 'https://' + this.address().address + ':' + this.address().port;
        //     console.log('Web application running at ' + url);
        // });
        
        // TODO: Make starting Minecraft Server a preference, and check EULA?
        // if (minecraftServer.properties.acceptedEula) {
        //     minecraftServer.start();
        // } else {
        //     console.log('Minecraft EULA not accepted yet.');
        // }
        if (minecraftServer.properties.installed) {
            this.startMinecraft();
        }

        console.info('MinecraftApi started.');
    }

    stop () {
        console.log('Stopping MinecraftApi...');
        
        let properties = this.properties,
            minecraftServer = properties.minecraftServer;

            
        if (minecraftServer.properties.started) {
            minecraftServer.stop(() => {
                console.log('MinecraftServer stopped.');
                this.stopPollers();
            });
        }
        console.log('MinecraftApi stopped.');
    }

    stopPollers () {
        let properties = this.properties;

        if (properties.pollers.minecraftStatusTimerId) {
            clearTimeout(properties.pollers.minecraftStatusTimerId);
        }
    }

    startMinecraft (callback) {
        let properties = this.properties,
            minecraftServer = properties.minecraftServer;

        minecraftServer.start(() => {
            this.startPollers(100);
            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    stopMinecraft (callback) {
        let properties = this.properties,
            minecraftServer = properties.minecraftServer;

        this.stopPollers();
        minecraftServer.stop(() => {
            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    restartMinecraft (callback) {
        this.stopMinecraft(() => {
            this.startMinecraft(() => {
                if (typeof callback === 'function') {
                    callback();
                }
            });
        });
    }
}

module.exports = MinecraftApi;

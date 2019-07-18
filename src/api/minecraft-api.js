// NodeJS Imports
const bodyParser = require('body-parser');
// var https = require('https');
// var http = require('http');
const os = require('os');
const path = require('path');
const express = require('express');

// minecraft-server-manager Imports
const Util = require(path.resolve('src', 'util', 'util'));
const MinecraftServer = require(path.resolve('src', 'server', 'minecraft-server'));

const debugApi = false;

//
// Default properties for the Minecraft API.
// Settings are written to disk to persist between runs.
//
let apiProperties = {
    settings: {
        ipAddress: '0.0.0.0', // 0.0.0.0 for all interfaces on the machine
        ipPort: 3001,
        autoStartMinecraft: false,
        pollMinecraft: {
            time: 10,
            units: "s"
        }
    },
    app: {},
    minecraftServer: {},
    nodeInfo: {
        cpus: os.cpus(),
        mem: os.totalmem(),
        version: process.version,
    },
    pathToWeb: 'minecraftservermanager/build',
    pollers: {},
    settingsFileName: 'api.properties'
};

/**
 * An ExpressJS API server to control and send/receive messages from a Minecraft Server instance.
 * @class
 * @param {MinecraftServer} minecraftServer - An optional instance of a MinecrafServer object.
 */
class MinecraftApi {
    constructor (minecraftServer) {
        if (!this.properties) {
            this.properties = Object.assign({}, apiProperties);
        }
        
        if (minecraftServer) {
            this.properties.minecraftServer = minecraftServer;
        } else {
            this.properties.minecraftServer = new MinecraftServer();
        }

        this.init = this.init.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.pollMinecraft = this.pollMinecraft.bind(this);
        this.stopMinecraftPoller = this.stopMinecraftPoller.bind(this);
        this.connectMinecraftApi = this.connectMinecraftApi.bind(this);
        this.startMinecraft = this.startMinecraft.bind(this);
        this.stopMinecraft = this.stopMinecraft.bind(this);
        this.restartMinecraft = this.restartMinecraft.bind(this);
    }

    /**
     * Reads the settings in and initializes the ExpressJS instance.
     * @param {string} pathToWeb An optional path to the Minecraft Server Manager web pages.
     */
    async init (pathToWeb) {
        this.properties.settings = await Util.readSettings(this.properties.settingsFileName, this.properties.settings);

        let app = this.properties.app;
        
        if (!app.length) {
            if (!pathToWeb) {
                pathToWeb = this.properties.pathToWeb;
            }
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
            // This seems broken when combined with the `express.static` up above.
            // app.get('/*', function (req, res) {
            //     res.sendFile(path.join(__dirname, pathToWeb));
            // });
            
            this.properties.app = app;
        } else {
            console.warn(`MinecraftApi already initialized.`);
        }
    }

    /**
     * Sets the paths for the ExpressJS app to serve.
     */
    async connectMinecraftApi () {
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
            app.get('/api/commands', async function (request, response) {
                response.contentType('json');
                if (minecraftProperties.started) {
                    await minecraftServer.listCommands();
                    response.json({
                        commands: minecraftProperties.fullHelp
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
            app.get('/api/refreshServerProperties', async function (request, response) {
                await minecraftServer.getServerProperties();
                response.contentType('json');
                response.json({
                    properties: minecraftProperties.serverProperties
                });
            }.bind(this));
            app.get('/api/status', function (request, response) {
                let props = {};
                let apiSettings = Object.assign({}, properties.settings);
                // Some things in the MinecraftServer.properties cannot be sent back to the browser, so clone and prune.
                let serverProps = Object.assign({}, minecraftProperties);
                delete serverProps.serverProcess;
                delete serverProps.startedTimer;
                serverProps.nodeInfo = properties.nodeInfo;

                props.apiSettings = apiSettings;
                props.minecraftProperties = serverProps;
                
                response.contentType('json');
                try {
                    JSON.stringify(props);
                    response.json(props);
                } catch (err) {
                    console.log(`An error occurred: ${err}`);
                    response.json({
                        error: err,
                        response: 'An error occurred.'
                    });
                } finally {
                    apiSettings = null;
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
            app.post('/api/acceptEula', async function (request, response) {
                await minecraftServer.acceptEula();
                response.contentType('json');
                response.json({
                    response: 'accepted'
                });
            });
            app.post('/api/backupWorld', async function (request, response) {
                await minecraftServer.backupWorld();
                response.contentType('json');
                response.json({
                    response: 'Backup complete.'
                });
            });
            app.post('/api/command', async function (request, response) {
                let command = request.query.command;

                if (minecraftProperties.started) {
                    let output = await minecraftServer.runCommand(command);
                    response.json({
                        output: output
                    });
                } else {
                    response.json({
                        output: ""
                    });
                }
            });
            app.post('/api/install', async function (request, response, next) {
                await minecraftServer.install(request.param('version'));
                await this.startMinecraft();
                response.contentType('json');
                response.json({
                    response: 'installed'
                });
            }.bind(this));
            app.post('/api/newWorld', async function (request, response) {
                await minecraftServer.newWorld(request.param('backup'));
                response.contentType('json');
                response.json({
                    response: 'New world created.'
                });
            });
            app.post('/api/restart', async function (request, response) {
                await this.restartMinecraft();
                response.contentType('json');
                response.json({
                    response: 'restarted'
                });
            }.bind(this));
            app.post('/api/saveMinecraftProperties', async function (request, response) {
                let newProperties = JSON.parse(request.param('newProperties'));
                await minecraftServer.saveProperties(newProperties);
                response.contentType('json');
                response.json({
                    response: 'saved'
                });
            }.bind(this));
            app.post('/api/start', async function (request, response) {
                await this.startMinecraft();
                response.contentType('json');
                response.json({
                    response: 'started'
                });
            }.bind(this));
            app.post('/api/stop', async function (request, response) {
                await this.stopMinecraft();
                response.contentType('json');
                response.json({
                    response: 'stopped'
                });
            }.bind(this));
            app.post('/api/saveApiPreferences', async function (request, response) {
                let settings = JSON.parse(request.param('settings'));
                this.properties.settings = Object.assign(this.properties.settings, settings);
                response.contentType('json');
                try {
                    await Util.saveSettings(this.properties.settingsFileName, this.properties.settings);
                    response.json({
                        response: 'api preferences saved'
                    });
                } catch (err) {
                    response.json({
                        error: err
                    });
                }
            }.bind(this));
        } else {
            console.err('MinecraftServer is not installed... ignoring MinecraftServer API requests.');
        }
    }

    /** Starts the MinecraftApi ExpressJS instance and MinecraftServer if configured. */
    async start () {
        console.info('Starting MinecraftApi...');

        let properties = this.properties;
        let app = properties.app;
        let autoStartMinecraft = properties.settings.autoStartMinecraft;

        await this.connectMinecraftApi();

        app.listen(properties.settings.ipPort, properties.settings.ipAddress, function () {
            let url = 'http://' + this.address().address + ':' + this.address().port + '/';
            console.info('Web application running at ' + url);
        });
        
        // TODO: These appear to be broken. Determine if need fixing (might for SSL-everywhere).
        // http.createServer(app).listen(8080, properties.settings.ipAddress, function () {
        //     let url = 'http://' + this.address().address + ':' + this.address().port;
        //     console.log('Web application running at ' + url);
        // });
        // https.createServer(app).listen(8443, properties.settings.ipAddress, function () {
        //     let url = 'https://' + this.address().address + ':' + this.address().port;
        //     console.log('Web application running at ' + url);
        // });

        if (autoStartMinecraft) {
            this.startMinecraft();
        }

        console.info('MinecraftApi started.');
    }

    /**
     * Stops the MinecraftApi instance and the associated MinecraftServer if running.
     */
    async stop () {
        console.log('Stopping MinecraftApi...');
        
        let properties = this.properties,
            minecraftServer = properties.minecraftServer;
            
        this.stopMinecraftPoller();
        if (minecraftServer.properties.started) {
            await minecraftServer.stop();
            console.log('MinecraftServer stopped.');
            properties.app.close();
        }
        await Util.saveSettings(this.properties.settingsFileName, this.properties.settings);
        console.log('MinecraftApi stopped.');
    }

    /**
     * Polls the MinecraftServer instance for information. This method caches the results for display
     * by the Minecraft Server web pages to prevent catastrophic actions on the MinecraftServer.
     * @param {number} pingWait An optional number of milliseconds to wait before polling the MinecraftServer.
     * By default, pingWait is 10 seconds.
     */
    pollMinecraft (pingWait) {
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
            if (this.properties.minecraftServer.properties.installed) {
                pingTime = normalPingTime;
                this.properties.minecraftServer.updateStatus(() => {
                    if (debugApi) {
                        console.log('Got Minecraft status:');
                        console.log(this.properties.minecraftServer.properties);
                    }
    
                    if (debugApi) {
                        console.log('Setting Minecraft status poller to run in', pingTime/1000, 'seconds.');
                    }
                    this.pollMinecraft(pingTime);
                });
            } else {
                pingTime = pingTime + appendTime;
                this.pollMinecraft(pingTime);
            }
        }, pingTime);
    }

    /**
     * Stops the polling of the MinecraftServer.
     */
    stopMinecraftPoller () {
        let properties = this.properties;

        if (properties.pollers.minecraftStatusTimerId) {
            clearTimeout(properties.pollers.minecraftStatusTimerId);
        }
    }

    /**
     * Starts the MinecraftServer instance.
     */
    async startMinecraft () {
        let properties = this.properties,
            minecraftServer = properties.minecraftServer;

        console.log(`Starting MinecraftServer...`);
        await minecraftServer.start();
        console.log(`MinecraftServer started.`);
        this.pollMinecraft(100);
    }

    /**
     * Stops the MinecraftServer instance.
     */
    async stopMinecraft () {
        let properties = this.properties;
        let minecraftServer = properties.minecraftServer;

        this.stopMinecraftPoller();
        await minecraftServer.stop();
        return Promise.resolve();
    }

    /**
     * Stops and starts the MinecraftServer instance.
     */
    async restartMinecraft () {
        await this.stopMinecraft();
        await this.startMinecraft();
        return Promise.resolve();
    }

    /**
     * Logs things to a file.
     * @param {string} data The data to log.
     */
    async log (data) {
        try {
            await Util.log(data, 'minecraft-api.log');
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /**
     * Clears the log file.
     */
    async clearLog () {
        try {
            await Util.clearLog('minecraft-api.log');
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

module.exports = MinecraftApi;

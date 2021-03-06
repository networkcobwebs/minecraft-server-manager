// NodeJS Imports
const bodyParser = require('body-parser');
// var https = require('https');
// var http = require('http');
const os = require('os');
const path = require('path');
const express = require('express');

// minecraft-server-manager Imports
const MSMUtil = new require('../util/util');
const Util = new MSMUtil();
const MinecraftServer = require('../server/MinecraftServer');

const debugApi = false;

//
// Default properties for the Minecraft API.
// Settings are written to disk to persist between runs.
//
const apiProperties = {
  settings: {
    ipAddress: '0.0.0.0', // 0.0.0.0 for all interfaces on the machine
    ipPort: 3001,
    autoStartMinecraft: false,
    pollMinecraft: {
      time: 10,
      units: 's'
    }
  },
  app: {},
  minecraftServer: {},
  nodeInfo: {
    cpus: os.cpus(),
    mem: os.totalmem(),
    version: process.version
  },
  pathToWeb: '',
  pollers: {},
  settingsFileName: 'api.properties',
  webServer: {}
};

/**
 * An ExpressJS API server to control and send/receive messages from a Minecraft Server instance.
 * @class
 * @param {MinecraftServer} minecraftServer - An optional instance of a MinecrafServer object.
 */
class MinecraftApi {
  constructor (minecraftServer) {
    this.properties = Object.assign({}, apiProperties);

    if (minecraftServer) {
      this.properties.minecraftServer = minecraftServer;
    } else {
      this.properties.minecraftServer = new MinecraftServer();
    }
  }

  /**
     * Reads the settings in and initializes the ExpressJS instance.
     * @param {string} pathToWeb An optional path to the Minecraft Server Manager web pages.
     */
  async init (pathToWeb) {
    const properties = this.properties;
    let app = this.properties.app;
    let minecraftServer = properties.minecraftServer;

    properties.settings = await Util.readSettings(properties.settingsFileName, properties.settings);

    if (!app.length) {
      const moduleMain = require.main;
      const moduleFile = moduleMain.filename;
      const moduleParent = path.dirname(path.resolve(moduleFile));
      pathToWeb = path.join(moduleParent, 'src', 'web', 'build');
      properties.pathToWeb = pathToWeb;
      app = express();
      app.use(bodyParser.urlencoded({ extended: false }));

      // Serve React app @ root
      // TODO Make the path on disk make sense.
      app.use(express.static(path.resolve(pathToWeb)));
      // Allow browsers to make requests for us.
      // TODO: Tighten up the Allow-Origin. Preference in the web app?
      app.use(function (request, response, next) {
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

      properties.app = app;

      if (!minecraftServer) {
        minecraftServer = new MinecraftServer();
      }
      await minecraftServer.init();
    } else {
      console.warn('MinecraftApi already initialized.');
    }
  }

  /**
     * Sets the paths for the ExpressJS app to serve.
     */
  async connectMinecraftApi () {
    const properties = this.properties;
    const app = properties.app;
    const minecraftServer = properties.minecraftServer;
    const minecraftProperties = minecraftServer.properties;

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
          response.json({ commands: {} });
        }
      });
      app.get('/api/ipInfo', function (request, response) {
        const ipInfo = {};
        if (minecraftProperties && minecraftProperties.serverProperties.length) {
          for (const item of minecraftProperties.serverProperties) {
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
      });
      app.get('/api/status', function (request, response) {
        const props = {};
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
        response.contentType('json');
        try {
          await minecraftServer.acceptEula();
          // await this.startMinecraft();
          response.json({
            response: 'eula accepted'
          });
        } catch (err) {
          console.log('An error occurred accepting the Minecraft EULA.');
          console.log(JSON.stringify(err));
          response.json({
            error: err,
            response: 'unable to accept eula'
          });
        }
      }.bind(this));
      app.post('/api/backupWorld', async function (request, response) {
        response.contentType('json');
        try {
          await minecraftServer.backupWorld();
          response.json({
            response: 'world backup complete'
          });
        } catch (err) {
          response.json({
            error: err
          });
        }
      });
      app.post('/api/command', async function (request, response) {
        const command = request.query.command;

        response.contentType('json');
        try {
          if (minecraftProperties.started) {
            const output = await minecraftServer.runCommand(command);
            response.json({
              output: output
            });
          } else {
            response.json({
              output: ''
            });
          }
        } catch (err) {
          // TODO???
        }
      });
      app.post('/api/install', async function (request, response) {
        response.contentType('json');
        try {
          await minecraftServer.install(request.query.version);
          // await this.startMinecraft();
          response.json({
            response: 'installed'
          });
        } catch (err) {
          response.json({
            response: 'installation failed'
          });
        }
      }.bind(this));
      app.post('/api/newWorld', async function (request, response) {
        response.contentType('json');
        try {
          await minecraftServer.newWorld(JSON.parse(request.query.backup));
          response.json({
            response: 'New world created.'
          });
        } catch (err) {
          response.json({
            error: err
          });
        }
      });
      app.post('/api/restart', async function (request, response) {
        response.contentType('json');

        try {
          await this.restartMinecraft();
          response.json({
            response: 'restarted'
          });
        } catch (err) {
          response.json({
            error: err
          });
        }
      }.bind(this));
      app.post('/api/saveMinecraftProperties', async function (request, response) {
        const newProperties = JSON.parse(request.param('newProperties'));

        response.contentType('json');

        try {
          await minecraftServer.saveProperties(newProperties);
          response.json({
            response: 'saved'
          });
        } catch (err) {
          response.json({
            error: err
          });
        }
      });
      app.post('/api/start', async function (request, response) {
        response.contentType('json');

        try {
          await this.startMinecraft();
          response.json({
            response: 'started'
          });
        } catch (err) {
          response.json({
            error: err
          });
        }
      }.bind(this));
      app.post('/api/stop', async function (request, response) {
        response.contentType('json');

        try {
          await this.stopMinecraft();
          response.json({
            response: 'stopped'
          });
        } catch (err) {
          response.json({
            error: err
          });
        }
      }.bind(this));
      app.post('/api/saveApiPreferences', async function (request, response) {
        const settings = JSON.parse(request.param('settings'));
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
      console.error('MinecraftServer is not installed... ignoring MinecraftServer API requests.');
    }
  }

  /** Starts the MinecraftApi ExpressJS instance and MinecraftServer if configured. */
  async start () {
    console.log('Starting MinecraftApi...');

    const properties = this.properties;
    const app = properties.app;
    const autoStartMinecraft = properties.settings.autoStartMinecraft || apiProperties.settings.autoStartMinecraft;

    try {
      if (autoStartMinecraft) {
        await this.startMinecraft();
      }

      await this.connectMinecraftApi();

      properties.webServer = app.listen(properties.settings.ipPort, properties.settings.ipAddress, function () {
        const url = `http://${this.address().address}:${this.address().port}/`;
        console.log(`Web application running at ${url}`);
        console.log('MinecraftApi started.');
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
    } catch (err) {
      throw err;
    }
  }

  /**
     * Stops the MinecraftApi instance and the associated MinecraftServer if running.
     */
  async stop () {
    try {
      console.log('Stopping MinecraftApi...');
      await this.stopMinecraft();
      await Util.saveSettings(this.properties.settingsFileName, this.properties.settings);
      console.log('MinecraftApi stopped.');
    } catch (err) {
      throw err;
    }
  }

  /**
     * Polls the MinecraftServer instance for information. This method caches the results for display
     * by the Minecraft Server web pages to prevent catastrophic actions on the MinecraftServer.
     * @param {number} pingWait An optional number of milliseconds to wait before polling the MinecraftServer.
     * By default, pingWait is 10 seconds.
     */
  async pollMinecraft (pingWait) {
    const normalPingTime = 10 * 1000;
    const appendTime = 1 * 1000;
    const maxTime = 300 * 1000;
    let pingTime;

    // Normally ping every 10 seconds.
    // If a fast ping was requested (from constructor or startMinecraft, etc.), honor it.
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

    this.properties.pollers.minecraftStatusTimerId = setTimeout(async () => {
      if (this.properties.minecraftServer.properties.installed && this.properties.minecraftServer.properties.started) {
        pingTime = normalPingTime;
        await this.properties.minecraftServer.updateStatus();
        if (debugApi) {
          console.log('Got Minecraft status:');
          console.log(this.properties.minecraftServer.properties);
        }

        if (debugApi) {
          console.log(`Setting Minecraft status poller to run in ${pingTime / 1000} seconds.`);
        }
        await this.pollMinecraft(pingTime);
      } else {
        pingTime = pingTime + appendTime;
        await this.pollMinecraft(pingTime);
      }
    }, pingTime);
  }

  /**
     * Stops the polling of the MinecraftServer.
     */
  stopMinecraftPoller () {
    const properties = this.properties;

    if (properties.pollers.minecraftStatusTimerId) {
      clearTimeout(properties.pollers.minecraftStatusTimerId);
    }
  }

  /**
     * Starts the MinecraftServer instance.
     */
  async startMinecraft () {
    try {
      const properties = this.properties;
      const minecraftServer = properties.minecraftServer;
      if (minecraftServer.properties.installed) {
        console.log('Starting MinecraftServer...');
        await minecraftServer.start();
        console.log('MinecraftServer started.');
        await this.pollMinecraft();
      }
    } catch (err) {
      console.log('Unable to start MinecraftServer.');
      console.log(err.message);
      this.stopMinecraftPoller();
    }
  }

  /**
     * Stops the MinecraftServer instance.
     */
  async stopMinecraft () {
    const properties = this.properties;
    const minecraftServer = properties.minecraftServer;

    this.stopMinecraftPoller();

    try {
      await minecraftServer.stop();
    } catch (err) {
      console.log(err.message);
    }
  }

  /**
     * Stops and starts the MinecraftServer instance.
     */
  async restartMinecraft () {
    try {
      await this.stopMinecraft();
      await this.startMinecraft();
    } catch (err) {
      console.log(err.message);
      this.stopMinecraftPoller();
    }
  }

  /**
     * Logs things to a file.
     * @param {string} data The data to log.
     */
  async log (data) {
    await Util.log(data, 'minecraft-api.log');
  }

  /**
     * Clears the log file.
     */
  async clearLog () {
    await Util.clearLog('minecraft-api.log');
  }
}

module.exports = MinecraftApi;

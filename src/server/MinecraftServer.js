// NodeJS Imports
const archiver = require('archiver');
const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const FS = fs.constants;
const os = require('os');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const crypto = require('crypto');
const { RCONClient } = require('rcon.js');

// minecraft-server-manager Imports
const MSMUtil = require('../util/util');
const Util = new MSMUtil();
const Eula = require('./Eula');

const minecraftProperties = {
  settings: {
    javaHome: '',
    javaPath: '',
    minecraftDirectory: path.join(Util.homeDir, 'minecraft_server'),
    serverJar: 'server.jar',
    memory: {
      minimum: 1,
      maximum: 1,
      units: 'G'
    },
    backups: {
      path: path.join(Util.homeDir, 'minecraft_server', 'backups', 'worlds'),
      numToKeep: 5
    }
  },
  settingsFileName: 'server.properties',
  acceptedEula: false,
  allowedCommands: [],
  backupList: [],
  bannedIps: [],
  bannedPlayers: [],
  detectedVersion: {},
  eulaFound: false,
  eulaUrl: 'https://account.mojang.com/documents/minecraft_eula',
  fullHelp: [],
  help: [],
  helpPages: 0,
  installed: false,
  installedVersions: [],
  ipAddress: '',
  needsInstallation: true,
  ops: [],
  osType: os.type(),
  playerInfo: { players: [], summary: '' },
  rconClient: {
    configured: false
  },
  serverOutput: [],
  serverOutputCaptured: false,
  serverProperties: [],
  serverProcess: null,
  started: false,
  starting: false,
  startTime: null,
  stopping: false,
  stopped: false,
  updateAvailable: false,
  userCache: {},
  versions: {
    installed: [],
    latest: {},
    release: [],
    snapshot: []
  },
  whitelist: [],
  worldName: ''
};

class MinecraftServer {
  constructor () {
    this.properties = Object.assign({}, minecraftProperties);
    this.eula = new Eula();
    this.bufferMinecraftOutput = this.bufferMinecraftOutput.bind(this);
    this.properties.ipAddress = require('underscore')
      .chain(require('os').networkInterfaces())
      .values()
      .flatten()
      .find({ family: 'IPv4', internal: false })
      .value()
      .address;
  }

  async init () {
    const properties = this.properties;

    try {
      await this.clearLog();
      await this.log('Initializing MinecraftServer...');
      this.properties.settings = await Util.readSettings(properties.settingsFileName, properties.settings);
      await Promise.all([
        this.detectJavaHome(),
        this.checkForMinecraftInstallation(),
        this.getMinecraftVersions()
      ]).catch(err => {
        await this.log('An error occurred during initialization.');
        await this.log(err.stack);
        throw err;
      });
    } catch (err) {
      await this.log('An error occurred during initialization.');
      await this.log(err.stack);
      throw err;
    }
  }

  async acceptEula () {
    try {
      await this.log('Checking and accepting MinecraftServer EULA...');
      if (this.properties.installed && (this.properties.acceptedEula === 'false' || !this.properties.acceptedEula)) {
        await this.log('Accepting EULA...');
        await this.eula.accept(this.properties.settings.minecraftDirectory);
        this.properties.acceptedEula = true;
      }
    } catch (err) {
      await this.log(`An error occurred accepting the Minecraft EULA. ${err}`);
      await this.log(err.stack);
      throw err;
    }
  }

  async backupWorld (worldName) {
    let minecraftWasRunning = false;
    let archive;
    let output;
    
    try {
      await this.log('Backing up MinecraftServer world...');
      worldName = worldName || 'world';
      if (this.properties.started) {
        minecraftWasRunning = true;
          await this.stop();
      }
      await fs.ensureDir(this.properties.settings.backups.path, { recursive: true });
      output = await fs.createWriteStream(path.join(this.properties.settings.backups.path, `${worldName}_${Util.getDateTime()}.zip`));
      archive = archiver('zip', {
        zlib: { level: 9 }
      });
      archive.pipe(output);

      await archive.directory(path.join(this.properties.settings.minecraftDirectory, worldName), false);
      await archive.finalize();
  
      await this.log(`Backup size: ${archive.pointer()} total bytes.`);
      await this.log('MinecraftServer World backed up.');
      await this.listWorldBackups();
      if (minecraftWasRunning) {
        await this.startMinecraftProcess();
      }
      return this.properties.backupList;
    } catch (err) {
      await this.log('An error occurred backing up the world.');
      await this.log(err.stack);
      throw err;
    }
  }

  async checkForMinecraftInstallation () {
    const minecraftDirectory = path.resolve(this.properties.settings.minecraftDirectory);
    try {
      await this.log('Checking for Minecraft installation.');
      await fs.access(minecraftDirectory, FS.F_OK | FS.R_OK | FS.W_OK);
      await Promise.all([
        this.detectMinecraftJar(),
        this.getEula()
      ]);
    } catch (err) {
      if (err.code === 'ENOENT') {
        await this.log(`Creating directory at ${minecraftDirectory}...`);
        try {
          await fs.ensureDir(minecraftDirectory);
          this.properties.installed = false;
        } catch (er) {
          await this.log('An error occurred creating the Minecraft server directory.');
          await this.log(er.stack);
          throw er;
        }
      } else {
        await this.log('An error occurred checking for Minecraft installation.');
        await this.log(err.stack);
        throw err;
      }
    }
  }

  async checkForMinecraftToBeStarted () {
    let outputLines = [];
    let outputString = '';
    let versionParts = [];
    let major, minor, release;

    try {
      await this.log('Checking for Minecraft to be started...');
      await this.attachToMinecraft();
      await this.waitForBufferToBeFull(30);
      // Output buffer could be array of arrays, so combine into something usable.
      if (Array.isArray(this.properties.serverOutput) && this.properties.serverOutput.length) {
        outputString = this.properties.serverOutput.join(os.EOL);
        outputLines = outputString.split(os.EOL);
      }
  
      for (let i = 0; i < outputLines.length; i++) {
        let line = outputLines[i];
        const theLine = line.toLowerCase();
        if (theLine.search(/failed to load properties from file: server.properties/) !== -1) {
          await this.log('The server.properties file is missing.');
          this.properties.starting = true;
        } else if (theLine.search(/eula.txt/) !== -1) {
          // Minecraft has changed the wording of EULA errors in the log as of 1.14.4. BEWARE.
          await this.log('The Minecraft EULA needs to be accepted. MinecraftServer start aborted.');
          await this.log('Use the web interface to view and accept the Minecraft license agreement, or accept it manually.');
          await this.detachFromMinecraft();
          this.properties.starting = false;
          this.properties.started = false;
          await this.stop();
          throw new Error('The Minecraft EULA needs to be accepted.');
        } else if (theLine.search(/stopping server/) !== -1) {
          await this.log('An error occurred starting MinecraftServer. Check the Minecraft log.');
          await this.log('Minecraft startup failed.');
          await this.log(line);
          await this.detachFromMinecraft();
          this.properties.starting = false;
          this.properties.started = false;
          await this.stop();
          throw new Error('Minecraft startup failed. Check the Minecraft log.');
        } else if (theLine.search(/server version/) !== -1) {
          versionParts = theLine.split('.');
          major = versionParts.shift();
          minor = versionParts.shift();
          release = versionParts.shift().trim() || '0';
          versionParts = major.split('version ');
          major = versionParts[versionParts.length - 1];
          this.properties.detectedVersion.major = parseInt(major);
          this.properties.detectedVersion.minor = parseInt(minor);
          this.properties.detectedVersion.release = parseInt(release);
          this.properties.detectedVersion.full = `${major}.${minor}.${release}`;
          this.properties.starting = true;
          this.properties.started = false;
          await this.log(`Detected MinecraftServer version: ${this.properties.detectedVersion.full}`);
        } else if (theLine.search(/done/) !== -1) {
          this.properties.started = true;
          this.properties.starting = false;
          this.properties.stopped = false;
          this.properties.startTime = Date.now();
          await this.log('MinecraftServer.checkForMinecraftToBeStarted: MinecraftServer started.');
          await this.detachFromMinecraft();
        }
      }
      
      if (!this.properties.started && this.properties.starting) {
        await this.detachFromMinecraft();
        await this.checkForMinecraftToBeStarted();
      }
    } catch (err) {
      await this.detachFromMinecraft();
      await this.log('An error occurred determining Minecraft start state.');
      await this.log(err.stack);
      throw err;
    }
  }

  async checkForMinecraftToBeStopped () {
    const properties = this.properties;
    let outputLines = [];
    let outputString = '';

    try {
      await this.log('Checking for Minecraft to be stopped...');
      await this.attachToMinecraft();
      await this.waitForBufferToBeFull(10);

      // Output buffer could be array of arrays, so combine into something usable.
      if (Array.isArray(properties.serverOutput) && properties.serverOutput.length) {
        outputString = properties.serverOutput.join(os.EOL);
        outputLines = outputString.split(os.EOL);
      }

      for (const line of outputLines) {
        if (line.indexOf('Saving chunks') !== -1 || line.indexOf('Stopping server') !== -1) {
          // Minecraft is at a far enough point in shutdown to return now.
          await this.log('MinecraftServer stopped.');
          properties.serverProcess = {};
          properties.started = false;
          properties.startTime = null;
          properties.stopping = false;
          properties.stopped = true;
          properties.allowedCommands = [];
          properties.playerInfo = {
            players: [],
            summary: ''
          };
          break;
        }
      }
      await this.detachFromMinecraft();
    } catch (err) {
      await this.detachFromMinecraft();
      await this.log('An error occurred waiting for Minecraft to be stopped.');
      await this.log(err.stack);
      throw err;
    }
  }

  /**
     * Checks for a newer release of the Minecraft server jar.
     */
  async checkForMinecraftUpdate () {
    try {
      await this.log('Checking for Minecraft server update...');
      await this.getMinecraftVersions();
      const detectedVersion = this.properties.detectedVersion;
      const release = { major: '', minor: '', release: '', full: this.properties.versions.latest.release };
      let releaseParts = [];
      releaseParts = release.full.split('.');
      release.major = parseInt(releaseParts[0]);
      release.minor = parseInt(releaseParts[1]);
      release.release = parseInt(releaseParts[2]) || 0;
      if (release.full !== detectedVersion.full) {
        if (release.major > detectedVersion.major) {
          this.properties.updateAvailable = true;
        } else if (release.major == detectedVersion.major && release.minor > detectedVersion.minor) {
          this.properties.updateAvailable = true;
        } else if (release.major == detectedVersion.major && release.minor == detectedVersion.minor && release.release > detectedVersion.release) {
          this.properties.updateAvailable = true;
        }
        await this.log(`Minecraft version ${release.full} available.`);
      } else {
        this.properties.updateAvailable = false;
        await this.log('No update available.');
      }
      await this.log('Done checking for Minecraft server update.');
    } catch (err) {
      await this.log('An error occurred checking for Minecraft server updates.');
      await this.log(err.stack);
      throw err;
    }
  }

  /**
     * Gets and stores the home directory and the Java executable found in PATH.
     */
  async detectJavaHome () {
    try {
      await this.log('Detecting Java home path...');
      // Request Java's internal properties, that are printed to 'stderr'
      const { stdout, stderr } = await exec('java -XshowSettings:properties -version');
      if (stdout) {
        await this.log('Could not find a Java executable in the environment PATH. Make sure Java is properly installed.');
        throw new Error(stdout);
      } else {
        // RegExp that matches the line 'java.home = [path_to_home]'
        const javaHomeRegExp = /^\s*java.home/;
        // Finds and normalizes the java home path
        const javaHome = path.normalize(stderr
        // Loop through lines as an array
          .split(os.EOL)
        // Find the first line that matches our regexp
          .find(line => javaHomeRegExp.test(line))
        // Split the line in two and return the path
          .split(/\s*=\s*/)[1]);
        this.properties.settings.javaHome = javaHome;
        this.properties.settings.javaPath = path.join(javaHome, 'bin', 'java');
        await this.log(`Using java from ${this.properties.settings.javaHome}`);
        return this.properties.settings.javaHome;
      }
    } catch (err) {
      await this.log('An error occurred detecting JAVA_HOME.');
      await this.log(err.stack);
      throw err;
    }
  }

  async detectMinecraftJar () {
    const properties = this.properties;
    const settings = properties.settings;
    const minecraftDirectory = settings.minecraftDirectory;
    const installedVersions = [];
    let minecraftFiles = [];
    try {
      await this.log('Detecting MinecraftServer jar...');
      // Find a Minecraft server.jar to run.
      // We download versions and name them {release}_minecraft_server.jar in the install function.
      minecraftFiles = await fs.readdir(minecraftDirectory);
      minecraftFiles.forEach(file => {
        // Detect versions we've downloaded.
        if (file.indexOf('_minecraft_server.jar') !== -1) {
          installedVersions.push(file);
          // Detect running versions.
        } else if (file.indexOf(settings.serverJar) !== -1) {
          properties.installed = true;
          properties.needsInstallation = false;
        }
      });
      properties.versions.installed = installedVersions;
      return path.resolve(minecraftDirectory, settings.serverJar);
    } catch (err) {
      properties.installed = false;
      properties.needsInstallation = true;
      if (err.code !== 'ENOENT') {
        await this.log('An error occurred detecting the Minecraft jar.');
        await this.log(err.stack);
        throw err;
      } else {
        await this.log('Minecraft needs to be installed.');
      }
    }
  }

  async determineBanStatus (player) {
    try {
      await this.log(`Determining ban status for player: ${player.name}`);
      const properties = this.properties;
      let banned = false;
      if (properties.bannedPlayers.length) {
        for (const bannedPlayer of properties.bannedPlayers) {
          if (bannedPlayer.name === player.name) {
            banned = true;
          }
        }
      }
      return banned;
    } catch (err) {
      await this.log(`An error occurred determining player ${player.name}'s ban status.`);
      await this.log(err.stack);
      throw err;
    }
  }

  async determineOpStatus (player) {
    try {
      await this.log(`Determining op status for player: ${player.name}`);
      const properties = this.properties;
      let op = false;
      if (properties.ops.length) {
        for (const oppedPlayer of properties.ops) {
          if (oppedPlayer.name === player.name) {
            op = true;
          }
        }
      }
      return op;
    } catch (err) {
      await this.log(`An error occurred determining player ${player.name}'s op status.`);
      await this.log(err.stack);
      throw err;
    }
  }

  async determineWhitelistStatus (player) {
    try {
      await this.log(`Determining whitelist status for player: ${player.name}`);
      const properties = this.properties;
      let whitelisted = false;
      if (properties.whitelist.length) {
        for (const whitelistedPlayer of properties.whitelist) {
          if (whitelistedPlayer.name === player.name) {
            whitelisted = true;
          }
        }
      }
      return whitelisted;
    } catch (err) {
      await this.log(`An error occurred determining player ${player.name}'s whitelist status.`);
      await this.log(err.stack);
      throw err;
    }
  }

  /**
     * Downloads a release from the Minecraft servers.
     * @param {string} version An optional version to download. Default version is 'latest'.
     */
  async downloadRelease (version = 'latest') {
    const properties = this.properties;
    const minecraftDirectory = properties.settings.minecraftDirectory;
    let release = properties.versions.release[0];
    let fileStream;
    if (version === 'latest') {
      version = properties.versions.latest.release;
    }
    properties.versions.installed = properties.versions.installed || [];
    properties.versions.release.forEach(releaseVersion => {
      if (releaseVersion.id === version) {
        release = releaseVersion;
      }
    });
    try {
      await this.log(`Fetching release information for: ${release.id}...`);
      let response = await axios.get(release.url);
      const versionInfo = response.data;
      if (versionInfo.downloads && versionInfo.downloads.server && versionInfo.downloads.server.url) {
        const jar = `${release.id}_minecraft_server.jar`;
        const url = versionInfo.downloads.server.url;
        const minecraftDirExists = await fs.pathExists(minecraftDirectory);
        if (!minecraftDirExists) {
          await fs.ensureDir(minecraftDirectory);
        }
        fileStream = await fs.createWriteStream(path.join(minecraftDirectory, jar));
        response = await axios({
          url,
          method: 'GET',
          responseType: 'stream'
        });
        response.data.pipe(fileStream);
        properties.versions.installed.push(jar);
        await this.log(`Download of Minecraft server version ${release.id} complete.`);
        return new Promise((resolve, reject) => {
          fileStream.on('finish', resolve);
          fileStream.on('error', reject);
        });
      }
    } catch (err) {
      await this.log('An error occurred downloading the requested release.');
      await this.log(err.stack);
      throw err;
    }
  }

  async getBannedIps () {
    const properties = this.properties;
    const minecraftDirectory = properties.settings.minecraftDirectory;
    try {
      if (properties.installed) {
        await this.log('Getting MinecraftServer banned IPs...');
        properties.bannedIps = await fs.readJSON(path.join(minecraftDirectory, 'banned-ips.json'));
      } else {
        await this.log('Minecraft is not installed.');
      }
    } catch (err) {
      properties.bannedIps = [];
      await this.log('Failed to read banned-ips.json:');
      await this.log(err.stack);
      throw err;
    }
  }

  async getBannedPlayers () {
    const properties = this.properties;
    const minecraftDirectory = properties.settings.minecraftDirectory;
    try {
      if (properties.installed) {
        await this.log('Getting MinecraftServer banned players...');
        properties.bannedPlayers = await fs.readJSON(path.join(minecraftDirectory, 'banned-players.json'));
      } else {
        await this.log('Minecraft is not installed.');
      }
    } catch (err) {
      properties.bannedPlayers = [];
      await this.log('Failed to read banned-players.json:');
      await this.log(err.stack);
      throw err;
    }
  }

  getCommand (line, required, optional) {
    let start = 0;
    let end = 0;
    let arg;
    const args = [];
    let startChar, endChar;

    if (required) {
      startChar = '<';
      endChar = '>';
    }
    if (optional) {
      startChar = '[';
      endChar = ']';
    }

    while (start !== -1) {
      start = line.indexOf(startChar, end);
      end = line.indexOf(endChar, start);

      if (start !== -1) {
        const option = line.substr(start + 1, end - start - 1);
        const options = option.concat(line.substr(end + 1, line.indexOf(' ', end + 1) - end - 1));
        if (options.indexOf('|') !== -1) {
          const args2 = options.split('|');
          while ((arg = args2.shift()) !== undefined) {
            args.push(arg);
          }
        } else {
          args.push(options);
        }
        start = line.indexOf(startChar, end);
      }
    }

    return args;
  }

  async getEula () {
    const properties = this.properties;
    const minecraftDirectory = properties.settings.minecraftDirectory;
    try {
      await this.log('Getting MinecraftServer EULA acceptance state...');
      this.properties.eulaUrl = await this.eula.getUrl(minecraftDirectory);
      this.properties.acceptedEula = await this.eula.check(minecraftDirectory);
      this.properties.eulaFound = true;
    } catch (err) {
      await this.log('Failed to read eula.txt.');
      await this.log('Minecraft probably needs to be run once to stage new files.');
      await this.log('Use the web interface to accept the license agreement.');
      properties.eulaFound = false;
    }
  }

  async getMinecraftVersions () {
    let minecraftVersions = [];
    const releaseVersions = [];
    const snapshotVersions = [];
    try {
      // TODO enable snapshot updates with a property/preference
      await this.log('Getting releases available from Minecraft...');
      const response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest.json');
      minecraftVersions = response.data;
      minecraftVersions.versions.forEach(version => {
        if (version.type === 'release') {
          releaseVersions.push(version);
        } else if (version.type === 'snapshot') {
          snapshotVersions.push(version);
        }
      });
      this.properties.versions = {
        installed: this.properties.versions.installed || [],
        latest: minecraftVersions.latest,
        release: releaseVersions,
        snapshot: snapshotVersions
      };
      await this.log('Got releases from Minecraft.');
      return this.properties.versions;
    } catch (err) {
      await this.log('An error occurred getting release information from Minecraft.');
      await this.log(err.stack);
      throw err;
    }
  }

  async getOps () {
    const properties = this.properties;
    const minecraftDirectory = properties.settings.minecraftDirectory;
    try {
      await this.log('Getting MinecraftServer ops...');
      if (properties.installed) {
        properties.ops = await fs.readJSON(path.join(minecraftDirectory, 'ops.json'));
      } else {
        await this.log('Minecraft not installed.');
      }
    } catch (err) {
      properties.ops = [];
      await this.log('Failed to read ops.json:');
      await this.log(err.stack);
      throw err;
    }
  }

  async getServerProperties () {
    const minecraftDirectory = this.properties.settings.minecraftDirectory;
    try {
      await this.log('Getting MinecraftServer properties...');
      if (this.properties.installed) {
        const serverPropertiesFile = await fs.readFile(path.join(minecraftDirectory, 'server.properties'), 'utf8');
        this.properties.serverProperties = Util.convertPropertiesToObjects(serverPropertiesFile);
        this.properties.worldName = this.properties.serverProperties.find(item => item.name === 'level-name').value;
      } else {
        await this.log('Minecraft not installed.');
      }
    } catch (err) {
      this.properties.serverProperties = [];
      await this.log('Failed to read server.properties:');
      await this.log(err.stack);
      throw err;
    }
  }

  async getUserCache () {
    const properties = this.properties;
    const minecraftDirectory = properties.settings.minecraftDirectory;
    try {
      await this.log('Getting MinecraftServer user cache...');
      if (properties.installed) {
        properties.userCache = await fs.readJSON(path.join(minecraftDirectory, 'usercache.json'));
      }
    } catch (err) {
      properties.userCache = [];
      await this.log('Failed to read Minecraft usercache.json:');
      await this.log(err.stack);
      throw err;
    }
  }

  async getWhitelist () {
    const properties = this.properties;
    const minecraftDirectory = properties.settings.minecraftDirectory;
    try {
      await this.log('Getting MinecraftServer whitelist...');
      if (properties.installed) {
        properties.whitelist = await fs.readJSON(path.join(minecraftDirectory, 'whitelist.json'));
      }
    } catch (err) {
      properties.whitelist = [];
      await this.log('Failed to read whitelist.json:');
      await this.log(err.stack);
      throw err;
    }
  }

  async install (version = 'latest', newWorld = false) {
    const serverJar = this.properties.settings.serverJar;
    const serverJarPath = path.join(this.properties.settings.minecraftDirectory, serverJar);
    let download = true;
    let release = {};

    try {
      if (!this.properties.versions || !this.properties.versions.latest || !this.properties.versions.latest.release) {
        await this.getMinecraftVersions();
      }
      if (version === 'latest') {
        version = this.properties.versions.latest.release;
      }
      // Get the release info for the version specified.
      this.properties.versions.release.forEach(releaseVersion => {
        if (releaseVersion.id === version) {
          release = releaseVersion;
        }
      });

      if (!release || !release.id) {
        await this.log(`Invalid version ${version} specified.`);
        return;
      }

      const releaseJarName = `${release.id}_minecraft_${this.properties.settings.serverJar}`;
      const releaseJarPath = path.join(this.properties.settings.minecraftDirectory, releaseJarName);

      // Make sure we have an up to date list of available jars from disk.
      await this.detectMinecraftJar();
      // See if we have already downloaded the requested version.
      if (this.properties.versions.installed.length > 0) {
        for (const installedVersion of this.properties.versions.installed) {
          if (installedVersion.indexOf(release.id) !== -1) {
            // already downloaded.
            download = false;
            await this.log('Release to install is already downloaded.');
            break;
          }
        }
      }

      if (download) {
        await this.downloadRelease(release.id);
      }
      if (this.properties.started) {
        await this.stop();
      }
      if (this.properties.detectedVersion && this.properties.detectedVersion.full) {
        await this.log(`Deleting Minecraft server version: ${this.properties.detectedVersion.full}...`);
        await fs.remove(serverJarPath);
      }

      await this.log(`Installing MinecraftServer version ${version}...`);
      await fs.copyFile(releaseJarPath, serverJarPath);
      await this.log(`Done installing Minecraft server version ${version}.`);

      // TODO: Only create new world on downgrade and use `newWorld` argument.
      // Right now this deletes the world upon any installation.
      await this.newWorld(false);

      this.properties.installed = true;
      this.properties.needsInstallation = false;
    } catch (err) {
      this.properties.installed = false;
      this.properties.needsInstallation = true;
      await this.log('An error occurred during installation of Minecraft server.');
      await this.log(err.stack);
      throw err;
    }
  }

  /**
   * Gets the Minecraft commands available via `/help`.
   */
  async listCommands () {
    const rconPassword = this.properties.serverProperties.find(({name}) => name === 'rcon.password').value;
    this.properties.fullHelp = [];
    this.properties.rawHelp = [];
    
    try {
      if (!this.properties.rconClient || !this.properties.rconClient.configured || this.properties.rconClient.client.destroyed) {
        await this.getRconClient();
      }
      await this.properties.rconClient.login(rconPassword);
  
      await this.log('Listing available Minecraft commands.');
      let response = await this.properties.rconClient.command('help');
  
      // Versions prior to 1.13 "page" the help, so get it all at once.
      if (response.body.indexOf('Showing help page') !== -1) {
        const part1 = response.body.split('Showing help page ');
        const part2 = part1[1].split(' ');
        const helpPages = parseInt(part2[2]);
  
        for (let page = 1; page <= helpPages; page++) {
          // Get all of the help at once
          let helpPage = await this.properties.rconClient.command(`help ${page}`);
          this.properties.rawHelp.push(helpPage.body);
        }
      } else {
        this.properties.rawHelp.push(response.body);
      }
  
      await this.parseHelpOutput();
    } catch (err) {
      await this.log('An error occurred listing commands.');
      await this.log(err.stack);
      throw err;
    }
  }

  /**
   * Gets the connected players.
   */
  async listPlayers () {
    const rconPassword = this.properties.serverProperties.find(({name}) => name === 'rcon.password').value;
    let outputLines = [];
    let playersList = {
      summary: '',
      players: []
    };
    let playerCount = 0;

    try {
      await this.log('Listing Minecraft players.');
  
      if (!this.properties.userCache) {
        await this.getUserCache();
      }
      if (!this.properties.rconClient || !this.properties.rconClient.configured || this.properties.rconClient.client.destroyed) {
        await this.getRconClient();
      }
      await this.properties.rconClient.login(rconPassword);
      let response = await this.properties.rconClient.command('list');
      outputLines = response.body;
  
      if (outputLines.indexOf('players online:') !== -1) {
        let playersSummary = outputLines.split('players online:');
        if (playersSummary) {
          playersList.summary = `${playersSummary[0]} players online`;
          let players = playersSummary[1].split(',');
          players.forEach(async playerName => {
            if (playerName) {
              playerCount++;
              let player = {
                key: playerCount,
                name: playerName.trim(),
                online: true
              };
              if (this.properties.userCache && this.properties.userCache.length) {
                this.properties.userCache.forEach(cachedPlayer => {
                  if (cachedPlayer.name === player.name) {
                    player.key = cachedPlayer.uuid;
                  }
                });
              }
              player.banned = await this.determineBanStatus(player);
              player.opped = await this.determineOpStatus(player);
              player.whitelisted = await this.determineWhitelistStatus(player);
              playersList.players.push(player);
            }
          });
        }
      } else {
        playersList.summary = outputLines.trim().slice(0, -1);
      }
  
      this.properties.playerInfo = playersList;
      return playersList;
    } catch (err) {
      await this.log(err.stack);
      throw err;
    }
  }

  async listPlayersViaStdOut () {
    const properties = this.properties;
    const serverProcess = properties.serverProcess;
    const started = properties.started;
    let playersList = {
      summary: '',
      players: []
    };
    let foundCachedPlayer = false;
    let players;
    const minecraftLogTimeRegex = /\[[0-2]?[0-9]:[0-5]?[0-9]:[0-5]?[0-9]\] /;
    const minecraftLogPrefixRegex = /\[\w*\s\w*\/\w*\]:/;
    let outputLines = [];
    let outputString = '';
    try {
      await this.log('Listing Minecraft players.');
      if (started && properties.serverProcess && properties.serverProcess.pid) {
        // debugger; // to go join for testing
        await this.attachToMinecraft();
        serverProcess.stdin.write(`/list${os.EOL}`);

        while (!properties.serverOutput.length) {
          await this.waitForBufferToBeFull();
        }

        // Output buffer could be array of arrays, so combine into something usable.
        if (Array.isArray(properties.serverOutput) && properties.serverOutput.length) {
          outputString = properties.serverOutput.join('\n');
          outputLines = outputString.split('\n');
        }

        // First line is the summary,
        // followed by line(s) of player names, comma+space separated.
        for (let line of outputLines) {
          // Take off the timestamp bits.
          line = line.split(minecraftLogTimeRegex)[1];
          // Take off the logging prefix bits.
          line = line.split(minecraftLogPrefixRegex)[1];
          // Nuke preceding and trailing whitespace.
          line = line.trim();

          if (line !== '') {
            if (line.indexOf('players online') !== -1) {
              playersList.summary = line.trim().slice(0, -1);
              continue;
            }

            players = line.split(',');
            for (let player of players) {
              player = {
                name: player.trim(),
                online: true
              };
              for (const cachedPlayer of this.properties.userCache) {
                if (cachedPlayer.name === player.name) {
                  player.key = cachedPlayer.uuid;
                }
              }
              player.banned = await this.determineBanStatus(player);
              player.opped = await this.determineOpStatus(player);
              player.whitelisted = await this.determineWhitelistStatus(player);
              playersList.players.push(player);
            }
          }
        }

        await this.detachFromMinecraft();

        // Add cached "offline" users.
        for (const cachedPlayer of this.properties.userCache) {
          cachedPlayer.key = cachedPlayer.uuid;
          cachedPlayer.banned = await this.determineBanStatus(cachedPlayer);
          cachedPlayer.opped = await this.determineOpStatus(cachedPlayer);
          cachedPlayer.whitelisted = await this.determineWhitelistStatus(cachedPlayer);
          cachedPlayer.online = false;

          if (playersList.players.length) {
            foundCachedPlayer = false;
            for (const player of playersList.players) {
              if (cachedPlayer.name === player.name) {
                foundCachedPlayer = true;
              }
            }
            if (!foundCachedPlayer) {
              playersList.players.push(cachedPlayer);
            }
          } else {
            playersList.players.push(cachedPlayer);
          }
        }
      }
    } catch (err) {
      await this.detachFromMinecraft();
      await this.log('An error occurred listing Minecraft players.');
      await this.log(err.stack);
      playersList = { players: [], summary: '' };
      return playersList;
    }
    properties.playerInfo = playersList;
    return playersList;
  }

  async listWorldBackups () {
    const properties = this.properties;
    const settings = properties.settings;
    const backupDir = path.resolve(settings.backups.path);
    const backupList = [];
    let files = [];

    try {
      await this.log('Getting list of MinecraftServer world backups...');
      properties.backupList = [];
      files = await fs.readdir(backupDir);
      files.forEach(file => {
        let fileInfo;
        const fileItem = {};
        const fileParts = file.split('.');

        if (fileParts[1] === 'zip') {
          fileInfo = fileParts[0].split('_');
          fileItem.fileName = file;
          fileItem.worldName = fileInfo[0];
          fileItem.date = fileInfo[1];
          fileItem.time = fileInfo[2];
          backupList.push(fileItem);
        }
      });
      properties.backupList = backupList;
    } catch (err) {
      await this.log('An error occurred listing world backups.');
      await this.log(err.stack);
      properties.backupList = [];
    }

    return properties.backupList;
  }

  async deleteWorldBackups () {
    const properties = this.properties;
    const settings = properties.settings;
    const backupDir = path.resolve(settings.backups.path);

    try {
      await this.listWorldBackups();
      for (const backup of properties.backupList) {
        await fs.remove(path.resolve(path.join(backupDir, backup.fileName)));
      }
      await this.listWorldBackups();
    } catch (err) {
      await this.log('An error occurred deleting world backups.');
      await this.log(err.stack);
      throw err;
    }
  }

  async newWorld (backupWorld = false) {
    try {
      await this.log(`Deleting MinecraftServer world. Backup: ${backupWorld}`);

      const properties = this.properties;
      const minecraftDirectory = properties.settings.minecraftDirectory;
      let worldName = '';
      let worldPath = '';
      let minecraftWasRunning = false;

      for (const item in properties.serverProperties) {
        if (item.name === 'level-name') {
          worldName = item.value;
          break;
        }
      }
      if (!worldName) {
        worldName = 'world';
      }
      worldPath = path.resolve(path.join(minecraftDirectory, worldName));

      if (await fs.pathExists(worldPath)) {
        if (properties.started) {
          minecraftWasRunning = true;
          await this.stop();
        }
        if (backupWorld) {
          await this.backupWorld();
        }
        await this.log(`World to be deleted: ${worldName} @ ${worldPath}`);
        await fs.remove(worldPath);
        await this.log(`World ${worldName} deleted.`);
        if (minecraftWasRunning) {
          await this.startMinecraftProcess();
        }
      }
    } catch (err) {
      await this.log('An error occurred creating a new world.');
      await this.log(err.stack);
      throw (err);
    }
  }

  async parseHelpOutput () {
    await this.log('Parsing help output.');
    const properties = this.properties;
    const minecraftRawHelp = properties.rawHelp;
    let helpLine = 0;
    
    minecraftRawHelp.forEach(lineOfHelp => {
      // lineOfHelp = "--- Showing help page 1 of 9 (/help <page>) ---/achievement <give|take> <name|*> [player]/ban <name> [reason ...]/ban-ip <address|name> [reason ...]/banlist [ips|players]/blockdata <x> <y> <z> <dataTag>/clear [player] [item] [data] [maxCount] [dataTag]/clone <x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z> [maskMode] [cloneMode]Tip: Use the <tab> key while typing a command to auto-complete the command or its arguments"
      if (lineOfHelp) {
        const commandSets = lineOfHelp.split('---');
        commandSets.forEach(commandSet => {
          // "/achievement <give|take> <name|*> [player]/ban <name> [reason ...]/ban-ip <address|name> [reason ...]/banlist [ips|players]/blockdata <x> <y> <z> <dataTag>/clear [player] [item] [data] [maxCount] [dataTag]/clone <x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z> [maskMode] [cloneMode]Tip: Use the <tab> key while typing a command to auto-complete the command or its arguments"
          if (commandSet && commandSet.indexOf('/') === 0) {
            const commandsInTheLine = commandSet.split(/\//);
            commandsInTheLine.forEach(command => {
              if (command && command.indexOf(' OR ') === -1) {
                // Some commands have alternate optional arguments. Skip getting those for now.
                helpLine++;
                const aCommand = {
                  key: helpLine,
                  command: `/${command}`
                };
                this.properties.fullHelp.push(aCommand);
              }
            });
          }
        });
      }
    });
    await this.log(`Done parsing help output. Got ${this.properties.fullHelp.length} entries.`);
  }

  /**
   * Parses extra help formats.
   */
  async parseOptionalHelpOutput () {
    await this.log('Parsing help output.');
    const properties = this.properties;
    const minecraftFullHelp = properties.rawHelp;
    const minecraftOutput = properties.serverOutput;
    let line;

    while ((line = minecraftOutput.shift()) !== undefined) {
      let command = {};
      const commandLine = line.split(' [Server thread/INFO]: ');

      if (commandLine.length > 1 && commandLine[1].indexOf('/') === 0) {
        const aThing = {
          key: minecraftFullHelp.length,
          command: commandLine[1]
        };
        this.properties.fullHelp.push(aThing);
        const commandLineSpaces = commandLine[1].split(' ');
        const args = [];
        let commands = [];

        command = {
          command: commandLineSpaces[0].substr(commandLineSpaces[0].indexOf('/') + 1)
        };

        commandLineSpaces.shift();

        if (commandLine[1].indexOf(' OR ') !== -1) {
          commands = commandLine[1].split(' OR ');
        } else {
          commands.push(commandLine[1]);
        }

        args.length = 0;
        for (const c of commands) {
          const things = this.getCommand(c, true, false);
          for (const thing of things) {
            args.push(thing);
          }
        }
        if (args.length) {
          const requiredArgs = new Set(args);
          command.requiredArgs = Array.from(requiredArgs);
        }

        args.length = 0;
        for (const c of commands) {
          const things = this.getCommand(c, false, true);
          for (const thing of things) {
            args.push(thing);
          }
        }
        if (args.length) {
          const optionalArgs = new Set(args);
          command.optionalArgs = Array.from(optionalArgs);
        }

        properties.allowedCommands.push(command);
      }
    }
    // await this.log(`Got fullHelp: ${JSON.stringify(this.properties.fullHelp)}`);
  }

  /**
     * Executes a Minecraft command against the Minecraft server.
     * @param {string} command - A Minecraft command to execute.
     * @return {string} output - The output from the command.
     */
  async runCommand (command) {
    // TODO: make sure command passed is valid
    const rconPassword = this.properties.serverProperties.find(({name}) => name === 'rcon.password').value;
    const properties = this.properties;
    const started = properties.started;

    if (started) {
      if (!this.properties.rconClient || !this.properties.rconClient.configured || this.properties.rconClient.client.destroyed) {
        await this.getRconClient();
      }
      await this.log(`Running Minecraft command: ${command}`);
      await this.properties.rconClient.login(rconPassword);
      let response = await this.properties.rconClient.command(`${command}`);  
      return response.body;
    } else {
      throw new Error('Minecraft is not running.');
    }
  }

  /**
     * Executes a Minecraft command against the Minecraft server.
     * @param {string} command - A Minecraft command to execute.
     * @return {string} output - The output from the command.
     */
  async runCommandFromStdOut (command) {
    // TODO: make sure command passed is valid
    const properties = this.properties;
    const serverOutput = properties.serverOutput;
    const serverProcess = properties.serverProcess;
    const started = properties.started;
    const minecraftLogTimeRegex = /\[[0-2]?[0-9]:[0-5]?[0-9]:[0-5]?[0-9]\] /;
    const minecraftLogPrefixRegex = /\[\w*\s\w*\/\w*\]:/;
    let outputLines = [];
    let outputString = '';

    try {
      await this.log(`Running Minecraft command: ${command}`);
      if (started) {
        await this.attachToMinecraft();
        serverProcess.stdin.write(`${command}${os.EOL}`);
        while (serverOutput.length <= 0) {
          await this.waitForBufferToBeFull();
        }
        // Output buffer could be array of arrays, so combine into something usable.
        if (Array.isArray(this.properties.serverOutput) && this.properties.serverOutput.length) {
          outputString = this.properties.serverOutput.join('\n');
          outputLines = outputString.split(os.EOL);
        }
        await this.detachFromMinecraft();
        for (let l = 0; l < outputLines.length; l++) {
          // Take off the timestamp bits.
          outputLines[l] = outputLines[l].split(minecraftLogTimeRegex)[1];
          // Take off the logging prefix bits.
          outputLines[l] = outputLines[l].split(minecraftLogPrefixRegex)[1];
          // Nuke preceding and trailing whitespace.
          outputLines[l] = outputLines[l].trim();
        }
        const output = outputLines.join(os.EOL);
        return output;
      } else {
        throw new Error('Minecraft is not running.');
      }
    } catch (err) {
      await this.detachFromMinecraft();
      throw err;
    }
  }

  /**
   * Saves server properties to disk for use on Minecraft server start.
   * @param {object} newProperties Contains the new properties to save to disk.
   */
  async saveProperties (newProperties) {
    await this.log('Saving new Minecraft server.properties file.');

    const contents = Util.convertObjectsToProperties(newProperties);
    const backupDir = path.resolve(this.properties.settings.backups.path);
    const propertiesFile = path.resolve(path.join(this.properties.settings.minecraftDirectory, 'server.properties'));
    const backupPropertiesFileName = `${Util.getDateTime()}-server.properties`;
    const backupPropertiesFile = path.join(backupDir, backupPropertiesFileName);
    let minecraftWasRunning = false;

    if (this.properties.started) {
      minecraftWasRunning = true;
      await this.stop();
    }

    // Backup current properties file
    await fs.ensureDir(path.dirname(backupPropertiesFile));
    await fs.copyFile(propertiesFile, backupPropertiesFile);
    await fs.writeFile(propertiesFile, contents);
    await this.getServerProperties();
    if (minecraftWasRunning) {
      await this.startMinecraftProcess();
    }
  }

  /**
   * Enables the remote console feature of the Minecraft Server for better command handling.
   * Generates a random password for connections.
   * Sets the port to listen on to 25575.
   */
  async enableRemoteConsole () {
    let foundRcon = null;
    let foundRconPassword = null;
    let foundRconPort = null;
    let changedSetting = false;

    await this.log('Enabling Minecraft remote console...');

    if (!this.properties.serverProperties || !this.properties.serverProperties.length) {
      await this.getServerProperties();
    }

    if (!this.rconEnabled()) {
      if (this.properties.serverProperties && this.properties.serverProperties.length) {
        const password = crypto.randomBytes(32).toString('hex');
        foundRcon = this.properties.serverProperties.find(({name}) => name === 'enable-rcon');
        foundRconPassword = this.properties.serverProperties.find(({name}) => name === 'rcon.password');
        foundRconPort = this.properties.serverProperties.find(({name}) => name === 'rcon.port');
        
        if (foundRcon && !foundRcon.value) {
          foundRcon.value = true;
          changedSetting = true;
        }
        if (foundRconPassword && foundRconPassword.value == null) {
          foundRconPassword.value = password;
          changedSetting = true;
        }
        if (foundRconPort && foundRconPort.value != 25575) {
          foundRconPort.value = 25575
          changedSetting = true;
        }
  
        if (!foundRcon) {
          this.properties.serverProperties.push({name: 'enable-rcon', value: 'true'});
          changedSetting = true;
        }
        if (!foundRconPassword) {
          this.properties.serverProperties.push({name: 'rcon.password', value: password});
          changedSetting = true;
        }
        if (!foundRconPort) {
          this.properties.serverProperties.push({name: 'rcon.port', value: 25575});
          changedSetting = true;
        }
      }
      if (changedSetting) {
        await this.saveProperties(this.properties.serverProperties);
      }
    }
  }

  /**
   * Disables the remote console feature of the Minecraft Server.
   */
  async disableRemoteConsole () {
    let serverProperties = this.properties.serverProperties;
    let foundRcon = false;
    let changedSetting = false;
    for (let item in serverProperties) {
      if (item.name === 'enable-rcon') {
        foundRcon = true;
        if (!item.value) {
          item.value = false;
          changedSetting = true;
        }
      }
    }
    if (!foundRcon) {
      serverProperties.push({name: 'enable-rcon', value: 'false'});
      changedSetting = true;
    }
    if (changedSetting) {
      await this.saveProperties(serverProperties);
    }
  }
  
  /**
   * Returns if RCON is enabled in the Minecraft Server configuration.
   */
  rconEnabled () {
    const foundRcon = this.properties.serverProperties.find(({name}) => name === 'enable-rcon');
    return foundRcon ? foundRcon.value : null;
  }

  /**
   * Gets a RCON client.
   */
  async getRconClient () {
    const rconPassword = this.properties.serverProperties.find(({name}) => name === 'rcon.password').value;
    const rconPort = this.properties.serverProperties.find(({name}) => name === 'rcon.port').value;
    try {
      this.properties.rconClient = new RCONClient({host: '127.0.0.1', port: rconPort, password: rconPassword});
      this.properties.rconClient.configured = true;
    } catch (err) {
      this.properties.rconClient.configured = false;
      await this.log('An error occurred connecting to the remote console.');
      await this.log(err);
      throw err;
    }
  }

  /**
   * Starts the Minecraft server process.
   */
  async startMinecraftProcess () {
    if (this.properties.installed) {
      if (this.properties.serverProcess && !this.properties.serverProcess.killed) {
        return {
          message: 'Minecraft is already running.'
        };
      }

      if (this.properties.settings.javaPath) {
        if (!this.properties.starting) {
          this.properties.starting = true;
          await this.log(`Starting MinecraftServer with ${this.properties.settings.memory.maximum}${this.properties.settings.memory.units}B memory...`);
          // TODO: Make the Java + args configurable
          this.properties.serverProcess = spawn(this.properties.settings.javaPath, [
            `-Xmx${this.properties.settings.memory.maximum}${this.properties.settings.memory.units}`,
            `-Xms${this.properties.settings.memory.minimum}${this.properties.settings.memory.units}`,
            '-jar',
            this.properties.settings.serverJar,
            'nogui'
          ], {
            cwd: this.properties.settings.minecraftDirectory,
            stdio: [
              'pipe', // Use parent's stdin for child stdin
              'pipe', // Pipe child's stdout to parent stdout
              'pipe' // Direct child's stderr to parent stderr
            ]
          });


          await this.checkForMinecraftToBeStarted();
          await this.log('MinecraftServer.start: Minecraft started.');
        } else {
          await this.log('Minecraft is already starting up.');
          return {
            message: 'Minecraft is already starting up.'
          };
        }
      } else {
        await this.log('Java not detected.');
        throw new Error('Java not detected.');
      }
    } else {
      throw new Error('Minecraft is not installed.');
    }
  }
  
  async start () {
    try {
      await this.startMinecraftProcess();
      if (!this.rconEnabled()) {
        await this.enableRemoteConsole();
      }
      await Util.wait(10);
      await this.getEula();
      await this.listCommands();
    } catch (err) {
      await this.log('An error occurred starting the Minecraft server.');
      await this.log(err.stack);
      throw err;
    }
  }

  /**
   * Stops the Minecraft server process.
   */
  stopMinecraftProcess () {
    if (this.properties.serverProcess && !this.properties.serverProcess.killed) {
      this.properties.serverProcess.kill();
      this.properties.stopping = false;
      this.properties.started = false;
      this.properties.starting = false;
      this.properties.stopped = true;
    }
  }

  async stop (force = false) {
    await this.log('Stopping MinecraftServer...');
    
    if (this.properties.starting) {
      force = true;
    }
    
    if (this.properties.started && !force) {
      if (!this.properties.stopping) {
        this.properties.stopping = true;
        if (this.properties.rconClient.configured) {
          // Gracefully stop Minecraft.
          const rconPassword = this.properties.serverProperties.find(({name}) => name === 'rcon.password').value;
          await this.getRconClient();
          await this.properties.rconClient.login(rconPassword);
          await this.properties.rconClient.command('/stop');
          this.stopMinecraftProcess();
        } else {
          // Not-so-gracefully stop Minecraft.
          this.stopMinecraftProcess();
        }
      } else {
        return {
          message: 'Minecraft is already shutting down.'
        };
      }
    } else {
      // Kill all the things.
      await this.log('Forcing shutdown of MinecraftServer.');
      if (this.properties.serverOutputCaptured) {
        await this.detachFromMinecraft();
      }
      await Util.saveSettings(this.properties.settingsFileName, this.properties.settings);
      this.stopMinecraftProcess();
      await this.log('Force shutdown complete.');
    }

    if (this.properties.rconClient && this.properties.rconClient.configured) {
      this.properties.rconClient.destroy();
    }
  }

  /**
     * Reads the current state of files from the Minecraft server and gets
     * player status if running.
     */
  async updateStatus () {
    const properties = this.properties;
    await this.log('Updating Minecraft status.');
    if (properties.installed && properties.acceptedEula) {
      await Promise.all([
        this.checkForMinecraftUpdate(),
        this.getServerProperties(),
        this.getUserCache(),
        this.getOps(),
        this.getBannedIps(),
        this.getBannedPlayers(),
        this.getWhitelist()
      ]);
      if (properties.started && properties.serverProcess && properties.serverProcess.pid) {
        await this.listPlayers();
      }
    } else {
      await this.checkForMinecraftUpdate();
    }
  }

  async attachToMinecraft () {
    // TODO: Figure out a blocking+retry mechanism... for example listPlayers and runCommand could race here.
    // potentially a `return attached` that the caller can wait for. still might have a race condition though...
    // and that may break methods that call here twice (checkForMinecraftToBeStarted is one).
    if (this.properties.serverProcess && this.properties.serverProcess.pid && !this.properties.serverOutputCaptured) {
      await this.log('Attaching to Minecraft output.');
      this.properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
      this.properties.serverOutput.length = 0;
      this.properties.serverProcess.stdout.addListener('data', this.bufferMinecraftOutput);
      this.properties.serverOutputCaptured = true;
    } else {
      await this.log('It appears someone is trying to attach to the Minecraft output but someone else needs to let go first.');
      console.trace()
      throw new Error('Already attached to Minecraft.');
    }
  }

  async detachFromMinecraft () {
    await this.log('Detaching from Minecraft output.');
    if (!this.properties.serverOutputCaptured) {
      await this.log('WARNING: Trying to detach from Minecraft output but it appears no one was attached to begin with...');
      await this.log(console.trace());
    }
    if (this.properties.serverProcess && this.properties.serverProcess.pid) {
      this.properties.serverProcess.stdout.removeListener('data', this.bufferMinecraftOutput);
    }
    this.properties.serverOutput.length = 0;
    this.properties.serverOutputCaptured = false;
  }

  bufferMinecraftOutput (data) {
    this.properties.serverOutput.push(data.toString().trim());
  }

  /**
     * Watches the Minecraft stdout lines. If they stop growing, return.
     */
  async waitForBufferToBeFull (time, max = 30) {
    const properties = this.properties;
    const serverOutput = properties.serverOutput;
    const length = serverOutput.length + 0;

    if (!time) {
      time = 2;
    }

    await this.log('Waiting on Minecraft buffer...');
    await Util.wait(time);
    if (properties.serverOutputCaptured) {
      if (serverOutput.length && serverOutput.length != length) {
        await this.log(`Minecraft buffer appers to be full with ${serverOutput.length} entries.`);
      } else {
        if (time < max) {
          await this.waitForBufferToBeFull(1, time - 1);
        }
      }
    } else {
      await this.log('Lost the connection to the Minecraft buffer.');
    }
  }

  /**
     * Logs things to a file.
     * @param {string} data The data to log.
     */
  async log (data) {
    await Util.log(data, 'minecraft-server.log');
  }

  /**
     * Clears the log file.
     */
  async clearLog () {
    try {
      await Util.clearLog('minecraft-server.log');
    } catch (err) {
      throw err;
    }
  }
}

module.exports = MinecraftServer;

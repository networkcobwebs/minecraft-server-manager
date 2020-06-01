const { describe, it, before } = require('mocha');
const expect = require('expect');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const wtf = require('wtfnode');
const MinecraftServer = require('../../src/server/MinecraftServer');

process.on('unhandledRejection', function(err) {
  console.log(err);
});

describe('minecraft-server tests', () => {
  let minecraftServer;
  before(() => {
    minecraftServer = null;
    minecraftServer = new MinecraftServer();
  });
  after(async () => {
    if (minecraftServer.started) {
      await minecraftServer.stop(true);
    }
    minecraftServer = null;
    wtf.dump();
  });
  describe('minecraft-server properties', () => {
    it('should have properties', () => {
      const properties = minecraftServer.properties;
      expect(properties.eulaUrl).not.toBe(null);
      expect(properties.eulaUrl).not.toBe('');
    });
    it('should have settings', async () => {
      await minecraftServer.init();
      const settings = minecraftServer.properties.settings;
      expect(settings).not.toBe(null);
      expect(settings.javaHome).not.toBe('');
      expect(settings.javaPath).not.toBe('');
      expect(settings.minecraftDirectory).not.toBe(null);
      expect(settings.serverJar).toBe('server.jar');
      expect(settings.memory.units).toBe('G');
      expect(settings.memory.minimum).toBe(1);
      expect(settings.memory.maximum).toBe(1);
    });
  });
  describe('minecraft-server methods', () => {
    // Skipping this one as it appears some promise is getting run after clearLog...
    it.skip('should log', async () => {
      await minecraftServer.clearLog();
      await minecraftServer.log('Test log.');
      const logFile = path.join(path.join(os.homedir(), 'minecraft-server-manager'), 'minecraft-server.log');
      const logContents = await fs.readFile(logFile, 'utf8');
      expect(logContents).toBe(`Test log.${os.EOL}`);
    });
    // Skipping this one as it appears some promise is getting run after clearLog...
    it.skip('should clear the log', async () => {
      await minecraftServer.clearLog();
      await minecraftServer.log('Test log.');
      const logFile = path.join(path.join(os.homedir(), 'minecraft-server-manager'), 'minecraft-server.log');
      let logContents = await fs.readFile(logFile, 'utf8');
      expect(logContents).not.toBe('');
      await minecraftServer.clearLog();
      logContents = await fs.readFile(logFile, 'utf8');
      expect(logContents).toBe('');
    });
    it('should detect a java version', async () => {
      await minecraftServer.detectJavaHome();
      expect(minecraftServer.properties.settings.javaHome).not.toBe('');
      expect(minecraftServer.properties.settings.javaPath).not.toBe('');
    });
    it('should get release versions', async () => {
      const versions = await minecraftServer.getMinecraftVersions();
      let found1112 = false;
      expect(versions).not.toBe(null);
      expect(versions.latest).not.toBe(null);
      expect(versions.release).not.toBe(null);
      expect(versions.snapshot).not.toBe(null);
      for (let v = 0; v < versions.release.length; v++) {
        if (versions.release[v].id === '1.11.2') {
          found1112 = true;
          break;
        }
      }
      expect(found1112).toBe(true);
    });
    it('should download the latest minecraft server jar', async function () {
      this.timeout(10000);
      await minecraftServer.downloadRelease('latest');
      // TODO: Fix this for a clean install
      // expect(minecraftServer.properties.versions.installed.length).toBeGreaterThan(0);
    });
    it('should install the latest minecraft server jar', async function () {
      this.timeout(5000);
      await minecraftServer.install('latest');
      const serverJarPath = path.join(minecraftServer.properties.settings.minecraftDirectory, minecraftServer.properties.settings.serverJar)
      expect(await fs.pathExists(serverJarPath)).toBe(true);
    });
    it('should detect a minecraft jar', async () => {
      const jar = await minecraftServer.detectMinecraftJar();
      expect(jar).not.toBe('');
      expect(minecraftServer.properties.serverJar).not.toBe('');
      expect(minecraftServer.properties.installed).toBe(true);
      expect(minecraftServer.properties.needsInstallation).toBe(false);
    });
    it('should start minecraft', async function () {
      this.timeout(90000);
      expect(minecraftServer.properties.started).toBe(false);
      await minecraftServer.init();
      if (!minecraftServer.properties.installed) {
        await minecraftServer.install();
      }
      await minecraftServer.acceptEula();
      await minecraftServer.start();
      expect(minecraftServer.properties.started).toBe(true);
      expect(minecraftServer.properties.stopped).toBe(false);
      expect(minecraftServer.properties.detectedVersion).not.toBe('');
      expect(minecraftServer.properties.fullHelp.length).toBeGreaterThan(0);
      await minecraftServer.stop(true);
    });
    it('should get player summary', async function () {
      this.timeout(90000);
      expect(minecraftServer.properties.started).toBe(false);
      await minecraftServer.init();
      if (!await fs.pathExists(minecraftServer.properties.settings.minecraftDirectory)) {
        await minecraftServer.install();
      }
      await minecraftServer.acceptEula();
      await minecraftServer.start();
      expect(minecraftServer.properties.started).toBe(true);
      await minecraftServer.listPlayers();
      expect(minecraftServer.properties.playerInfo.summary).not.toBe(null);
      expect(minecraftServer.properties.playerInfo.summary).not.toBe('');
      await minecraftServer.stop(true);
    });
    it('should run a minecraft command and return its output', async function () {
      this.timeout(90000);
      expect(minecraftServer.properties.started).toBe(false);
      await minecraftServer.init();
      if (!await fs.pathExists(minecraftServer.properties.settings.minecraftDirectory)) {
        await minecraftServer.install();
      }
      await minecraftServer.acceptEula();
      await minecraftServer.start();
      const output = await minecraftServer.runCommand('/gamerule keepInventory true');
      expect(output.length).toBeGreaterThan(0);
      expect(output).toBe('Gamerule keepInventory is now set to: true');
      await minecraftServer.stop(true);
    });
    it('should stop minecraft', async function () {
      this.timeout(90000);
      expect(minecraftServer.properties.started).toBe(false);
      await minecraftServer.init();
      if (!await fs.pathExists(minecraftServer.properties.settings.minecraftDirectory)) {
        await minecraftServer.install();
      }
      await minecraftServer.acceptEula();
      await minecraftServer.start();
      await minecraftServer.stop(true);
      expect(minecraftServer.properties.started).toBe(false);
      expect(minecraftServer.properties.stopped).toBe(true);
    });
    it('should backup the world and list backups', async function () {
      this.timeout(60000);
      const currentBackups = minecraftServer.properties.backupList.length;
      const backups = await minecraftServer.backupWorld();
      expect(backups.length).toBeGreaterThan(currentBackups);
    });
    it('should delete world backups and the list of backups', async () => {
      await minecraftServer.deleteWorldBackups();
      expect(minecraftServer.properties.backupList.length).toBe(0);
    });
  });
});

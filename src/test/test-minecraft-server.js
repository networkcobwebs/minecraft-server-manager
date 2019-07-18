const expect = require('expect');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const MinecraftServer = require(path.resolve('src', 'server', 'minecraft-server'));

describe('minecraft-server tests', () => {
    describe('minecraft-server properties', () => {
        it('should have properties', () => {
            let minecraftServer = new MinecraftServer();
            let properties = minecraftServer.properties;
            expect(properties.eulaUrl).not.toBe(null);
            expect(properties.eulaUrl).not.toBe("");
        });
        it('should have settings', () => {
            let minecraftServer = new MinecraftServer();
            let settings = minecraftServer.properties.settings;
            expect(settings).not.toBe(null);
            expect(settings.javaHome).toBe("");
            expect(settings.javaPath).toBe("");
            expect(settings.minecraftDirectory).not.toBe(null);
            expect(settings.serverJar).toBe("server.jar");
            expect(settings.memory.units).toBe("G");
            expect(settings.memory.minimum).toBe(1);
            expect(settings.memory.maximum).toBe(1);
        });
    });
    describe('minecraft-server methods', () => {
        let minecraftServer;
        before(() => {
            minecraftServer = new MinecraftServer();
        });
        it('should clear the log', async () => {
            minecraftServer.log('Test log.');
            let logFile = path.resolve('minecraft-server.log');
            let logContents = await fs.readFile(logFile, "utf8");
            expect(logContents).not.toBe("");
            minecraftServer.clearLog();
            logContents = await fs.readFile(logFile, "utf8");
            expect(logContents).toBe("");
        });
        it('should log', async () => {
            await minecraftServer.clearLog();
            await minecraftServer.log('Test log.');
            let logFile = path.resolve('minecraft-server.log');
            let logContents = await fs.readFile(logFile, "utf8");
            expect(logContents).toBe(`Test log. ${os.EOL}`);
        });
        it('should detect a java version', async () => {
            await minecraftServer.detectJavaHome();
            expect(minecraftServer.properties.settings.javaHome).not.toBe("");
            expect(minecraftServer.properties.settings.javaPath).not.toBe("");
        });
        it('should detect a minecraft jar', async () => {
            let jar = await minecraftServer.detectMinecraftJar();
            expect(jar).not.toBe("");
            expect(minecraftServer.properties.serverJar).not.toBe("");
            expect(minecraftServer.properties.installed).toBe(true);
            expect(minecraftServer.properties.needsInstallation).toBe(false);
        });
        it('should backup the world and list backups', async () => {
            await minecraftServer.backupWorld();
            expect(minecraftServer.properties.backupList.length).toBeGreaterThan(0);
        });
        it('should delete world backups and list backups', async () => {
            await minecraftServer.deleteWorldBackups();
            expect(minecraftServer.properties.backupList.length).toBe(0);
        });
        it('should get release versions', async () => {
            let versions = await minecraftServer.getMinecraftVersions();
            let found1112 = false;
            expect(versions).not.toBe(null);
            expect(versions.latest).not.toBe(null);
            expect(versions.release).not.toBe(null);
            expect(versions.snapshot).not.toBe(null);
            for (v = 0; v < versions.release.length; v++) {
                if (versions.release[v].id === '1.11.2') {
                    found1112 = true;
                    break;
                }
            }
            expect(found1112).toBe(true);
        });
        it('should download the latest minecraft server jar', async () => {
            await minecraftServer.downloadRelease('latest');
            expect(minecraftServer.properties.versions.installed.length).toBeGreaterThan(0);
        });
        it('should start and stop minecraft', async () => {
            expect(minecraftServer.properties.started).toBe(false);
            await minecraftServer.init();
            await minecraftServer.start();
            expect(minecraftServer.properties.started).toBe(true);
            expect(minecraftServer.properties.stopped).toBe(false);
            await minecraftServer.stop();
            expect(minecraftServer.properties.started).toBe(false);
            expect(minecraftServer.properties.stopped).toBe(true);
        });
        it('should list players', async () => {
            await minecraftServer.init();
            await minecraftServer.start();
            await minecraftServer.listPlayers();
            expect(minecraftServer.properties.playerInfo.summary).not.toBe(null);
            expect(minecraftServer.properties.playerInfo.summary).not.toBe("");
            await minecraftServer.stop();
        });
        it('should run a minecraft command and return its output', async () => {
            await minecraftServer.init();
            await minecraftServer.start();
            let output = await minecraftServer.runCommand(`/gamerule keepInventory true`);
            expect(output.length).toBeGreaterThan(0);
            expect(output).toBe("Gamerule keepInventory is now set to: true");
            await minecraftServer.stop();
        });
    });
});

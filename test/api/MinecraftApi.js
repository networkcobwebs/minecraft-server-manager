const { describe, it, before } = require('mocha');
const expect = require('expect');
const MinecraftApi = require('../../src/api/MinecraftApi');

describe('minecraft-api tests', () => {
    let minecraftApi;
    before(() => {
        minecraftApi = null;
        minecraftApi = new MinecraftApi();
    });
    it('should init', async () => {
        await minecraftApi.init();
    });
    describe('minecraft-api properties', () => {
        it('should have properties', () => {
            let minecraftApi = new MinecraftApi();
            let properties = minecraftApi.properties;
            expect(properties.settings).not.toBe(null);
            expect(properties.nodeInfo.version).not.toBe("");
        });
        it('should have settings', () => {
            let minecraftApi = new MinecraftApi();
            let settings = minecraftApi.properties.settings;
            expect(settings).not.toBe(null);
            expect(settings.ipAddress).toBe("0.0.0.0");
            expect(settings.ipPort).toBe(3001);
            expect(settings.autoStartMinecraft).toBe(false);
        });
    });
    describe('minecraft-api methods', () => {
        it('should start and stop', async () => {
            minecraftApi.properties.settings.autoStartMinecraft = false;
            await minecraftApi.start();
            expect(minecraftApi.app).not.toBe(null);
            await minecraftApi.stop();
            minecraftApi.properties.webServer.close();
        });
    });
});

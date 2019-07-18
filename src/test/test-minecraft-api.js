const expect = require('expect');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const MinecraftApi = require(path.resolve('src', 'api', 'minecraft-api'));

describe('minecraft-api tests', () => {
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
});

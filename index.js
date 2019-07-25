const path = require('path');
const MinecraftApi = require(path.resolve(path.join('src', 'api', 'minecraft-api')));
const MinecraftServer = require(path.resolve('src', 'server', 'minecraft-server'));

let minecraftServer = new MinecraftServer();
let minecraftApi = new MinecraftApi(minecraftServer);

process.on('exit', () => {
    minecraftApi.stop();
    minecraftApi.properties.webServer.close();
});

(async function () {
    await minecraftApi.init();
    await minecraftApi.start();
})();

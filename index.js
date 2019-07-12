const path = require('path');
const MinecraftApi = require(path.resolve(path.join('src', 'api', 'minecraft-api')));
const MinecraftServer = require('./minecraft-server');

let minecraftServer = new MinecraftServer();
let minecraftApi = new MinecraftApi(minecraftServer);

minecraftApi.start();

process.on('exit', () => {
    minecraftApi.stop();
});

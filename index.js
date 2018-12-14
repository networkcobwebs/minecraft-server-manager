const MinecraftApi = require('./minecraft-api');
const MinecraftServer = require('./minecraft-server');

let minecraftServer = new MinecraftServer();
let minecraftApi = new MinecraftApi(minecraftServer);

minecraftApi.start();

process.on('exit', function() {
    // let minecraftApiProperties = minecraftApi.properties,
    //     minecraftServer = minecraftApiProperties.minecraftServer;
    // if (minecraftServer.properties.started) {
    //     minecraftServer.stop();
    // }
    minecraftApi.stop();
});

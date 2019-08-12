const path = require('path');
const MinecraftApi = require(path.resolve(path.join('src', 'api', 'MinecraftApi')));
const MinecraftServer = require(path.resolve('src', 'server', 'MinecraftServer'));

let minecraftServer = new MinecraftServer();
let minecraftApi = new MinecraftApi(minecraftServer);

process.on('exit', () => {
    minecraftApi.stop();
    minecraftApi.properties.webServer.close();
});

(async function () {
    try {
        await minecraftApi.init();
        await minecraftApi.start();
    } catch (err) {
        console.log(`Unable to start MinecraftApi.`);
        console.log(err);
        process.emit('exit');
    }
})();


Ext.define('MinecraftServerManager.view.minecraftserver.ServerController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.server',

    minecraftStatus: false,

    init: function() {

    },

    checkStatus: function() {
        var me = this,
            debugStatusTask = MinecraftServerManager.app.debugMinecraftStatus,
            statusTask = MinecraftServerManager.app.getMinecraftStatusTask;

        if (debugStatusTask) {
            console.log('Checking Minecraft server state...');
        }

        if (statusTask && !statusTask.stopped) {
            Ext.Ajax.request({
                url: 'http://localhost:3000/command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    command: '/getStatus'
                },
                jsonData: {
                    command: '/getStatus'
                },
                timeout: 5000,
                success: function (response) {
                    var result = JSON.parse(response.responseText);

                    me.minecraftStatus = result.response;
                    if (debugStatusTask) {
                        console.log('Minecraft Server online:', me.minecraftStatus);
                    }

                    if (!me.minecraftStatus) {
                        // Increase time of polling task
                        if (debugStatusTask) {
                            console.log('status task interval was ' + statusTask.interval);
                        }
                        statusTask.restart(statusTask.interval + 10000);
                        if (debugStatusTask) {
                            console.log('status task interval is ' + statusTask.interval);
                        }
                    } else if (me.minecraftStatus && statusTask.interval !== MinecraftServerManager.app.minecraftStatusPollInterval) {
                        // Reset time of polling task if needed
                        if (debugStatusTask) {
                            console.log('Resetting Minecraft server poller time from ' + statusTask.interval + ' to default ' + MinecraftServerManager.app.minecraftStatusPollInterval + '...');
                        }
                        statusTask.restart(MinecraftServerManager.app.minecraftStatusPollInterval);
                        if (debugStatusTask) {
                            console.log('Done resetting Minecraft server poller time.');
                        }
                    }
                },
                failure: function (response) {
                    if (MinecraftServerManager.app.devmode) {
                        console.log('Minecraft NodeJS Server offline?');
                        console.log(response);
                    }

                    me.minecraftStatus = false;
                    if (debugStatusTask) {
                        console.log('Minecraft Server online: ', me.minecraftStatus);
                    }

                    // Increase time of polling task
                    if (debugStatusTask) {
                        console.log('status task interval was ' + statusTask.interval);
                    }
                    statusTask.restart(statusTask.interval + 10000);
                    if (debugStatusTask) {
                        console.log('status task interval is ' + statusTask.interval);
                    }
                }
            });
        }
    },

    newWorld: function() {
        var worldName = '';
        // Get world name from minecraftServerPropertiesStore
        Ext.data.StoreManager.lookup('minecraftServerPropertiesStore').each(function (property) {
            // find level-name
            if (property.data.name === 'level-name'){
                worldName = property.data.value;
            }
        });
        Ext.Ajax.request({
            url: 'http://localhost:3000/command',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                command: '/newWorld',
                worldName: worldName
            },
            jsonData: {
                command: '/newWorld',
                worldName: worldName
            },
            timeout: 5000,
            success: function() {
                if (MinecraftServerManager.app.debug) {
                    console.log('Minecraft Server online.');
                }
            },
            failure: function(response) {
                if (MinecraftServerManager.app.devmode) {
                    console.log('Minecraft NodeJS Server offline?');
                    console.log(response);
                }
            }
        });
    },

    startMinecraft: function() {
        Ext.Ajax.request({
            url: 'http://localhost:3000/command',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                command: '/start'
            },
            jsonData: {
                command: '/start'
            },
            timeout: 5000,
            success: function() {
                if (MinecraftServerManager.app.debug) {
                    console.log('Minecraft Server started.');
                }
                MinecraftServerManager.app.getMinecraftStatusTask.start();
                MinecraftServerManager.app.getOpsTask.start();
                MinecraftServerManager.app.getPlayersTask.start();
            },
            failure: function(response) {
                if (MinecraftServerManager.app.devmode) {
                    console.log('Minecraft NodeJS Server offline?');
                    console.log(response);
                }
            }
        });
    },

    stopMinecraft: function() {
        Ext.Ajax.request({
            url: 'http://localhost:3000/command',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                command: '/stop'
            },
            jsonData: {
                command: '/stop'
            },
            timeout: 5000,
            success: function() {
                if (MinecraftServerManager.app.debug) {
                    console.log('Minecraft Server stopped.');
                }
                MinecraftServerManager.app.getMinecraftStatusTask.stop();
                MinecraftServerManager.app.getOpsTask.stop();
                MinecraftServerManager.app.getPlayersTask.stop();
            },
            failure: function(response) {
                if (MinecraftServerManager.app.devmode) {
                    console.log('Minecraft NodeJS Server offline?');
                    console.log(response);
                }
                MinecraftServerManager.app.getMinecraftStatusTask.stop();
                MinecraftServerManager.app.getOpsTask.stop();
                MinecraftServerManager.app.getPlayersTask.stop();
            }
        });
    }
});

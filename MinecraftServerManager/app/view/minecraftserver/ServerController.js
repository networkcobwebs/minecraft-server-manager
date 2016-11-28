
Ext.define('MinecraftServerManager.view.minecraftserver.ServerController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.server',

    minecraftStatus: false,

    init: function() {
        // var me = this;
        // me.checkStatus();
    },

    checkStatus: function() {
        var me = this,
            debugStatusTask = MinecraftServerManager.app.debugMinecraftStatus || true,
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
                failure: function () {
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
            failure: function() {
                if (MinecraftServerManager.app.debug) {
                    console.log('Minecraft Server offline.');
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
                Ext.TaskManager.start(MinecraftServerManager.app.getMinecraftStatusTask);
                Ext.TaskManager.start(MinecraftServerManager.app.getOpsTask);
                Ext.TaskManager.start(MinecraftServerManager.app.getPlayersTask);
            },
            failure: function() {
                if (MinecraftServerManager.app.debug) {
                    console.log('Minecraft Server offline.');
                }
                console.log('Minecraft Server unreachable?');
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
                console.log('Minecraft Server stopped.');
                Ext.TaskManager.stop(MinecraftServerManager.app.getMinecraftStatusTask);
                Ext.TaskManager.stop(MinecraftServerManager.app.getOpsTask);
                Ext.TaskManager.stop(MinecraftServerManager.app.getPlayersTask);
            },
            failure: function() {
                if (MinecraftServerManager.app.debug) {
                    console.log('Minecraft Server offline.');
                }
                console.log('Minecraft Server unreachable?');
                Ext.TaskManager.stop(MinecraftServerManager.app.getMinecraftStatusTask);
                Ext.TaskManager.stop(MinecraftServerManager.app.getOpsTask);
                Ext.TaskManager.stop(MinecraftServerManager.app.getPlayersTask);
            }
        });
    }
});

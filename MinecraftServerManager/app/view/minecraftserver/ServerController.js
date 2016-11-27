
Ext.define('MinecraftServerManager.view.minecraftserver.ServerController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.server',

    minecraftStatus: false,

    init: function() {
        var me = this;
        me.checkStatus();
    },

    checkStatus: function() {
        var me = this;

        if (MinecraftServerManager.app.debugMinecraftStatus) {
            console.log('Checking Minecraft server state...');
        }

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
            success: function(response) {
                var result = JSON.parse(response.responseText);

                me.minecraftStatus = result.response;
                if (MinecraftServerManager.app.debugMinecraftStatus) {
                    console.log('Minecraft Server online:', me.minecraftStatus);
                }
            },
            failure: function() {
                me.minecraftStatus = false;
                if (MinecraftServerManager.app.debugMinecraftStatus) {
                    console.log('Minecraft Server online: ', me.minecraftStatus);
                }
            }
        });
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
                    console.log('Minecraft Server online.');
                }
                console.log('Minecraft Server started.');
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
                    console.log('Minecraft Server online.');
                }
                console.log('Minecraft Server stopped.');
            },
            failure: function() {
                if (MinecraftServerManager.app.debug) {
                    console.log('Minecraft Server offline.');
                }
                console.log('Minecraft Server unreachable?');
            }
        });
    }
});

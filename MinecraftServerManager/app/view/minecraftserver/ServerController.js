
Ext.define('MinecraftServerManager.view.minecraftserver.ServerController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.server',

    // requires: ['MinecraftServerManager.view.minecraftserver.ServerStatus'],

    minecraftStatus: false,

    init: function() {
        var me = this;
        me.checkStatus();
    },

    checkStatus: function() {
        var me = this;

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
            success: function() {
                me.minecraftStatus = true;
                if (debugMinecraftStatus) {
                    console.log('Minecraft Server online:', me.minecraftStatus);
                }
            },
            failure: function() {
                me.minecraftStatus = false;
                if (debugMinecraftStatus) {
                    console.log('Minecraft Server online: ', me.minecraftStatus);
                }
            }
        });
    },

    newWorld: function() {
        var worldName = '';
        // Get world name from minecraftServerPropertiesStore
        minecraftServerPropertiesStore.each(function (property) {
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
                if (debug) {
                    console.log('Minecraft Server online.');
                }
            },
            failure: function() {
                if (debug) {
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
                if (debug) {
                    console.log('Minecraft Server online.');
                }
                console.log('Minecraft Server started.');
            },
            failure: function() {
                if (debug) {
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
                if (debug) {
                    console.log('Minecraft Server online.');
                }
                console.log('Minecraft Server stopped.');
            },
            failure: function() {
                if (debug) {
                    console.log('Minecraft Server offline.');
                }
                console.log('Minecraft Server unreachable?');
            }
        });
    }
});

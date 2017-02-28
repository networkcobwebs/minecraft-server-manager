
// var minecraftServerOpsStore = Ext.data.StoreManager.lookup('minecraftServerOpsStore'),
//     minecraftPlayersStore = Ext.data.StoreManager.lookup('minecraftPlayersStore');

Ext.define('MinecraftServerManager.model.MinecraftPlayer', {
    extend: 'Ext.data.Model',
    requires: 'Ext.data.proxy.Rest',

    fields: [{ // Some of these fields come from Minecraft's ops.json file, so they may change:
        name: 'uuid',
        type: 'string'
    }, {
        name: 'name',
        type: 'string'
    }, {
        name: 'level',
        type: 'string'
    }, {
        name: 'bypassesPlayerLimit',
        type: 'boolean'
    }, {
        name: 'isOp',
        type: 'boolean'
    }, {
        name: 'isOnline',
        type: 'boolean'
    }, {
        name: 'isBanned',
        type: 'boolean'
    }, {
        name: 'isWhitelisted',
        type: 'boolean'
    }, {
        name: 'playerActionAttributes',
        calculate: function (data) {
            var retValue = [];

            if (data.isOp) retValue.push("isOp");
            if (data.isBanned) retValue.push("isBanned");
            if (data.isWhitelisted) retValue.push("isWhitelisted");

            return retValue;
        }
    }, {
        name: 'isDev',
        type: 'boolean'
    }],

    // Bans a player on the Minecraft server
    banPlayer: function() {
        var player = this;

        if (MinecraftServerManager.app.minecraftServer.minecraftStatus) {
            Ext.Ajax.request({
                url: 'http://localhost:3000/command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    command: '/ban ' + player.data.name
                },
                jsonData: {
                    command: '/ban ' + player.data.name
                },
                scope: this,
                timeout: 5000,
                success: function() {
                    Ext.data.StoreManager.lookup('minecraftServerOpsStore').getOps();
                    Ext.data.StoreManager.lookup('minecraftPlayersStore').getPlayers();
                }
            });
        }
    },

    // Compares this player with the Ops list from the Minecraft server
    checkOpStatus: function() {
        var player = this,
            opStore = Ext.data.StoreManager.lookup('minecraftServerOpsStore');

        // Make sure we have ops at all
        if (opStore.count() == 0) {
            opStore.getOps();
        }
        opStore.each(function(op) {
            if (MinecraftServerManager.app.debugOpsCheck) {
                console.log('checkOpStatus: comparing op.name "' + op.get('name') + '" with player "'+ player.get('name') + '"');
            }
            if (op.get('name') === player.get('name')) {
                if (MinecraftServerManager.app.debugOpsCheck) {
                    console.log('checkOpStatus: setting player "' + player.get('name') + '" as op.');
                }
                if (!player.get('isOp')) {
                    player.set('isOp', true);
                }
            }
        });
    },

    // Kicks a player on the Minecraft server
    kickPlayer: function() {
        var player = this;

        if (MinecraftServerManager.app.minecraftServer.minecraftStatus) {
            Ext.Ajax.request({
                url: 'http://localhost:3000/command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    command: '/kick ' + player.data.name
                },
                jsonData: {
                    command: '/kick ' + player.data.name
                },
                scope: this,
                timeout: 5000,
                success: function() {
                    Ext.data.StoreManager.lookup('minecraftServerOpsStore').getOps();
                    Ext.data.StoreManager.lookup('minecraftPlayersStore').getPlayers();
                }
            });
        }
    },

    // Deops a player on the Minecraft server
    deopPlayer: function() {
        var player = this;

        if (MinecraftServerManager.app.minecraftServer.minecraftStatus) {
            Ext.Ajax.request({
                url: 'http://localhost:3000/command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    command: '/deop ' + player.data.name
                },
                jsonData: {
                    command: '/deop ' + player.data.name
                },
                scope: this,
                timeout: 5000,
                success: function() {
                    player.set('isOp', false);
                    player.commit();
                    Ext.data.StoreManager.lookup('minecraftServerOpsStore').getOps();
                    Ext.data.StoreManager.lookup('minecraftPlayersStore').getPlayers();
                }
            });
        }
    },

    // Ops a player on the Minecraft server
    opPlayer: function() {
        var player = this;

        if (MinecraftServerManager.app.minecraftServer.minecraftStatus) {
            Ext.Ajax.request({
                url: 'http://localhost:3000/command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    command: '/op ' + player.data.name
                },
                jsonData: {
                    command: '/op ' + player.data.name
                },
                scope: this,
                timeout: 5000,
                success: function() {
                    player.set('isOp', true);
                    player.commit();
                    Ext.data.StoreManager.lookup('minecraftServerOpsStore').getOps();
                    Ext.data.StoreManager.lookup('minecraftPlayersStore').getPlayers();
                }
            });
        }
    },

    // Pardons a player on the Minecraft server
    pardonPlayer: function() {
        var player = this;

        if (MinecraftServerManager.app.minecraftServer.minecraftStatus) {
            Ext.Ajax.request({
                url: 'http://localhost:3000/command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    command: '/pardon ' + player.data.name
                },
                jsonData: {
                    command: '/pardon ' + player.data.name
                },
                scope: this,
                timeout: 5000,
                success: function() {
                    Ext.data.StoreManager.lookup('minecraftServerOpsStore').getOps();
                    Ext.data.StoreManager.lookup('minecraftPlayersStore').getPlayers();
                }
            });
        }
    },

    // Removes a player from the whitelist on the Minecraft server
    deWhitelistPlayer: function() {
        var player = this;

        if (MinecraftServerManager.app.minecraftServer.minecraftStatus) {
            Ext.Ajax.request({
                url: 'http://localhost:3000/command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    command: '/whitelist remove ' + player.data.name
                },
                jsonData: {
                    command: '/whitelist remove ' + player.data.name
                },
                scope: this,
                timeout: 5000,
                success: function() {
                    Ext.data.StoreManager.lookup('minecraftServerOpsStore').getOps();
                    Ext.data.StoreManager.lookup('minecraftPlayersStore').getPlayers();
                }
            });
        }
    },

    // Adds a player to the whitelist on the Minecraft server
    whitelistPlayer: function() {
        var player = this;

        if (MinecraftServerManager.app.minecraftServer.minecraftStatus) {
            Ext.Ajax.request({
                url: 'http://localhost:3000/command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    command: '/whitelist add ' + player.data.name
                },
                jsonData: {
                    command: '/whitelist add ' + player.data.name
                },
                scope: this,
                timeout: 5000,
                success: function() {
                    Ext.data.StoreManager.lookup('minecraftServerOpsStore').getOps();
                    Ext.data.StoreManager.lookup('minecraftPlayersStore').getPlayers();
                }
            });
        }
    },

    proxy: {
        type: 'rest',
        url : '/MinecraftPlayers'
    }
});

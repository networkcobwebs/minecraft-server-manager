
var minecraftServerOpsStore = Ext.data.StoreManager.lookup('minecraftServerOpsStore'),
    minecraftPlayersStore = Ext.data.StoreManager.lookup('minecraftPlayersStore');

Ext.define('MinecraftServerManager.model.MinecraftPlayer', {
    extend: 'Ext.data.Model',

    fields: [
        // Some of these fields come from Minecraft's ops.json file, so they may change:
        { name: 'uuid', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'level', type: 'string' },
        { name: 'bypassesPlayerLimit', type: 'boolean' },
        { name: 'isOp', type: 'boolean' },
        { name: 'isOnline', type: 'boolean' },
        { name: 'isBanned', type: 'boolean' },
        { name: 'isWhitelisted', type: 'boolean' },
        { name: 'actionvalue', type: 'string' },
        { name: 'isDev', type: 'boolean' }
    ],

    showActions: function () {
        var player = this;
        debugger;
        return [player.get('isOp')?1:0, 0, player.get('isBanned')?1:0, player.get('isWhitelisted')?1:0];
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

    // Compares this player with the Ops list from the Minecraft server
    checkOpStatus: function() {
        var player = this;

        // Make sure we have ops at all
        if (Ext.data.StoreManager.lookup('minecraftServerOpsStore').count() == 0) {
            Ext.data.StoreManager.lookup('minecraftServerOpsStore').getOps();
        }
        Ext.data.StoreManager.lookup('minecraftServerOpsStore').each(function(op) {
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
    }
});

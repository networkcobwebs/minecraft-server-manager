
var opsStore = Ext.data.StoreManager.lookup('opsStore'),
    playersStore = Ext.data.StoreManager.lookup('playersStore');

Ext.define('MinecraftServerManager.model.MinecraftPlayer', {
    extend: 'Ext.data.Model',

    fields: [
        // Some of these fields come from Minecraft's ops.json file, so they may change:
        { name: 'uuid',     type: 'string' },
        { name: 'name',     type: 'string' },
        { name: 'level',    type: 'string' },
        { name: 'bypassesPlayerLimit', type: 'boolean' },
        { name: 'isOp',     type: 'boolean' },
        { name: 'isOnline', type: 'boolean' }
    ],

    // Deops a player on the Minecraft server
    deopPlayer: function() {
        // var me = this;
        var player = this;
        if (minecraftStatus) {
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
                    opsStore.getOps();
                    playersStore.getPlayers();
                }
            });
        }
    },

    // Ops a player on the Minecraft server
    opPlayer: function() {
        // var me = this;
        var player = this;
        if (minecraftStatus) {
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
                    opsStore.getOps();
                    playersStore.getPlayers();
                }
            });
        }
    },

    // Compares this player with the Ops list from the Minecraft server
    checkOpStatus: function() {
        var player = this;

        // Make sure we have ops at all
        if (opsStore.count() == 0) {
            opsStore.getOps();
        }
        opsStore.each(function(op) {
            if (debugOpsCheck) {
                console.log('checkOpStatus: comparing op.name "' + op.get('name') + '" with player "'+ player.get('name') + '"');
            }
            if (op.get('name') === player.get('name')) {
                if (debugOpsCheck) {
                    console.log('checkOpStatus: setting player "' + player.get('name') + '" as op.');
                }
                if (!player.get('isOp')) {
                    player.set('isOp', true);
                }
            }
        });
    }
});

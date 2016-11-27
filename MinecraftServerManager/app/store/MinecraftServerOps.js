
Ext.define('MinecraftServerManager.store.MinecraftServerOps', {
    storeId: 'minecraftServerOpsStore',
    extend: 'Ext.data.Store',
    autoLoad: true,

    requires: [
        'MinecraftServerManager.model.MinecraftServerOp'
    ],
    
    model: 'MinecraftServerManager.model.MinecraftServerOp',

    getOps: function() {
        var me = this;

        if (MinecraftServerManager.app.minecraftServer.minecraftStatus) {
            Ext.Ajax.request({
                url: 'http://localhost:3000/command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    command: '/getOps'
                },
                jsonData: {
                    command: '/getOps'
                },
                timeout: 5000,
                success: function (response) {
                    var result = JSON.parse(response.responseText),
                        opsList = result.response,  // opsList = [Player, Player, Player, ...]
                        found;

                    if (typeof opsList !== 'object') {
                        // squelch failures for now
                        console.log(opsList);
                    } else {
                        // First remove any players on the page that were deop'ed
                        me.each(function (op) {
                            found = false;
                            opsList.forEach(function (opName) {
                                if (op.get('name') === opName.name) {
                                    found = true;
                                }
                            });
                            if (!found) {
                                if (MinecraftServerManager.app.debugOpsCheck) {
                                    console.log('Removing ' + op.get('name') + ' from tracked ops.');
                                }
                                me.remove(op, false, true);
                                me.commitChanges();
                            }
                        });

                        opsList.forEach(function (player) {
                            // Make sure we don't already have this player op'ed
                            found = false;
                            me.each(function (op) {
                                if (player.name === op.get('name')) {
                                    found = true;
                                }
                            });
                            if (!found) {
                                if (MinecraftServerManager.app.debugOpsCheck) {
                                    console.log('Tracking op:', player.name);
                                }
                                me.add(player);
                                me.commitChanges();
                            }
                        });
                    }
                },
                failure: function (response) {
                    if (MinecraftServerManager.app.debugOpsCheck) {
                        console.log('Failed to get ops list:', response);
                    }
                }
            });
        }
    }
});


Ext.define('MinecraftServerManager.store.Ops', {
    storeId: 'opsStore',
    extend: 'Ext.data.Store',
    autoLoad: true,

    requires: [
        'MinecraftServerManager.model.Op'
    ],
    
    model: 'MinecraftServerManager.model.Op',

    getOps: function() {
        var me = this;

        if (minecraftStatus) {
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

                    // First remove any players on the page that were deop'ed
                    me.each(function(op) {
                        found = false;
                        opsList.forEach(function (opName) {
                            if (op.get('name') === opName.name) {
                                found = true;
                            }
                        });
                        if (!found) {
                            if (debugOpsCheck) {
                                console.log('Removing ' + op.get('name') + ' from tracked ops.');
                            }
                            me.remove(op, false, true);
                            me.commitChanges();
                        }
                    });

                    opsList.forEach(function (player) {
                        // Make sure we don't already have this player op'ed
                        found = false;
                        me.each(function(op) {
                            if (player.name === op.get('name')) {
                                found = true;
                            }
                        });
                        if (!found) {
                            if (debugOpsCheck) {
                                console.log('Tracking op:', player.name);
                            }
                            me.add(player);
                            me.commitChanges();
                        }
                    });
                },
                failure: function (response) {
                    console.log('Failed to get ops list:', response);
                }
            });
        }
    }
});

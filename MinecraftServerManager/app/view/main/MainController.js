
var opsStore, playersPanel, playerStore;

Ext.define('MinecraftServerManager.view.main.MainController', {
    extend: 'Ext.app.ViewController',
    requires: [
        'Ext.util.TaskRunner',
        'MinecraftServerManager.model.Op',
        'MinecraftServerManager.store.Ops',
        'MinecraftServerManager.model.Player',
        'MinecraftServerManager.model.Preferences'
    ],

    alias: 'controller.main',
    
    init: function () {
        var me = this,
            runner = new Ext.util.TaskRunner(),
            task;

        opsStore = Ext.create('MinecraftServerManager.store.Ops');
        playersPanel = Ext.getCmp('playersGrid');
        playerStore = playersPanel.store;

        // Get Minecraft server ops
        me.getOps();
        // Get Minecraft players
        // me.getPlayers();

        // Query Minecraft server for player list, periodically
        task = runner.newTask({
            run: function() {
                me.getPlayers();
            },
            scope: me,
            interval: 5000,
            fireOnStart: true
        });
        task.start();
    },

    getOps: function() {
        var me = this;

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
            scope: me,
            timeout: 5000,
            success: function(response, request, options, eOpts) {
                var result = JSON.parse(response.responseText),
                    opsList = result.response,
                    found;
                // opsList = [Player, Player, Player, ...]
                opsList.forEach(function(op) {
                    // Make sure we don't already have this player op'ed
                    found = false;
                    opsStore.each(function (gameOp) {
                        if (op.name === gameOp.name) {
                            found = true;
                        }
                    });
                    if (!found) {
                        opsStore.add(op);
                    }
                });
            },
            failure: function(response, request, options, eOpts) {
                console.log('Failed to get ops list:', response);
            }
        });
    },

    getPlayers: function() {
        var me = this;

        Ext.Ajax.request({
            url: 'http://localhost:3000/command',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                command: '/list'
            },
            jsonData: {
                command: '/list'
            },
            scope: this,
            timeout: 5000,
            success: function(response, request, options, eOpts) {
                var result = JSON.parse(response.responseText),
                    playerList = result.response,
                    found = false,
                    player, players, playerName, playerNames, summary;

                // First line is the summary,
                // followed by player names, comma+space separated
                players = playerList.split(/\n/);
                summary = players.shift();
                // Remove trailing ':'
                summary = summary.slice(0, -1);
                playersPanel.setTitle('Players - ' + summary);

                // Flag offline players accordingly
                playerStore.each(function (player) {
                    found = false;
                    for (var i = 0; i < players.length; i++) {
                        playerNames = players[i].split(',');
                        for (var p = 0; p < playerNames.length; p++) {
                            playerName = playerNames[p].trim();
                            if (playerName && (player.data.name === playerName)) {
                                found = true;
                            }
                        }
                    }

                    player.data.isOnline = found;
                    player.commit();
                });

                playerStore.commitChanges();

                // Add new players to the list accordingly:
                for (var i = 0; i < players.length; i++) {
                    playerNames = players[i].split(',');
                    for (var p = 0; p < playerNames.length; p++) {
                        found = false;
                        playerName = playerNames[p].trim();
                        if (playerName) {
                            // Make sure we don't already have this player displayed
                            playerStore.each(function (player) {
                                if (player.data.name === playerName) {
                                    found = true;
                                }
                            });
                            if (!found) {
                                player = Ext.create('MinecraftServerManager.model.Player', {
                                    name: playerName
                                });
                                me.isOp(player);
                                player.data.isOnline = true;
                                playerStore.add(player);
                            }
                        }
                    }
                }
            },

            failure: function(conn, response, options, eOpts) {
                console.log('Failed to get user list:', response);
            }
        });
    },

    isOp: function(player) {
        opsStore.each(function(op) {
            if (op.data.name === player.data.name) {
                player.data.isOp = true;
            }
        });
    }
});

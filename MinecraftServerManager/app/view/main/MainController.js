
var playersPanel, playerStore;

Ext.define('MinecraftServerManager.view.main.MainController', {
    extend: 'Ext.app.ViewController',
    requires: [
        'MinecraftServerManager.model.Player'
    ],

    alias: 'controller.main',
    
    init: function () {
        playersPanel = Ext.getCmp('playersGrid');
        playerStore = playersPanel.store;
        this.updatePlayers();
    },

    updatePlayers: function() {
        // Get the list of current users from the Minecraft Server:
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
            success: function(response, request, options, eOpts) {
                var result = JSON.parse(response.responseText),
                    playerList = result.response,
                    found, player, players, playerName, playerNames, summary;

                // First line is the summary,
                // followed by player names, comma separated
                players = playerList.split(/\n/);
                summary = players.shift();
                // Remove trailing ':'
                summary = summary.slice(0, -1);
                playersPanel.setTitle('Players - ' + summary);

                for (var i = 0; i < players.length; i++) {
                    found = false;
                    playerNames = players[i].split(',');
                    for (var p = 0; p < playerNames.length; p++) {
                        playerName = playerNames[p];
                        if (playerName) {
                            // Make sure we don't already have this player displayed
                            playerStore.each(function (player) {
                                if (player.name === playerNames) {
                                    found = true;
                                }
                            });
                            if (!found) {
                                player = Ext.create('MinecraftServerManager.model.Player', {
                                    name: playerName
                                });
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
    }
});

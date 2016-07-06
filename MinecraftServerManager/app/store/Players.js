
Ext.define('MinecraftServerManager.store.Players', {
    storeId: 'playersStore',
    extend: 'Ext.data.Store',
    autoLoad: true,

    requires: [
        'MinecraftServerManager.model.Player'
    ],

    model: 'MinecraftServerManager.model.Player',

    getPlayers: function() {
        var me = this;

        if (minecraftStatus) {
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
                success: function (response) {
                    var result = JSON.parse(response.responseText),
                        playerList = result.response,
                        playerNames = [],
                        found = false,
                        player, players, playerName, somePlayerName, somePlayerNames, testData, summary,
                        i, p;

                    // First line is the summary,
                    // followed by player names, comma+space separated
                    players = playerList.split(/\n/);
                    summary = players.shift();
                    // Remove trailing ':'
                    summary = summary.slice(0, -1);
                    // Remove preceding timestamp/server info
                    summary = summary.split(']: ')[1];
                    me.updateSummary(summary);

                    // Get playerNames
                    for (i = 0; i < players.length; i++) {
                        // Remove preceding timestamp & server info
                        somePlayerNames = players[i].split(']: ')[1];
                        if (debugPlayersCheck) {
                            console.log('somePlayerNames:', somePlayerNames);
                        }
                        if (somePlayerNames) {
                            somePlayerNames = somePlayerNames.split(',');
                            if (debugPlayersCheck) {
                                console.log('somePlayerNames:', somePlayerNames);
                            }
                            for (p = 0; p < somePlayerNames.length; p++) {
                                somePlayerName = somePlayerNames[p];
                                if (somePlayerName) {
                                    // Make sure we check for multiple spaces so as to
                                    // ignore any bad data like things that were
                                    // accidentally in the buffer at the same time we
                                    // queried, etc.
                                    testData = somePlayerName.split(' ');
                                    if (testData.length < 2) {
                                        playerNames.push(somePlayerName.trim());
                                    }
                                }
                            }
                        }
                    }
                    if (debugPlayersCheck) {
                        console.log('playerNames discovered:', playerNames);
                    }

                    // Flag players accordingly
                    playersStore.each(function(player) {
                        if (debugPlayersCheck) {
                            console.log('Checking properties of player:', player);
                        }
                        found = false;
                        for (i = 0; i < playerNames.length; i++) {
                            if (player.get('name') === playerNames[i]) {
                                found = true;
                            }
                        }
                        if (player.get('isOnline') !== found) {
                            player.set('isOnline', found);
                        }
                        player.checkOpStatus();

                        if (player.get('dirty')) {
                            player.commit();
                            playersStore.commitChanges();
                        }
                    });

                    // Add new players to the list accordingly:
                    for (i = 0; i < playerNames.length; i++) {
                        found = false;
                        playerName = playerNames[i];
                        // Make sure we don't already have this player displayed
                        playersStore.each(function (player) {
                            if (player.get('name') === playerName) {
                                found = true;
                            }
                        });
                        if (!found) {
                            player = Ext.create('MinecraftServerManager.model.Player', {
                                name: playerName
                            });
                            player.set('isOnline', true);
                            player.checkOpStatus();
                            player.commit();
                            playersStore.add(player);
                            playersStore.commitChanges();
                            if (debugPlayersCheck) {
                                console.log('getPlayers: added player: ', player);
                            }
                        }
                    }
                },

                failure: function (response) {
                    console.log('Failed to get user list:', response);
                }
            });
        }
    },

    updateSummary: function(summary) {
        var playersPanel = Ext.getCmp('playersGrid');
        playersPanel.setTitle('Players - ' + summary);
    }
});

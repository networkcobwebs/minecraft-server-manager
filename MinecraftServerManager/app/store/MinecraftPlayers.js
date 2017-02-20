
Ext.define('MinecraftServerManager.store.MinecraftPlayers', {
    storeId: 'minecraftPlayersStore',
    extend: 'Ext.data.Store',
    autoLoad: true,

    requires: [
        'MinecraftServerManager.model.MinecraftPlayer'
    ],

    model: 'MinecraftServerManager.model.MinecraftPlayer',

    data: [{
        uuid: 'blarg',
        name: 'your_mom',
        level: 'über level',
        bypassesPlayerLimit: true,
        isOp: true,
        isOnline: true,
        isBanned: false,
        isWhitelisted: true,
        isDev: true
    },{
        uuid: 'blarg',
        name: 'your_dad',
        level: 'über level',
        bypassesPlayerLimit: true,
        isOp: false,
        isOnline: false,
        isBanned: true,
        isWhitelisted: false,
        isDev: true
    }],

    filters: [{
        property: 'isDev',
        value: true
    }],

    getPlayers: function() {
        var me = this;

        if (MinecraftServerManager.app.minecraftServer.minecraftStatus) {
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

                    if (playerList.includes('Fail')) {
                        // Squelch for now
                        console.log(playerList);
                    } else {
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
                            if (MinecraftServerManager.app.debugPlayersCheck) {
                                console.log('somePlayerNames:', somePlayerNames);
                            }
                            if (somePlayerNames) {
                                somePlayerNames = somePlayerNames.split(',');
                                if (MinecraftServerManager.app.debugPlayersCheck) {
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
                                        if (testData.length <= 2) {
                                            playerNames.push(somePlayerName.trim());
                                        }
                                    }
                                }
                            }
                        }
                        if (MinecraftServerManager.app.debugPlayersCheck) {
                            console.log('playerNames discovered:', playerNames);
                        }

                        // Flag players accordingly
                        me.each(function (player) {
                            if (!player.get('isDev')) {
                                if (MinecraftServerManager.app.debugPlayersCheck) {
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
                                    me.commitChanges();
                                }
                            }
                        });

                        // Add new players to the list accordingly:
                        for (i = 0; i < playerNames.length; i++) {
                            found = false;
                            playerName = playerNames[i];
                            // Make sure we don't already have this player displayed
                            me.each(function (player) {
                                if (player.get('name') === playerName) {
                                    found = true;
                                }
                            });
                            if (!found) {
                                player = Ext.create('MinecraftServerManager.model.MinecraftPlayer', {
                                    name: playerName
                                });
                                player.set('isOnline', true);
                                player.checkOpStatus();
                                player.commit();
                                me.add(player);
                                me.commitChanges();
                                if (MinecraftServerManager.app.debugPlayersCheck) {
                                    console.log('getPlayers: added player: ', player);
                                }
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

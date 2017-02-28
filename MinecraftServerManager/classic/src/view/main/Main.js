
Ext.define('MinecraftServerManager.view.main.Main', {
    extend: 'Ext.panel.Panel',
    xtype: 'app-main',

    requires: [
        'MinecraftServerManager.view.main.List',
        'MinecraftServerManager.view.main.ServerStatus'
        ],

    items: [{
        xtype: 'app-main-minecraft-server-status'
    }, {
        xtype: 'player-list'
    }]

});

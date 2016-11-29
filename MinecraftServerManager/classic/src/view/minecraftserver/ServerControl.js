
Ext.define('MinecraftServerManager.view.minecraftserver.ServerControl', {
    extend: 'Ext.panel.Panel',

    xtype: 'minecraft-server-control',

    requires: [
        'Ext.container.ButtonGroup'
    ],

    tbar: [{
        // TODO: prompt for destructive bits
        xtype: 'buttongroup',
        frame: false,
        items: [
            {
                text: 'Stop',
                handler: function() {
                    MinecraftServerManager.app.minecraftServer.stopMinecraft();
                }
            }, {
                text: 'Start',
                handler: function() {
                    MinecraftServerManager.app.minecraftServer.startMinecraft();
                }
            }, {
                text: 'New World',
                handler: function() {
                    MinecraftServerManager.app.minecraftServer.newWorld();
                }
            }
        ]
    }]
});

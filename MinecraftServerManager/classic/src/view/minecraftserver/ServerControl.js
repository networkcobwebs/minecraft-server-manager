
Ext.define('MinecraftServerManager.view.minecraftserver.ServerControl', {
    extend: 'Ext.panel.Panel',

    xtype: 'minecraft-server-control',

    requires: [
        'Ext.container.ButtonGroup'
    ],

    tbar: [{
        // TODO: prompt for destructive bits
        xtype: 'buttongroup',
        items: [
            {
                text: 'Stop',
                handler: function() {
                    minecraftServer.stopMinecraft();
                }
            }, {
                text: 'Start',
                handler: function() {
                    minecraftServer.startMinecraft();
                }
            }, {
                text: 'New World',
                handler: function() {
                    minecraftServer.newWorld();
                }
            }
        ]
    }]
});

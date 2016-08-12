
Ext.define('MinecraftServerManager.view.minecraftserver.Main', {
    extend: 'Ext.panel.Panel',
    xtype: 'minecraft-server-main',
    requires: [
        'MinecraftServerManager.view.minecraftserver.ServerStatus',
        'MinecraftServerManager.view.minecraftserver.Tabs'
    ],

    items: [
        {
            xtype: 'minecraft-server-status',
            id: 'minecraftStatus'
        }, {
            xtype: 'minecraft-server-tabs'
        }
    ]
});

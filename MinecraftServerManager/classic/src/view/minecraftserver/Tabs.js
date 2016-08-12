
Ext.define('MinecraftServerManager.view.minecraftserver.Tabs', {
    extend: 'Ext.tab.Panel',
    xtype: 'minecraft-server-tabs',
    requires: [
        'MinecraftServerManager.view.minecraftserver.ServerProperties',
        'MinecraftServerManager.view.minecraftserver.ServerControl'
    ],

    items: [
        {
            title: 'Server Properties',
            items: {
                xtype: 'minecraft-server-properties-list'
            }
        },
        {
            title: 'Server Control',
            items: {
                xtype: 'minecraft-server-control'
            }
        }
    ]
});

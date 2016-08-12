
Ext.define('MinecraftServerManager.view.minecraftserver.ServerStatus', {
    extend: 'Ext.panel.Panel',
    xtype: 'minecraft-server-status',

    title: 'Minecraft Server Status',

    height: 100,

    items: [{
        xtype:'box',
        id:'minecraft_status_img',
        autoEl: {
            style: 'margin:5px; padding:0px;',
            tag: 'img',
            src: 'resources/images/offline-icon-16.png'
        }
    }]

});

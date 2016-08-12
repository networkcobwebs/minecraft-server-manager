
Ext.define('MinecraftServerManager.view.main.ServerStatus', {
    extend: 'Ext.panel.Panel',
    xtype: 'app-main-minecraft-server-status',

    title: 'Minecraft Server Status',

    height: 100,

    items: [{
        xtype:'box',
        id:'main_status_img',
        autoEl: {
            style: 'margin:5px; padding:0px;',
            tag: 'img',
            src: 'resources/images/offline-icon-16.png'
        }
    }]

});


var playerStore = Ext.create('MinecraftServerManager.store.Players');

Ext.define('MinecraftServerManager.view.main.List', {
    extend: 'Ext.grid.Panel',
    xtype: 'mainlist',

    title: 'Players',
    alias: 'playersgrid',
    id: 'playersGrid',

    store: playerStore,

    columns: [
        { text: 'Name',  dataIndex: 'name' }
    ]
});

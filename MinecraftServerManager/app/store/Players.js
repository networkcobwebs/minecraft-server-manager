
Ext.define('MinecraftServerManager.store.Players', {
    alias: 'Players',
    extend: 'Ext.data.Store',
    autoLoad: true,

    requires: [
        'MinecraftServerManager.model.Player'
    ],

    model: 'MinecraftServerManager.model.Player'
});

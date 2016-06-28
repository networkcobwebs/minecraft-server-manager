
Ext.define('MinecraftServerManager.store.Ops', {
    alias: 'Ops',
    extend: 'Ext.data.Store',
    autoLoad: true,

    requires: [
        'MinecraftServerManager.model.Op'
    ],
    
    model: 'MinecraftServerManager.model.Op'
});
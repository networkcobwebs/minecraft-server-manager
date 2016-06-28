
Ext.define('MinecraftServerManager.model.Preferences', {
    extend: 'Ext.data.Model',

    fields: [
        { name: 'minecraftPath',    type: 'string' },
        { name: 'isNode',           type: 'boolean' }
    ]
});

/**
 * Created by nickrogers on 6/27/16.
 */
Ext.define('MinecraftServerManager.model.Op', {
    extend: 'Ext.data.Model',

    fields: [
        // These fields come from Minecraft's ops.json file, so they may change:
        { name: 'uuid',     type: 'string' },
        { name: 'name',     type: 'string' },
        { name: 'level',    type: 'string' },
        { name: 'bypassesPlayerLimit:', type: 'string' }
    ]
});
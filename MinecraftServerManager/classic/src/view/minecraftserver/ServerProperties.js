
Ext.define('MinecraftServerManager.view.minecraftserver.ServerProperties', {
    extend: 'Ext.grid.Panel',
    xtype: 'minecraftserverpropertieslist',

    title: 'Minecraft Server Properties',
    alias: 'minecraftserverpropertieslist',
    id: 'minecraftserverpropertieslist',

    store: 'minecraftServerPropertiesStore',
    height: 500,

    columns: [
        // { text: 'spawn-protection', sortable: false, hideable: false, dataIndex: 'spawn-protection' },
        // { text: 'max-tick-time', sortable: false, hideable: false, dataIndex: 'max-tick-time' },
        // { text: 'generator-settings', sortable: false, hideable: false, dataIndex: 'generator-settings' },
        // { text: 'force-gamemode', sortable: false, hideable: false, dataIndex: 'force-gamemode' },
        // { text: 'allow-nether', sortable: false, hideable: false, dataIndex: 'allow-nether' },
        // { text: 'gamemode', sortable: false, hideable: false, dataIndex: 'gamemode' },
        // { text: 'broadcast-console-to-ops', sortable: false, hideable: false, dataIndex: 'broadcast-console-to-ops' },
        // { text: 'enable-query', sortable: false, hideable: false, dataIndex: 'enable-query' },
        // { text: 'player-idle-timeout', sortable: false, hideable: false, dataIndex: 'player-idle-timeout' },
        // { text: 'difficulty', sortable: false, hideable: false, dataIndex: 'difficulty' },
        // { text: 'spawn-monsters', sortable: false, hideable: false, dataIndex: 'spawn-monsters' },
        // { text: 'op-permission-level', sortable: false, hideable: false, dataIndex: 'op-permission-level' },
        // { text: 'announce-player-achievements', sortable: false, hideable: false, dataIndex: 'announce-player-achievements' },
        // { text: 'pvp', sortable: false, hideable: false, dataIndex: 'pvp' },
        // { text: 'snooper-enabled', sortable: false, hideable: false, dataIndex: 'snooper-enabled' },
        // { text: 'level-type', sortable: false, hideable: false, dataIndex: 'level-type' },
        // { text: 'hardcore', sortable: false, hideable: false, dataIndex: 'hardcore' },
        // { text: 'enable-command-block', sortable: false, hideable: false, dataIndex: 'enable-command-block' },
        // { text: 'max-players', sortable: false, hideable: false, dataIndex: 'max-players' },
        // { text: 'network-compression-threshold', sortable: false, hideable: false, dataIndex: 'network-compression-threshold' },
        // { text: 'resource-pack-sha1', sortable: false, hideable: false, dataIndex: 'resource-pack-sha1' },
        // { text: 'max-world-size', sortable: false, hideable: false, dataIndex: 'max-world-size' },
        // { text: 'server-port', sortable: false, hideable: false, dataIndex: 'server-port' },
        // { text: 'server-ip', sortable: false, hideable: false, dataIndex: 'server-ip' },
        // { text: 'spawn-npcs', sortable: false, hideable: false, dataIndex: 'spawn-npcs' },
        // { text: 'allow-flight', sortable: false, hideable: false, dataIndex: 'allow-flight' },
        // { text: 'level-name', sortable: false, hideable: false, dataIndex: 'level-name' },
        // { text: 'view-distance', sortable: false, hideable: false, dataIndex: 'view-distance' },
        // { text: 'resource-pack', sortable: false, hideable: false, dataIndex: 'resource-pack' },
        // { text: 'spawn-animals', sortable: false, hideable: false, dataIndex: 'spawn-animals' },
        // { text: 'white-list', sortable: false, hideable: false, dataIndex: 'white-list' },
        // { text: 'generate-structures', sortable: false, hideable: false, dataIndex: 'generate-structures' },
        // { text: 'online-mode', sortable: false, hideable: false, dataIndex: 'online-mode' },
        // { text: 'max-build-height', sortable: false, hideable: false, dataIndex: 'max-build-height' },
        // { text: 'level-seed', sortable: false, hideable: false, dataIndex: 'level-seed' },
        // { text: 'motd', sortable: false, hideable: false, dataIndex: 'motd' },
        // { text: 'enable-rcon', sortable: false, hideable: false, dataIndex: 'enable-rcon' }
        { text: 'Property Name', sortable: false, hideable: false, dataIndex: 'name', flex: 1 },
        { text: 'Setting', sortable: false, hideable: false, dataIndex: 'value', flex: 1 }
    ]
});
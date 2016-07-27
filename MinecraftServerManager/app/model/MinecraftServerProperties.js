
Ext.define('MinecraftServerManager.model.MinecraftServerProperties', {
    extend: 'Ext.data.Model',

    fields: [
        // { name: 'spawn-protection', type: 'integer', defaultValue: 16 },
        // { name: 'max-tick-time', type: 'integer', defaultValue: 60000 },
        // { name: 'generator-settings', type: 'string' },
        // { name: 'force-gamemode', type: 'boolean', defaultValue: false },
        // { name: 'allow-nether', type: 'boolean', defaultValue: true },
        // { name: 'gamemode', type: 'integer', defaultValue: 0 },
        // { name: 'broadcast-console-to-ops', type: 'boolean', defaultValue: true },
        // { name: 'enable-query', type: 'boolean', defaultValue: false },
        // { name: 'player-idle-timeout', type: 'integer', defaultValue: 0 },
        // { name: 'difficulty', type: 'integer', defaultValue: 1 },
        // { name: 'spawn-monsters', type: 'boolean', defaultValue: true },
        // { name: 'op-permission-level', type: 'integer', defaultValue: 4 },
        // { name: 'announce-player-achievements', type: 'boolean', defaultValue: true },
        // { name: 'pvp', type: 'boolean', defaultValue: true },
        // { name: 'snooper-enabled', type: 'boolean', defaultValue: true },
        // { name: 'level-type', type: 'string', defaultValue: 'DEFAULT' },
        // { name: 'hardcore', type: 'boolean', defaultValue: false },
        // { name: 'enable-command-block', type: 'boolean', defaultValue: false },
        // { name: 'max-players', type: 'integer', defaultValue: 20 },
        // { name: 'network-compression-threshold', type: 'integer', defaultValue: 256 },
        // { name: 'resource-pack-sha1', type: 'string' },
        // { name: 'max-world-size', type: 'integer', defaultValue: 29999984 },
        // { name: 'server-port', type: 'integer', defaultValue: 25565 },
        // { name: 'server-ip', type: 'string' },
        // { name: 'spawn-npcs', type: 'boolean', defaultValue: true },
        // { name: 'allow-flight', type: 'boolean', defaultValue: false },
        // { name: 'level-name', type: 'string', defaultValue: 'world' },
        // { name: 'view-distance', type: 'integer', defaultValue: 10 },
        // { name: 'resource-pack', type: 'string' },
        // { name: 'spawn-animals', type: 'boolean', defaultValue: true },
        // { name: 'white-list', type: 'boolean', defaultValue: false },
        // { name: 'generate-structures', type: 'boolean', defaultValue: true },
        // { name: 'online-mode', type: 'boolean', defaultValue: true },
        // { name: 'max-build-height', type: 'integer', defaultValue: 256 },
        // { name: 'level-seed', type: 'string' },
        // { name: 'motd', type: 'string', defaultValue: 'A Minecraft Server' },
        // { name: 'enable-rcon', type: 'boolean', defaultValue: false }
        { name: 'name', type: 'string' },
        { name: 'value', type: 'string' }
    ]

    /*
    Uncomment to add a rest proxy that syncs data with the back end.
    proxy: {
        type: 'rest',
        url : '/users'
    }
    */
});
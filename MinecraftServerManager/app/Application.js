
Ext.define('MinecraftServerManager.Application', {
    extend: 'Ext.app.Application',
    requires: [
        'Ext.TaskManager',
        'MinecraftServerManager.view.minecraftserver.ServerController'
    ],
    
    name: 'MinecraftServerManager',

    stores: [
        'MinecraftServerOps',
        'MinecraftPlayers',
        'MinecraftServerProperties'
    ],

    taskManager: Ext.TaskManager,

    // Minecraft polling times in seconds, * milliseconds
    minecraftStatusPollInterval: 1 * 1000,
    minecraftPropertiesPollInterval: 60 * 1000,
    minecraftOpsPollInterval: 5 * 1000,
    minecraftPlayersPollInterval: 5 * 1000,

    debugMinecraftStatus: true,
    debugOpsCheck: true,
    debugPlayersCheck: true,
    debugMinecraftProperties: true,

    // Schedule Minecraft server property check
    getMinecraftPropertiesTask: {
        run: function() {
            Ext.data.StoreManager.lookup('minecraftServerPropertiesStore').getMinecraftProperties();
        },
        interval: this.minecraftPropertiesPollInterval,
        fireOnStart: true
    },
    
    launch: function () {
        var me = this;

        me.minecraftServer = new MinecraftServerManager.view.minecraftserver.ServerController();

        // Initial Minecraft server status check
        me.getMinecraftStatusTask = {
            run: function() {
                me.minecraftServer.checkStatus();
            },
            scope: me,
            interval: this.minecraftStatusPollInterval,
            fireOnStart: true
        };
        // Initial Minecraft op player check
        me.getOpsTask = {
            run: function() {
                var opsStore = Ext.data.StoreManager.lookup('minecraftServerOpsStore').getOps();
            },
            interval: me.minecraftOpsPollInterval,
            scope: me,
            fireOnStart: true
        };
        me.getPlayersTask = {
            run: function() {
                Ext.data.StoreManager.lookup('minecraftPlayersStore').getPlayers();
            },
            scope: me,
            interval: me.minecraftPlayersPollInterval,
            fireOnStart: true
        };
        me.getMinecraftPropertiesTask = {
            run: function() {
                Ext.data.StoreManager.lookup('minecraftServerPropertiesStore').getMinecraftProperties();
            },
            interval: me.minecraftPropertiesPollInterval,
            fireOnStart: true
        };

        me.taskManager.start(me.getMinecraftStatusTask);
        me.taskManager.start(me.getOpsTask);
        me.taskManager.start(me.getPlayersTask);
        me.taskManager.start(me.getMinecraftPropertiesTask);
    },

    onAppUpdate: function () {
        Ext.Msg.confirm('Application Update', 'This application has an update, reload?',
            function (choice) {
                if (choice === 'yes') {
                    window.location.reload();
                }
            }
        );
    }
});

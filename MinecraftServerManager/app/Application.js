
Ext.define('MinecraftServerManager.Application', {
    extend: 'Ext.app.Application',
    requires: [
        'Ext.TaskManager',
        'Ext.util.TaskRunner',
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

    devmode: true,

    debug: false,
    debugMinecraftStatus: false,
    debugOpsCheck: false,
    debugPlayersCheck: false,
    debugMinecraftProperties: false,
    
    launch: function () {
        var me = this;

        me.taskRunner = new Ext.util.TaskRunner();
        me.minecraftServer = new MinecraftServerManager.view.minecraftserver.ServerController();

        me.getMinecraftStatusTask = me.taskRunner.newTask({
            run: function () {
                me.minecraftServer.checkStatus();
            },
            scope: me,
            interval: me.minecraftStatusPollInterval,
            fireOnStart: false
        });
        me.getOpsTask = me.taskRunner.newTask({
            run: function () {
                Ext.data.StoreManager.lookup('minecraftServerOpsStore').getOps();
            },
            interval: me.minecraftOpsPollInterval,
            scope: me,
            fireOnStart: false
        });
        me.getPlayersTask = me.taskRunner.newTask({
            run: function () {
                Ext.data.StoreManager.lookup('minecraftPlayersStore').getPlayers();
            },
            scope: me,
            interval: me.minecraftPlayersPollInterval,
            fireOnStart: false
        });
        me.getMinecraftPropertiesTask = me.taskRunner.newTask({
            run: function () {
                Ext.data.StoreManager.lookup('minecraftServerPropertiesStore').getMinecraftProperties();
            },
            interval: me.minecraftPropertiesPollInterval,
            fireOnStart: false
        });
        me.getMinecraftStatusTask.start();
        me.getOpsTask.start();
        me.getPlayersTask.start();
        me.getMinecraftPropertiesTask.start();
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

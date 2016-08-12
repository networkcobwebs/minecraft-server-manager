
var runner = new Ext.util.TaskRunner(),
    debug = false,
    debugOpsCheck = false,
    debugPlayersCheck = false,
    debugMinecraftProperties = false,
    debugMinecraftStatus = false,
    minecraftServer = new MinecraftServerManager.view.minecraftserver.ServerController(),
    minecraftServerOpsStore, minecraftPlayersStore, minecraftServerPropertiesStore,
    getMinecraftStatusTask, getOpsTask, getPlayersTask, getMinecraftPropertiesTask;

Ext.define('MinecraftServerManager.view.main.MainController', {
    extend: 'Ext.app.ViewController',
    requires: [
        'Ext.data.StoreManager'
    ],

    alias: 'controller.main',
    
    init: function () {
        var me = this;

        minecraftPlayersStore = Ext.data.StoreManager.lookup('minecraftPlayersStore');
        minecraftServerOpsStore = Ext.data.StoreManager.lookup('minecraftServerOpsStore');
        minecraftServerPropertiesStore = Ext.data.StoreManager.lookup('minecraftServerPropertiesStore');

        // Initial Minecraft server status check
        getMinecraftStatusTask = runner.newTask({
            run: function() {
                minecraftServer.checkStatus();
            },
            scope: me,
            interval: 50,
            fireOnStart: true,
            repeat: 1
        });
        getMinecraftStatusTask.start();

        // Initial Minecraft op player check
        getOpsTask = runner.newTask({
            run: function() {
                minecraftServerOpsStore.getOps();
            },
            interval: 1000,
            fireOnStart: true,
            repeat: 1
        });
        getOpsTask.start();

        // Initial Minecraft server player check
        getPlayersTask = runner.newTask({
            run: function() {
                minecraftPlayersStore.getPlayers();
            },
            // scope: playersStore,
            interval: 2000,
            fireOnStart: true,
            repeat: 1
        });
        getPlayersTask.start();

        // Schedule Minecraft server property check
        getMinecraftPropertiesTask = runner.newTask({
            run: function() {
                minecraftServerPropertiesStore.getMinecraftProperties();
            },
            scope: me,
            interval: 2000,
            fireOnStart: true,
            repeat: 1
        });
        getMinecraftPropertiesTask.start();

        Ext.Function.defer(function() {
            me.scheduleTasks()
        }, 2500, me);
    },

    scheduleTasks: function() {
        var me = this;
        
        // Schedule Minecraft server status check
        getMinecraftStatusTask = runner.newTask({
            run: function() {
                minecraftServer.checkStatus();
                if (minecraftServer.minecraftStatus) {
                    try {
                        Ext.getCmp('main_status_img').getEl().dom.src = 'resources/images/online-icon-16.png';
                    }
                    catch (e) {
                        //
                    }
                    try {
                        Ext.getCmp('minecraft_status_img').getEl().dom.src = 'resources/images/online-icon-16.png';
                    }
                    catch (e) {
                        //
                    }
                } else {
                    try {
                        Ext.getCmp('main_status_img').getEl().dom.src = 'resources/images/offline-icon-16.png';
                    }
                    catch (e) {
                        //
                    }
                    try {
                        Ext.getCmp('minecraft_status_img').getEl().dom.src = 'resources/images/offline-icon-16.png';
                    }
                    catch (e) {
                        //
                    }

                }
            },
            scope: me,
            interval: 5000,
            fireOnStart: false
        });
        getMinecraftStatusTask.start();

        // Schedule Minecraft op player check
        getOpsTask = runner.newTask({
            run: function() {
                minecraftServerOpsStore.getOps();
            },
            scope: minecraftServerOpsStore,
            interval: 20000,
            fireOnStart: false
        });
        getOpsTask.start();

        // Schedule Minecraft server player check
        getPlayersTask = runner.newTask({
            run: function() {
                minecraftPlayersStore.getPlayers();
            },
            // scope: me,
            interval: 10000,
            fireOnStart: false
        });
        getPlayersTask.start();

        // Schedule Minecraft server property check
        getMinecraftPropertiesTask = runner.newTask({
            run: function() {
                minecraftServerPropertiesStore.getMinecraftProperties();
            },
            scope: me,
            interval: 60000,
            fireOnStart: false
        });
        getMinecraftPropertiesTask.start();
    }
});

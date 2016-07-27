
var debug = false,
    debugOpsCheck = false,
    debugPlayersCheck = false,
    debugMinecraftProperties = false,
    minecraftStatus = false,
    minecraftServerOpsStore, minecraftPlayersStore, minecraftServerPropertiesStore,
    runner = new Ext.util.TaskRunner(),
    getMinecraftStatusTask, getOpsTask, getPlayersTask, getMinecraftPropertiesTask;

Ext.define('MinecraftServerManager.view.main.MainController', {
    extend: 'Ext.app.ViewController',
    requires: [
        'Ext.data.StoreManager'
    ],

    alias: 'controller.main',
    
    init: function () {
        var me = this;

        minecraftServerOpsStore = Ext.data.StoreManager.lookup('minecraftServerOpsStore');
        minecraftPlayersStore = Ext.data.StoreManager.lookup('minecraftPlayersStore');
        minecraftServerPropertiesStore = Ext.data.StoreManager.lookup('minecraftServerPropertiesStore');

        // Initial Minecraft server status check
        getMinecraftStatusTask = runner.newTask({
            run: function() {
                me.checkMinecraftStatus();
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
            // scope: opsStore,
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
                me.checkMinecraftStatus();
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
            scope: opsStore,
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
    },

    checkMinecraftStatus: function() {
        Ext.Ajax.request({
            url: 'http://localhost:3000/command',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                command: '/getStatus'
            },
            jsonData: {
                command: '/getStatus'
            },
            timeout: 5000,
            success: function() {
                minecraftStatus = true;
                if (debug) {
                    console.log('Minecraft Server online.');
                }
            },
            failure: function() {
                minecraftStatus = false;
                if (debug) {
                    console.log('Minecraft Server offline.');
                }
            }
        });
    }
});

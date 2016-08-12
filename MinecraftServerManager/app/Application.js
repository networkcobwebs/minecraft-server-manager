
Ext.define('MinecraftServerManager.Application', {
    extend: 'Ext.app.Application',
    
    name: 'MinecraftServerManager',

    stores: [
        'MinecraftServerOps',
        'MinecraftPlayers',
        'MinecraftServerProperties'
    ],
    
    launch: function () {
        // TODO - Launch the application
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

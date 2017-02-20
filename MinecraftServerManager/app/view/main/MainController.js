
Ext.define('MinecraftServerManager.view.main.MainController', {
    extend: 'Ext.app.ViewController',
    requires: [
        'Ext.data.StoreManager'
    ],

    alias: 'controller.main',
    
    init: function () {

    },

    changePlayerAttribute: function (items, attributeBtn, value) {
        // debugger;
        // attributeBtn has a value of the model property name, and value is the 'pressed' state of the button, so set the attribute.value in the player model to value.
        // Get the player:
        var player = new MinecraftServerManager.model.MinecraftPlayer(items.up().up().up().$widgetRecord.data);

        if (attributeBtn.value === 'isOp') {
            // op/deop
            if (value) {
                player.opPlayer();
            } else {
                player.deopPlayer();
            }
        } else if (attributeBtn.value === 'kick') {
            // kick
            if (value) {
                player.kickPlayer();
            }
        } else if (attributeBtn.value === 'isBanned') {
            // ban/pardon
            if (value) {
                player.banPlayer();
            } else {
                player.pardonPlayer();
            }
        } else if (attributeBtn.value === 'isWhiteListed') {
            // whitelist/dewhitelist
            if (value) {
                player.whitelistPlayer();
            } else {
                player.deWhitelistPlayer();
            }
        }
    }
});

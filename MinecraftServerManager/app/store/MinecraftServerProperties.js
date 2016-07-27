
Ext.define('MinecraftServerManager.store.MinecraftServerProperties', {
    extend: 'Ext.data.Store',
    storeId: 'minecraftServerPropertiesStore',

    requires: ['MinecraftServerManager.model.MinecraftServerProperties'],

    model: 'MinecraftServerManager.model.MinecraftServerProperties',

    getMinecraftProperties: function() {
        var me = this;

        Ext.Ajax.request({
            url: 'http://localhost:3000/command',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                command: '/getProps'
            },
            jsonData: {
                command: '/getProps'
            },
            timeout: 5000,
            success: function(response) {
                var minecraftServerProperties = JSON.parse(response.responseText).response,
                    propertyIndex, propertySet;

                if (debugMinecraftProperties) {
                    console.log('Got Minecraft server properties', minecraftServerProperties);
                }

                if (me.count()) {
                    // Update the properties
                    // me.each(function(propertySet) {
                    //     if (propertySet.)
                    // });
                } else {
                    // Just insert the properties
                    me.add(minecraftServerProperties);
                }

                // if (me.count()) {
                //     me.each(function (propertySet) {
                //         for (propertyIndex = 0; propertyIndex < minecraftServerProperties.length; propertyIndex++) {
                //             if (debugMinecraftProperties) {
                //                 console.log('minecraftServerProperties[propertyIndex]:', minecraftServerProperties[propertyIndex]);
                //                 console.log('Setting Minecraft server property "' + propertySet.get(minecraftServerProperties[propertyIndex]['name']) + '" to "' + minecraftServerProperties[propertyIndex]['value'] + '"');
                //             }
                //             propertySet.set(propertySet.get(minecraftServerProperties[propertyIndex]['name']), minecraftServerProperties[propertyIndex]['value']);
                //         }
                //     });
                // } else {
                //     propertySet = Ext.create('MinecraftServerManager.model.MinecraftServerProperties');
                //     for (propertyIndex = 0; propertyIndex < minecraftServerProperties.length; propertyIndex++) {
                //         if (debugMinecraftProperties) {
                //             console.log('minecraftServerProperties[propertyIndex]:', minecraftServerProperties[propertyIndex]);
                //             console.log('Setting Minecraft server property "' + propertySet.get(minecraftServerProperties[propertyIndex]['name']) + '" to "' + minecraftServerProperties[propertyIndex]['value'] + '"');
                //         }
                //         propertySet.set(propertySet.get(minecraftServerProperties[propertyIndex]['name']), minecraftServerProperties[propertyIndex]['value']);
                //     }
                //     me.add(propertySet);
                // }
            },
            failure: function() {
                if (debugMinecraftProperties) {
                    console.log('Failed to get Minecraft server properties.');
                }
            }
        });
    }
});
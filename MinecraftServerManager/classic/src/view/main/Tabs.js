
Ext.define('MinecraftServerManager.view.main.Tabs', {
    extend: 'Ext.tab.Panel',
    plugins: 'viewport',

    requires: [
        'Ext.plugin.Viewport',
        'MinecraftServerManager.view.main.Main',
        'MinecraftServerManager.view.main.MainController',
        'MinecraftServerManager.view.main.MainModel',
        'MinecraftServerManager.view.minecraftserver.Main'
    ],

    xtype: 'app-main-tabs',
    controller: 'main',
    viewModel: 'main',

    ui: 'navigation',

    tabBarHeaderPosition: 1,
    titleRotation: 0,
    tabRotation: 0,

    header: {
        layout: {
            align: 'stretchmax'
        },
        title: {
            bind: {
                text: '<img src="resources/images/header-banner1.33f7482083dc.jpg" width="270px" height="107px"/>' //+ '<br />{name}'
            },
            flex: 0
        }
    },

    tabBar: {
        flex: 1,
        layout: {
            align: 'stretch',
            overflowHandler: 'none'
        }
    },

    responsiveConfig: {
        tall: {
            headerPosition: 'top'
        },
        wide: {
            headerPosition: 'left'
        }
    },

    defaults: {
        bodyPadding: 20,
        tabConfig: {
            plugins: 'responsive',
            responsiveConfig: {
                wide: {
                    iconAlign: 'left',
                    textAlign: 'left'
                },
                tall: {
                    iconAlign: 'top',
                    textAlign: 'center',
                    width: 120
                }
            }
        }
    },

    items: [
        {
            title: 'Player Management',
            iconCls: 'fa-user',
            items: [{
                xtype: 'app-main'
            }]
        }, {
            title: 'Minecraft Server Management',
            iconCls: 'fa-cog',
            items: [{
                xtype: 'minecraft-server-main'
            }]
        }
    ]
});

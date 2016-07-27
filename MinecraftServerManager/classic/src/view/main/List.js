
Ext.define('MinecraftServerManager.view.main.List', {
    extend: 'Ext.grid.Panel',
    xtype: 'mainlist',

    title: 'Players',
    alias: 'playersgrid',
    id: 'playersGrid',

    store: 'minecraftPlayersStore',
    height: 500,

    columns: [
        { text: 'Name', sortable: false, hideable: false, dataIndex: 'name', flex: 1 },
        { text: 'Properties', sortable: false, hideable: false, columns: [
            {
                sortable: false,
                hideable: false,
                hideHeaders: true,
                align: 'center',
                renderer: function(value, metaData, record) {
                    if (record.get('isOnline')) {
                        return '<img src="resources/images/Online2.png" alt="Online" />';
                    } else {
                        return '<img src="resources/images/Offline2.png" alt="Offline" />';
                    }
                }
            }
        ]},
        { text: 'Actions', sortable: false, hideable: false, columns: [
            {
                sortable: false,
                hideable: false,
                hideHeaders: true,
                align: 'center',
                width: 150,
                renderer: function(value ,meta, record) {
                    var id = Ext.id();
                    if (record.get('isOp')) {
                        Ext.defer(function() {
                            Ext.widget('button', {
                                renderTo: id,
                                text: 'DeOp Player',
                                icon: 'resources/images/GunPowder_Item-16.png',
                                scale: 'small',
                                handler: function() {
                                    record.deopPlayer();
                                }
                            });
                        }, 200);
                        return Ext.String.format('<div id="{0}"></div>', id);
                    } else {
                        Ext.defer(function() {
                            Ext.widget('button', {
                                renderTo: id,
                                text: 'Op Player',
                                icon: 'resources/images/RedstoneDust-16.png',
                                scale: 'small',
                                handler: function() {
                                    record.opPlayer();
                                }
                            });
                        }, 200);
                        return Ext.String.format('<div id="{0}"></div>', id);
                    }
                }
            }
        ]}
    ]
});


var playerStore = Ext.create('MinecraftServerManager.store.Players');

Ext.define('MinecraftServerManager.view.main.List', {
    extend: 'Ext.grid.Panel',
    xtype: 'mainlist',

    title: 'Players',
    alias: 'playersgrid',
    id: 'playersGrid',

    store: playerStore,

    columns: [
        { text: 'Name', sortable: false, hideable: false, dataIndex: 'name', flex: 1 },
        { text: 'Properties', sortable: false, hideable: false, columns: [
            {
                sortable: false,
                hideable: false,
                hideHeaders: true,
                renderer: function(value, metaData, record) {
                    if (record.data.isOp) {
                        return '<img src="resources/images/DiamondSword-16.png" />';
                    } else {
                        return '&nbsp;';
                    }
                }
            },{
                sortable: false,
                hideable: false,
                hideHeaders: true,
                renderer: function(value, metaData, record) {
                    if (record.data.isOnline) {
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
                    renderer: function(value, metaData, record){
                        if (record.isOp) {
                            return '<img src="resources/images/DiamondSword-16.png" />';
                        } else {
                            return '&nbsp;';
                        }
                    }
                }
            ]}
    ]
});


Ext.define('MinecraftServerManager.view.main.List', {
    extend: 'Ext.grid.Panel',
    requires: [
        'Ext.button.Segmented',
        'Ext.container.ButtonGroup',
        'Ext.grid.column.Action',
        'Ext.grid.column.Widget',
        'Ext.panel.Panel'
    ],

    xtype: 'player-list',

    title: 'Players',
    alias: 'playersgrid',
    id: 'playersGrid',

    store: 'minecraftPlayersStore',
    height: 500,

    columns: [{
        text: 'Name',
        sortable: false,
        hideable: false,
        width: 100,
        flex: 1,
        align: 'left',
        xtype: 'widgetcolumn',
        widget: {
            xtype: 'panel',
            header: false,
            bind: {
                html: '{record.name}'
            }
        }
    }, {
        text: 'Properties',
        sortable: false,
        hideable: false,
        hideHeaders: true,
        width: 100,
        flex: 1,
        align: 'center',
        xtype:'actioncolumn',
        items: [{
            tooltip: 'Online Status',
            getClass: function(v, meta, rec, rowIndex, colIndex, store) {
                if (rec.get('isOnline')) {
                    return 'x-fa fa-smile-o';
                } else {
                    return 'x-fa fa-frown-o';
                }
            }
        },{
            tooltip: 'Op Status',
            getClass: function(v, meta, rec, rowIndex, colIndex, store) {
                if (rec.get('isOp')) {
                    return 'x-fa fa-arrow-up'
                } else {
                    return 'x-fa fa-arrow-down';
                }
            }
        }]
    }, {
        text: 'Actions',
        sortable: false,
        hideable: false,
        hideHeaders: true,
        width: 100,
        flex: 1,
        align: 'center',
        xtype: 'widgetcolumn',
        widget: {
            xtype: 'panel',
            header: false,
            tbar: [{
                xtype: 'buttongroup',
                border: false,
                frame: false,
                items: [{
                    xtype: 'segmentedbutton',
                    allowMultiple: true,
                    // TODO add listeners for these state changes
                    items:[{
                        text: 'Op/DeOp',
                        value: 'isOp'
                    }, {
                        text: 'Kick',
                        value: 'kick'
                    }, {
                        text: 'Ban',
                        value: 'isBanned'
                    }, {
                        text: 'Whitelist',
                        value: 'isWhitelisted'
                    }],
                    bind: '{record.playerActionAttributes}'
                    // TODO listener to change the values on the backend properly
                }]
            }]
        }
    }],

    setActionButtons: function () {
        var me = this;
        debugger;
        return [];
    }
});

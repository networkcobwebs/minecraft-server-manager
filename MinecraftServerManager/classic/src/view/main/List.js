
Ext.define('MinecraftServerManager.view.main.List', {
    extend: 'Ext.grid.Panel',
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
        dataIndex: 'name',
        width: 100,
        flex: 1,
        align: 'left'
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
            iconCls: 'fa-frown-o',
            tooltip: 'User Status',
            getClass: function(v, meta, rec, rowIndex, colIndex, store) {
                if (rec.get('isOnline')) {
                    return 'x-fa fa-smile-o';
                } else {
                    return 'x-fa fa-frown-o';
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
        xtype:'actioncolumn',
        items: [{
            tooltip: 'Op Status',
            getClass: function(v, meta, rec, rowIndex, colIndex, store) {
                if (rec.get('isOp')) {
                    return 'x-fa fa-arrow-up'
                } else {
                    return 'x-fa fa-arrow-down';
                }
            }
        }]
    }],
    /** ,
    { text: 'Actions', sortable: false, hideable: false, flex: 1, columns: [
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
        },
        {
            sortable: false,
            hideable: false,
            hideHeaders: true,
            align: 'center',
            width: 150,
            renderer: function(value ,meta, record) {
                var id = Ext.id();
                Ext.defer(function() {
                    Ext.widget('button', {
                        renderTo: id,
                        text: 'Whitelist Player',
                        icon: 'resources/images/RedstoneDust-16.png',
                        scale: 'small',
                        handler: function() {
                            record.opPlayer();
                        }
                    });
                }, 200);
                return Ext.String.format('<div id="{0}"></div>', id);
            }
        },
        {
            sortable: false,
            hideable: false,
            hideHeaders: true,
            align: 'center',
            width: 150,
            renderer: function(value ,meta, record) {
                var id = Ext.id();
                Ext.defer(function() {
                    Ext.widget('button', {
                        renderTo: id,
                        text: 'De-Whitelist Player',
                        icon: 'resources/images/RedstoneDust-16.png',
                        scale: 'small',
                        handler: function() {
                            record.opPlayer();
                        }
                    });
                }, 200);
                return Ext.String.format('<div id="{0}"></div>', id);
            }
        },
        {
            sortable: false,
            hideable: false,
            hideHeaders: true,
            align: 'center',
            width: 150,
            renderer: function(value ,meta, record) {
                var id = Ext.id();
                Ext.defer(function() {
                    Ext.widget('button', {
                        renderTo: id,
                        text: 'Kick Player',
                        icon: 'resources/images/RedstoneDust-16.png',
                        scale: 'small',
                        handler: function() {
                            record.opPlayer();
                        }
                    });
                }, 200);
                return Ext.String.format('<div id="{0}"></div>', id);
            }
        },
        {
            sortable: false,
            hideable: false,
            hideHeaders: true,
            align: 'center',
            width: 150,
            renderer: function(value ,meta, record) {
                var id = Ext.id();
                Ext.defer(function() {
                    Ext.widget('button', {
                        renderTo: id,
                        text: 'Ban Player',
                        icon: 'resources/images/RedstoneDust-16.png',
                        scale: 'small',
                        handler: function() {
                            record.opPlayer();
                        }
                    });
                }, 200);
                return Ext.String.format('<div id="{0}"></div>', id);
            }
        },
        {
            sortable: false,
            hideable: false,
            hideHeaders: true,
            align: 'center',
            width: 150,
            renderer: function(value ,meta, record) {
                var id = Ext.id();
                Ext.defer(function() {
                    Ext.widget('button', {
                        renderTo: id,
                        text: 'Un-Ban Player',
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
    ]}
     */
});

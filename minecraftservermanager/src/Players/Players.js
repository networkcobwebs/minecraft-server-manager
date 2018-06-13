import React from 'react';

import axios from 'axios';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';

import PlayerListItem from './PlayerListItem';

const styles = {
    container: {
        margin: 10,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.95rem'
    }
};

export default class Players extends React.Component {
    state = {};
    constructor(props) {
        super(props);
        this.state = {
            players: []
        };
    };

    componentDidMount () {
        this.determinePlayerStates();
    }

    determinePlayerStates () {
        let minecraftState = this.props.minecraftState,
            minecraftPlayerCache = minecraftState.minecraftServerUserCache,
            players = [],
            player;

        minecraftPlayerCache.forEach(cachedPlayer => {
            player = {};
            player.name = cachedPlayer.name;
            player.key = cachedPlayer.uuid;
            player.online = this.determineOnlineStatus(cachedPlayer);
            player.banned = this.determineBanStatus(cachedPlayer);
            player.whitelisted = this.determineWhitelistStatus(cachedPlayer);
            player.opped = this.determineOpStatus(cachedPlayer);
            players.push(player);
        });
        this.setState({ players });
    };

    determineBanStatus (player) {
        let minecraftState = this.props.minecraftState,
            minecraftBannedPlayers = minecraftState.minecraftServerBannedPlayers,
            banned = false;

        minecraftBannedPlayers.forEach(bannedPlayer => {
            if (bannedPlayer.name === player.name) {
                banned = true;
            }
        });
        return banned;
    };
    
    determineWhitelistStatus (player) {
        let minecraftState = this.props.minecraftState,
            minecraftWhitelist = minecraftState.minecraftServerWhitelist,
            whitelisted = false;

        minecraftWhitelist.forEach(p => {
            if (p.name === player.name) {
                whitelisted = true;
            }
        });
        return whitelisted;
    }

    determineOnlineStatus (player) {
        let minecraftState = this.props.minecraftState,
            onlinePlayers = minecraftState.playerNames,
            minecraftPlayerCache = minecraftState.minecraftServerUserCache,
            online = false;

        minecraftPlayerCache.forEach(c => {
            onlinePlayers.forEach(o => {
                if (player.name === o.name || c.name === o.name) {
                    online = true;
                }
            });
        });
        return online;
    };

    determineOpStatus (player) {
        let minecraftState = this.props.minecraftState,
            minecraftOps = minecraftState.minecraftServerOps,
            opped = false;

        minecraftOps.forEach(op => {
            if (op.name === player.name) {
                opped = true;
            }
        });
        return opped;
    };

    banPlayer = player => {
        let found = false,
            players = this.state.players;

        players.forEach(p => {
            if (p.name === player) {
                found = true;
            }
        });
        
        if (found) {
            axios({
                method: 'post',
                url: '/api/command',
                params: {
                    command: '/ban ' + player.name
                }
            }).then(res => {
                return;
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            });
        }
    }

    unbanPlayer = player => {
        let found = false,
            players = this.state.players;

        players.forEach(p => {
            if (p.name === player) {
                found = true;
            }
        });

        if (found) {
            axios({
                method: 'post',
                url: '/api/command',
                params: {
                    command: '/unban ' + player.name
                }
            }).then(res => {
                return;
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            });
        }
    }

    kickPlayer = player => {
        let found = false,
            players = this.state.players;

        players.forEach(p => {
            if (p.name === player) {
                found = true;
            }
        });

        if (found) {
            axios({
                method: 'post',
                url: '/api/command',
                params: {
                    command: '/kick ' + player.name
                }
            }).then(res => {
                return;
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            });
        }
    }

    opPlayer = player => {
        let found = false,
            players = this.state.players;

        players.forEach(p => {
            if (p.name === player) {
                found = true;
            }
        });

        if (found) {
            axios({
                method: 'post',
                url: '/api/command',
                params: {
                    command: '/op ' + player
                }
            }).then(res => {
                return;
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            });
        }
    }

    deopPlayer = player => {
        let found = false,
            players = this.state.players;

        players.forEach(p => {
            if (p.name === player) {
                found = true;
            }
        });

        if (found) {
            axios({
                method: 'post',
                url: '/api/command',
                params: {
                    command: '/deop ' + player
                }
            }).then(res => {
                return;
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            });
        }
    }

    whitelistPlayer = player => {
        let found = false,
            players = this.state.players;

        players.forEach(p => {
            if (p.name === player) {
                found = true;
            }
        });

        if (found) {
            axios({
                method: 'post',
                url: '/api/command',
                params: {
                    command: '/whitelist ' + player.name
                }
            }).then(res => {
                return;
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            });
        }
    }

    displayPlayerListItems = player =>
        <PlayerListItem
            key = { player.key }
            player = { player }
            banPlayer = { this.banPlayer }
            unbanPlayer = { this.unbanPlayer }
            kickPlayer = { this.kickPlayer }
            opPlayer = { this.opPlayer }
            deopPlayer = { this.deopPlayer }
            whitelistPlayer = { this.whitelistPlayer }
        />;

    render () {
        return (
            <div style = { styles.container }>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Player</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { this.state.players.map(this.displayPlayerListItems) }
                    </TableBody>
                </Table>
            </div>
        );
    };
}

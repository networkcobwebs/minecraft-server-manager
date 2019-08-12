import React from 'react';
import PropTypes from 'prop-types';

import axios from 'axios';

import 'typeface-roboto';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

import PlayerListItem from './PlayerListItem';

const styles = {
    container: {
        margin: 10,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.95rem'
    }
};

export default class Players extends React.Component {
    constructor(props) {
        super(props);
        this.banPlayer = this.banPlayer.bind(this);
        this.deopPlayer = this.deopPlayer.bind(this);
        this.displayPlayerListItems = this.displayPlayerListItems.bind(this);
        this.kickPlayer = this.kickPlayer.bind(this);
        this.opPlayer = this.opPlayer.bind(this);
        this.pardonPlayer = this.pardonPlayer.bind(this);
        this.whitelistPlayer = this.whitelistPlayer.bind(this);
    }

    banPlayer (player) {
        let found = false,
            players = this.props.minecraftProperties.playerInfo.players;

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
                    command: '/ban ' + player
                }
            }).then(() => {
                return;
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            });
        }
    }

    pardonPlayer (player) {
        let found = false,
            players = this.props.minecraftProperties.playerInfo.players;

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
                    command: '/pardon ' + player
                }
            }).then(() => {
                return;
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            });
        }
    }

    kickPlayer (player) {
        let found = false,
            players = this.props.minecraftProperties.playerInfo.players;

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
                    command: '/kick ' + player
                }
            }).then(() => {
                return;
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            });
        }
    }

    opPlayer (player) {
        let found = false,
            players = this.props.minecraftProperties.playerInfo.players;

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
            }).then(() => {
                return;
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            });
        }
    }

    deopPlayer (player) {
        let found = false,
            players = this.props.minecraftProperties.playerInfo.players;

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
            }).then(() => {
                return;
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            });
        }
    }

    whitelistPlayer (player) {
        let found = false,
            players = this.props.minecraftProperties.playerInfo.players;

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
                    command: '/whitelist ' + player
                }
            }).then(() => {
                return;
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            });
        }
    }

    displayPlayerListItems (player) {
        return (
            <PlayerListItem
                key = { player.key }
                player = { player }
                banPlayer = { this.banPlayer }
                pardonPlayer = { this.pardonPlayer }
                kickPlayer = { this.kickPlayer }
                opPlayer = { this.opPlayer }
                deopPlayer = { this.deopPlayer }
                whitelistPlayer = { this.whitelistPlayer }
            />
        );
    }

    render () {
        let minecraftProperties = this.props.minecraftProperties;
        let playerInfo = minecraftProperties.playerInfo;
        let players = [];
        let summary = '';
        
        if (playerInfo && playerInfo.players) {
            summary = playerInfo.summary;
            players = playerInfo.players;
        }
        
        return (
            <div style = { styles.container }>
                <Typography variant="subtitle1">
                    { summary ? summary : 'Waiting on Minecraft server...' }
                </Typography>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    Player
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    Status
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    Actions
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { players.map(this.displayPlayerListItems) }
                    </TableBody>
                </Table>
            </div>
        );
    }
}

Players.propTypes = {
    minecraftProperties: PropTypes.object.isRequired
};

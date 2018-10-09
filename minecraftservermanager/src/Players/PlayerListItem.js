import React from 'react';

import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Tooltip from '@material-ui/core/Tooltip';

import IconButton from '@material-ui/core/IconButton';
import OpStatus from '@material-ui/icons/VerifiedUser';
import NetworkOnline from '@material-ui/icons/SignalWifi4Bar';
import NetworkOffline from '@material-ui/icons/SignalWifiOff';
import Kick from '@material-ui/icons/DoNotDisturbOn';
import Ban from '@material-ui/icons/DoNotDisturb';
import WhitelistIcon from '@material-ui/icons/PlaylistAdd';

export default class PlayerListItem extends React.Component {

    banPlayer = () => {
        this.props.banPlayer(this.props.player.name);
    }
    pardonPlayer = () => {
        this.props.pardonPlayer(this.props.player.name);
    }
    kickPlayer = () => {
        this.props.kickPlayer(this.props.player.name);
    }
    opPlayer = () => {
        this.props.opPlayer(this.props.player.name);
    }
    deopPlayer = () => {
        this.props.deopPlayer(this.props.player.name);
    }
    whitelistPlayer = () => {
        this.props.whitelistPlayer(this.props.player.name);
    }

    render () {
        let player = this.props.player;

        return (
            <TableRow>
                <TableCell>{ player.name }</TableCell>
                <TableCell>{ player.online ? 
                    <Tooltip title="Online">
                        <NetworkOnline />
                    </Tooltip> : 
                    <Tooltip title="Offline">
                        <NetworkOffline />
                    </Tooltip>
                }{ player.opped ?
                    <Tooltip title="Opped">
                        <OpStatus />
                    </Tooltip> : <span></span>
                }{ player.banned ?
                    <Tooltip title="Banned">
                        <Ban />
                    </Tooltip> : <span></span>
                }{ player.whitelisted ?
                    <Tooltip title="Whitelisted">
                        <WhitelistIcon />
                    </Tooltip> : <span></span>
                }</TableCell>
                <TableCell>
                    { player.banned ?
                    <IconButton onClick = { this.pardonPlayer }>
                        <Tooltip title="Pardon">
                            <Ban />
                        </Tooltip>
                    </IconButton> : 
                    <IconButton onClick = { this.banPlayer }>
                        <Tooltip title="Ban">
                            <Ban />
                        </Tooltip>
                    </IconButton>
                    }
                    <IconButton onClick = { this.kickPlayer }>
                        <Tooltip title="Kick">
                            <Kick />
                        </Tooltip>
                    </IconButton>
                    { player.opped ?
                    <IconButton onClick = { this.deopPlayer }>
                        <Tooltip title="De Op">
                            <OpStatus />
                        </Tooltip>
                    </IconButton> : 
                    <IconButton onClick = { this.opPlayer }>
                        <Tooltip title="Op">
                            <OpStatus />
                        </Tooltip>
                    </IconButton>
                    }{ !player.whitelisted ?
                    <IconButton onClick = { this.whitelistPlayer }>
                        <Tooltip title="Whitelist">
                            <WhitelistIcon />
                        </Tooltip>
                    </IconButton> : <div></div>
                    }
                </TableCell>
            </TableRow>
        );
    }
}
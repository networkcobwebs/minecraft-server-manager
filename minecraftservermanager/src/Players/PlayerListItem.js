import React from 'react';
import PropTypes from 'prop-types';

import 'typeface-roboto';
import Ban from '@material-ui/icons/Error';
import IconButton from '@material-ui/core/IconButton';
import Kick from '@material-ui/icons/Error';
import NetworkOnline from '@material-ui/icons/SignalWifi4Bar';
import NetworkOffline from '@material-ui/icons/SignalWifiOff';
import OpStatus from '@material-ui/icons/VerifiedUser';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import WhitelistIcon from '@material-ui/icons/PlaylistAdd';

export default class PlayerListItem extends React.Component {

    banPlayer () {
        this.props.banPlayer(this.props.player.name);
    }
    pardonPlayer () {
        this.props.pardonPlayer(this.props.player.name);
    }
    kickPlayer () {
        this.props.kickPlayer(this.props.player.name);
    }
    opPlayer () {
        this.props.opPlayer(this.props.player.name);
    }
    deopPlayer () {
        this.props.deopPlayer(this.props.player.name);
    }
    whitelistPlayer () {
        this.props.whitelistPlayer(this.props.player.name);
    }

    render () {
        let player = this.props.player;

        return (
            <TableRow>
                <TableCell>
                    <Typography>
                        { player.name }
                    </Typography>
                </TableCell>
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
                    }
                    { !player.whitelisted ?
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

PlayerListItem.propTypes = {
    player: PropTypes.object.isRequired,
    whitelistPlayer: PropTypes.func.isRequired,
    deopPlayer: PropTypes.func.isRequired,
    opPlayer: PropTypes.func.isRequired,
    kickPlayer: PropTypes.func.isRequired,
    pardonPlayer: PropTypes.func.isRequired,
    banPlayer: PropTypes.func.isRequired
};

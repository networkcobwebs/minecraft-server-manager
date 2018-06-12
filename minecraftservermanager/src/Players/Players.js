import React from 'react';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
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

const styles = {
    container: {
        margin: 10
    }
};

class Players extends React.Component {
    render () {
        return (
            <div style={ styles.container }>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Player</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>nickrnet</TableCell>
                            <TableCell>
                            <Tooltip title="Online">
                                <NetworkOnline />
                            </Tooltip>
                            <Tooltip title="Opped">
                                <OpStatus />
                            </Tooltip>
                            </TableCell>
                            <TableCell>
                                <IconButton>
                                    <Tooltip title="Kick">
                                        <Kick />
                                    </Tooltip>
                                </IconButton>
                                <IconButton>
                                    <Tooltip title="Ban">
                                        <Ban />
                                    </Tooltip>
                                </IconButton>
                                <IconButton>
                                    <Tooltip title="Whitelist">
                                        <WhitelistIcon />
                                    </Tooltip>
                                </IconButton>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>ethanrogue01</TableCell>
                            <TableCell>
                                <Tooltip title="Offline">
                                    <NetworkOffline />
                                </Tooltip>
                            </TableCell>
                            <TableCell>
                                <IconButton>
                                    <Tooltip title="Kick">
                                        <Kick />
                                    </Tooltip>
                                </IconButton>
                                <IconButton>
                                    <Tooltip title="Ban">
                                        <Ban />
                                    </Tooltip>
                                </IconButton>
                                <IconButton>
                                    <Tooltip title="Whitelist">
                                        <WhitelistIcon />
                                    </Tooltip>
                                </IconButton>
                                <IconButton>
                                    <Tooltip title="Op">
                                        <OpStatus />
                                    </Tooltip>
                                </IconButton>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>lukerogue01</TableCell>
                            <TableCell>
                                <Tooltip title="Offline">
                                    <NetworkOffline />
                                </Tooltip>
                            </TableCell>
                            <TableCell>
                                <IconButton>
                                    <Tooltip title="Kick">
                                        <Kick />
                                    </Tooltip>
                                </IconButton>
                                <IconButton>
                                    <Tooltip title="Ban">
                                        <Ban />
                                    </Tooltip>
                                </IconButton>
                                <IconButton>
                                    <Tooltip title="Whitelist">
                                        <WhitelistIcon />
                                    </Tooltip>
                                </IconButton>
                                <IconButton>
                                    <Tooltip title="Op">
                                        <OpStatus />
                                    </Tooltip>
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    }
}

export default Players;

import React from 'react';
import PropTypes from 'prop-types';

import 'typeface-roboto';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

import CheckCircle from '@material-ui/icons/CheckCircle';
import Error from '@material-ui/icons/Error';
import AssignmentLate from '@material-ui/icons/AssignmentLate';

const styles = {
    container: {
        margin: 10,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.95rem'
    }
};

function formatTime (seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [
        h,
        m > 9 ? m : '0' + m,
        s > 9 ? s : '0' + s,
    ].filter(s => s).join(':');
}

class ServerSummary extends React.Component {
    minecraftEulaAcceptedStatus () {
        let minecraftProperties = this.props.minecraftProperties;
        
        if (minecraftProperties && minecraftProperties.acceptedEula) {
            return (
                <div>
                    <Tooltip title="Accepted">
                        <CheckCircle />
                    </Tooltip>
                </div>
            );
        } else {
            return (
                <div>
                    <Tooltip title="Not accepted">
                        <Error />
                    </Tooltip>
                </div>
            );
        }
    }

    minecraftOnline () {
        let minecraftProperties = this.props.minecraftProperties;
        
        if (minecraftProperties && minecraftProperties.started) {
            return (
                <div>
                    <Tooltip title="Running">
                        <CheckCircle />
                    </Tooltip>
                </div>
            );
        } else {
            return (
                <div>
                    <Tooltip title="Minecraft is not running">
                        <Error />
                    </Tooltip>
                </div>
            );
        }
    }
    
    minecraftUpdate () {
        let minecraftProperties = this.props.minecraftProperties;
    
        if (minecraftProperties && minecraftProperties.updateAvailable) {
            return (
                <div>
                    <Tooltip title="Update Available">
                        <AssignmentLate />
                    </Tooltip>
                </div>
            );
        } else {
            return <div></div>;
        }
    }
    
    minecraftVersion () {
        let minecraftProperties = this.props.minecraftProperties;
    
        if (minecraftProperties && minecraftProperties.detectedVersion && minecraftProperties.detectedVersion.major) {
            return (
                <TableCell>
                    <Typography>
                        { minecraftProperties.detectedVersion.major + '.' + minecraftProperties.detectedVersion.minor + '.' + minecraftProperties.detectedVersion.release }
                    </Typography>
                </TableCell>
            );
        } else {
            return <TableCell></TableCell>;
        }
    }

    minecraftUptime () {
        let minecraftProperties = this.props.minecraftProperties;
        let rightNow = Date.now();
        let uptime = 0;
    
        if (minecraftProperties && minecraftProperties.started && minecraftProperties.startTime > 0) {
            uptime = (rightNow - minecraftProperties.startTime)/1000;
            return (
                <TableCell>
                    <Typography>
                        { formatTime(uptime) }
                    </Typography>
                </TableCell>
            );
        } else {
            return(
                <TableCell></TableCell>
            );
        }
    }

    render () {
        return (
            <div style={ styles.container }>
                <Typography variant="subtitle1">
                    Server Information
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    Minecraft Status
                                </Typography>
                            </TableCell>
                            <TableCell>
                                { this.minecraftOnline() }
                            </TableCell>
                            <TableCell>
                                { this.minecraftUpdate() }
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    EULA Accepted
                                </Typography>
                            </TableCell>
                            <TableCell>
                                { this.minecraftEulaAcceptedStatus() }
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    Minecraft Version
                                </Typography>
                            </TableCell>
                            { this.minecraftVersion() }
                            <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    Server Address
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography>
                                    { this.props.ipInfo.address ? this.props.ipInfo.address + ':' + this.props.ipInfo.port : 'Not known.' }
                                </Typography>
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    Server Uptime
                                </Typography>
                            </TableCell>
                            { this.minecraftUptime() }
                            <TableCell></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    }
}

ServerSummary.propTypes = {
    ipInfo: PropTypes.object.isRequired,
    minecraftProperties: PropTypes.object.isRequired
};

export default ServerSummary;

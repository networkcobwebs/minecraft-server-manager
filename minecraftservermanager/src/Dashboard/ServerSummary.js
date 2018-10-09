import React from 'react';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Tooltip from '@material-ui/core/Tooltip';

import ServerOnline from '@material-ui/icons/CheckCircle';
import ServerOffline from '@material-ui/icons/Error';
import UpdateAvailable from '@material-ui/icons/AssignmentLate';

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
    minecraftOnline () {
        let minecraftStatus = this.props.minecraftState.minecraftStatus;
        
        if (minecraftStatus && minecraftStatus.minecraftOnline) {
            return (
                <Tooltip title="Running">
                    <ServerOnline />
                </Tooltip>
            );
        } else {
            return (
                <Tooltip title="Problem">
                    <ServerOffline />
                </Tooltip>
            );
        }
    }
    
    minecraftUpdate () {
        let minecraftStatus = this.props.minecraftState.minecraftStatus;
    
        if (minecraftStatus && minecraftStatus.updateAvailable) {
            return (
                <Tooltip title="Update Available">
                    <UpdateAvailable />
                </Tooltip>
            );
        } else {
            return <div></div>;
        }
    }
    
    minecraftVersion () {
        let minecraftStatus = this.props.minecraftState.minecraftStatus;
    
        if (minecraftStatus && minecraftStatus.minecraftVersion) {
            return (
                <TableCell>{ minecraftStatus.minecraftVersion }</TableCell>
            );
        } else {
            return <TableCell></TableCell>;
        }
    }

    minecraftUptime () {
        let minecraftStatus = this.props.minecraftState.minecraftStatus;
    
        if (minecraftStatus && minecraftStatus.uptime) {
            return (
                <TableCell>{ formatTime(minecraftStatus.uptime / 1000) }</TableCell>
            );
        } else {
            return(
                <TableCell></TableCell>
            );
        }
    }

    minecraftServerUptime () {
        let minecraftStatus = this.props.minecraftState.minecraftStatus;
    
        if (minecraftStatus && minecraftStatus.minecraftUptime) {
            return (
                <TableCell>{ formatTime(minecraftStatus.minecraftUptime / 1000) }</TableCell>
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
                <h3>Server Information</h3>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>Server Address</TableCell>
                            <TableCell>localhost</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Server Uptime</TableCell>
                            { this.minecraftUptime() }
                            <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Minecraft Status</TableCell>
                            <TableCell>
                                { this.minecraftOnline() }
                            </TableCell>
                            <TableCell>
                                { this.minecraftUpdate() }
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Minecraft Version</TableCell>
                            { this.minecraftVersion() }
                            <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Minecraft Uptime</TableCell>
                            { this.minecraftServerUptime() }
                            <TableCell></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    }
}

export default ServerSummary;

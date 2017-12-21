import React, { Component } from 'react';

import Table, {
    TableBody,
    TableRow,
    TableCell,
} from 'material-ui/Table';
import Tooltip from 'material-ui/Tooltip';

import ServerOnline from 'material-ui-icons/CheckCircle';
import ServerOffline from 'material-ui-icons/Error';
import UpdateAvailable from 'material-ui-icons/AssignmentLate';

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

class ServerSummary extends Component {
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
        let minecraftStatus = this.props.minecraftState.minecraftStatus;

        if (minecraftStatus && minecraftStatus.uptime) {
            return (
                <div style={ styles.container }>
                    <h3>Server Information</h3>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell>Server Address</TableCell>
                                <TableCell>localhost</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Server Uptime</TableCell>
                                { this.minecraftUptime() }
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
                                <TableCell>1.11.2</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Minecraft Uptime</TableCell>
                                { this.minecraftServerUptime() }
                            </TableRow>
                            <TableRow>
                                <TableCell>World</TableCell>
                                <TableCell>world</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            );
        } else {
            return <div></div>;
        }
    }
}

export default ServerSummary;

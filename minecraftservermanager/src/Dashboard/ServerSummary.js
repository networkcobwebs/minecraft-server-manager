import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Tooltip from '@material-ui/core/Tooltip';

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
    handleAcceptEula = () => {
        axios({
            method: 'post',
            url: '/api/acceptEula'
        }).catch(error => {
            console.log('An error occurred accepting the EULA:', error);
        });
    };

    minecraftAcceptEulaButton () {
        return (
            <Button onClick = { this.handleAcceptEula } color="primary" autoFocus>
                Accept
            </Button>
        );
    }
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
    
        if (minecraftProperties && minecraftProperties.detectedVersion) {
            return (
                <TableCell>{ minecraftProperties.detectedVersion }</TableCell>
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
                <TableCell>{ formatTime(uptime) }</TableCell>
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
                            <TableCell>Minecraft Status</TableCell>
                            <TableCell>
                                { this.minecraftOnline() }
                            </TableCell>
                            <TableCell>
                                { this.minecraftUpdate() }
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>EULA Accepted</TableCell>
                            <TableCell>
                                { this.minecraftEulaAcceptedStatus() }
                            </TableCell>
                            <TableCell>{ this.props.minecraftProperties.acceptedEula ? <div></div> : this.minecraftAcceptEulaButton() }</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Minecraft Version</TableCell>
                            { this.minecraftVersion() }
                            <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Server Address</TableCell>
                            <TableCell>{ this.props.ipInfo.address ? this.props.ipInfo.address + ':' + this.props.ipInfo.port : 'Not known.' }</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Server Uptime</TableCell>
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

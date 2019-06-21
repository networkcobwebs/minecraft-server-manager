import React from 'react';
import PropTypes from 'prop-types';

import axios from 'axios';

import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import MenuItem from '@material-ui/core/MenuItem';
import Restart from '@material-ui/icons/Autorenew';
import Select from '@material-ui/core/Select';
import Start from '@material-ui/icons/PlayArrow';
import Stop from '@material-ui/icons/Stop';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Typography from '@material-ui/core/Typography';
import UpdateAvailable from '@material-ui/icons/AssignmentLate';

import ActionInProgressDialog from './ActionInProgressDialog.js';
import ConfirmVersionDialog from './ConfirmVersionDialog.js';
import ServerProperties from './ServerProperties.js';

const styles = {
    container: {
        margin: 10,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.95rem'
    }
};

class ServerControls extends React.Component {
    constructor (props) {
        super(props);
        let detectedVersion = props.minecraftProperties.detectedVersion;
        if (!detectedVersion) {
            detectedVersion = 'latest';
        }
        
        this.state = {
            progressDialogOpen: false,
            versionDialogOpen: false,
            versionToInstall: detectedVersion
        };
        this.checkVersionToInstall = this.checkVersionToInstall.bind(this);
        this.closeProgressDialog = this.closeProgressDialog.bind(this);
        this.closeVersionDialog = this.closeVersionDialog.bind(this);
        this.handleVersionConfirmation = this.handleVersionConfirmation.bind(this);
        this.openProgressDialog = this.openProgressDialog.bind(this);
        this.installMinecraft = this.installMinecraft.bind(this);
        this.restartMinecraft = this.restartMinecraft.bind(this);
        this.selectVersionToInstall = this.selectVersionToInstall.bind(this);
        this.startMinecraft = this.startMinecraft.bind(this);
        this.stopMinecraft = this.stopMinecraft.bind(this);
    }
    
    openProgressDialog () {
        this.setState({ progressDialogOpen: true });
    }
    
    closeProgressDialog () {
        this.setState({ progressDialogOpen: false });
    }

    closeVersionDialog () {
        this.setState({ versionToInstall: this.props.minecraftProperties.detectedVersion });
        this.setState({ versionDialogOpen: false });
    }
    
    checkVersionToInstall () {
        if (this.state.versionToInstall !== this.props.minecraftProperties.detectedVersion) {
            this.setState({ versionDialogOpen: true });
        }
    }

    displayReleaseVersions (version) {
        return (
            <MenuItem
                key={ version.id }
                value={ version.id }>
                { version.id }
            </MenuItem>
        );
    }

    handleVersionConfirmation (value) {
        this.closeVersionDialog();

        if (value) {
            this.installMinecraft();
        }
    }

    installMinecraft () {
        this.setState({ progressDialogOpen: true });
        this.props.stopMinecraftStatus();
        axios({
            method: 'post',
            url: `/api/install`,
            params: {
                version: this.state.versionToInstall
            }
        }).then(() => {
            this.props.startMinecraftStatus();
            this.setState({ progressDialogOpen: false });
            this.selectVersionToInstall({target: {value: this.props.minecraftProperties.detectedVersion}});
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
        });
    }

    restartMinecraft () {
        this.setState({ progressDialogOpen: true });
        this.props.stopMinecraftStatus();
        axios({
            method: 'post',
            url: `/api/restart`
        }).then(() => {
            this.props.startMinecraftStatus();
            this.setState({ progressDialogOpen: false });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
        });
    }

    selectVersionToInstall (selectedVersionToInstall) {
        let minecraftProperties = this.props.minecraftProperties,
            releaseVersions = minecraftProperties.versions.releaseVersions,
            versionToInstall = '';

        for (let releaseVersion of releaseVersions) {
            if (releaseVersion.id === selectedVersionToInstall.target.value) {
                versionToInstall = releaseVersion.id;
                break;
            }
        }
        if (!versionToInstall) {
            versionToInstall = 'latest';
        }
        this.setState({ versionToInstall });
    }
    
    startMinecraft () {
        this.setState({ progressDialogOpen: true });
        axios({
            method: 'post',
            url: `/api/start`
        }).then(() => {
            this.props.startMinecraftStatus();
            this.setState({ progressDialogOpen: false });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
        });
    }
  
    stopMinecraft () {
        this.setState({ progressDialogOpen: true });
        axios({
            method: 'post',
            url: `/api/stop`
        }).then(() => {
            this.props.stopMinecraftStatus();
            this.setState({ progressDialogOpen: false });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
        });
    }

    render () {
        let minecraftProperties = this.props.minecraftProperties;

        return (
            <div style={ styles.container }>
                <ActionInProgressDialog
                    open = { this.state.progressDialogOpen }
                    onClose = { this.closeProgressDialog }
                />
                <ConfirmVersionDialog
                    open = { this.state.versionDialogOpen }
                    onNo = { this.closeVersionDialog }
                    onYes = { this.handleVersionConfirmation }
                    detectedVersion = { minecraftProperties.detectedVersion }
                    selectedVersionToInstall = { this.state.versionToInstall }
                />
                <Typography variant="subtitle1">
                    Server Controls
                </Typography>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Button
                                    onClick={ this.startMinecraft }
                                    disabled={ minecraftProperties.started }
                                    variant="contained"
                                    color="primary">
                                    Start
                                    <Icon>
                                        <Start />
                                    </Icon>
                                </Button>
                                <Button
                                    onClick = { this.stopMinecraft }
                                    disabled = { !minecraftProperties.started }
                                    variant="contained"
                                    color="primary">
                                    Stop
                                    <Icon>
                                        <Stop />
                                    </Icon>
                                </Button>
                                <Button
                                    onClick = { this.restartMinecraft }
                                    disabled = { !minecraftProperties.started }
                                    variant="contained"
                                    color="primary">
                                    Restart
                                    <Icon>
                                        <Restart />
                                    </Icon>
                                </Button>
                            </TableCell>
                            <TableCell>
                                <Button
                                    onClick = { this.checkVersionToInstall }
                                    size="small"
                                    variant="contained"
                                    color="primary">
                                    Install
                                </Button>
                                <Select
                                    value={ this.state.versionToInstall }
                                    onChange={ this.selectVersionToInstall }>
                                    <MenuItem value="latest">
                                        <em>latest</em>
                                    </MenuItem>
                                    { minecraftProperties.versions && minecraftProperties.versions.releaseVersions ? minecraftProperties.versions.releaseVersions.map(this.displayReleaseVersions) : <div></div> }
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Button 
                                    disabled = { !minecraftProperties.upgradeAvailable }
                                    variant="contained"
                                    color="primary">
                                    <Icon>
                                        <UpdateAvailable />
                                    </Icon>
                                </Button>
                                <Button
                                    disabled
                                    size="small"
                                    variant="contained"
                                    color="primary">
                                    Check for updates
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <ServerProperties minecraftProperties = { minecraftProperties }/>
            </div>
        );
    }
}

ServerControls.propTypes = {
    minecraftProperties: PropTypes.object.isRequired,
    startMinecraftStatus: PropTypes.func.isRequired,
    stopMinecraftStatus: PropTypes.func.isRequired
};

export default ServerControls;

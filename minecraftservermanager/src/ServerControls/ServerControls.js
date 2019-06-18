import React from 'react';
import PropTypes from 'prop-types';

import axios from 'axios';

import Typography from '@material-ui/core/Typography';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Tooltip from '@material-ui/core/Tooltip';
import Icon from '@material-ui/core/Icon';
import Button from '@material-ui/core/Button';
import Start from '@material-ui/icons/PlayArrow';
import Stop from '@material-ui/icons/Stop';
import Restart from '@material-ui/icons/Autorenew';
import UpdateAvailable from '@material-ui/icons/AssignmentLate';

import ActionInProgressDialog from './ActionInProgressDialog.js/index.js';
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
        
        this.state = {
            progressDialogOpen: false
        };
        this.closeProgressDialog = this.closeProgressDialog.bind(this);
        this.openProgressDialog = this.openProgressDialog.bind(this);
        this.installMinecraft = this.installMinecraft.bind(this);
        this.restartMinecraft = this.restartMinecraft.bind(this);
        this.startMinecraft = this.startMinecraft.bind(this);
        this.stopMinecraft = this.stopMinecraft.bind(this);
    }
    
    openProgressDialog () {
        this.setState({ progressDialogOpen: true });
    }
    
    closeProgressDialog () {
        this.setState({ progressDialogOpen: false });
    }

    restartMinecraft () {
        this.setState({ progressDialogOpen: true });
        axios({
            method: 'post',
            url: `/api/restart`
        }).then(() => {
            this.setState({ progressDialogOpen: false });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
        });
    }

    installMinecraft () {
        this.setState({ progressDialogOpen: true });
        axios({
            method: 'post',
            url: `/api/install`
        }).then(() => {
            this.setState({ progressDialogOpen: false });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
        });
    }
    
    startMinecraft () {
        this.setState({ progressDialogOpen: true });
        axios({
            method: 'post',
            url: `/api/start`
        }).then(() => {
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
                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary expandIcon={ <ExpandMoreIcon />} >
                        <Typography>Server Controls</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <Tooltip title="Start">
                            <div>
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
                            </div>
                        </Tooltip>
                        <Tooltip title="Stop">
                            <div>
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
                            </div>
                        </Tooltip>
                        <Tooltip title="Restart">
                            <div>
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
                            </div>
                        </Tooltip>
                        <Tooltip title="Update">
                            <div>
                                <Button 
                                    disabled = { !minecraftProperties.upgradeAvailable }
                                    variant="contained"
                                    color="primary">
                                    <Icon>
                                        <UpdateAvailable />
                                    </Icon>
                                </Button>
                            </div>
                        </Tooltip>
                        <Button
                            size="small"
                            variant="contained"
                            color="primary">
                            Check for updates
                        </Button>
                        <Button
                            onClick = { this.installMinecraft }
                            size="small"
                            variant="contained"
                            color="primary">
                            Install
                        </Button>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <ServerProperties minecraftProperties = { minecraftProperties }/>
            </div>
        );
    }
}

ServerControls.propTypes = {
    minecraftProperties: PropTypes.object.isRequired
};

export default ServerControls;

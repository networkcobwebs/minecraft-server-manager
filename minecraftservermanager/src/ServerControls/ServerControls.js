import React from 'react';
import PropTypes from 'prop-types';

import axios from 'axios';

import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelActions from '@material-ui/core/ExpansionPanelActions';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Start from '@material-ui/icons/PlayArrow';
import Stop from '@material-ui/icons/Stop';
import Restart from '@material-ui/icons/Autorenew';
import Refresh from '@material-ui/icons/Cached';
import UpdateAvailable from '@material-ui/icons/AssignmentLate';

import ProgressDialog from './ProgressDialog.js';

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
                <ProgressDialog
                    open = { this.state.progressDialogOpen }
                    onClose = { this.closeProgressDialog }
                />
                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary expandIcon={ <ExpandMoreIcon />} >
                        Server Controls
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <IconButton
                            onClick={ this.startMinecraft }
                            disabled={ minecraftProperties.started }>
                            <Tooltip title="Start">
                                <Start />
                            </Tooltip>
                        </IconButton>
                        <IconButton
                            onClick = { this.stopMinecraft }
                            disabled = { !minecraftProperties.started }>
                            <Tooltip title="Stop">
                                <Stop />
                            </Tooltip>
                        </IconButton>
                        <IconButton
                            onClick = { this.restartMinecraft }
                            disabled = { !minecraftProperties.started }>
                            <Tooltip title="Restart">
                                <Restart />
                            </Tooltip>
                        </IconButton>
                        <IconButton 
                            disabled = { !minecraftProperties.upgradeAvailable }>
                            <Tooltip title="Update">
                                <UpdateAvailable />
                            </Tooltip>
                        </IconButton>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary expandIcon={ <ExpandMoreIcon /> }>
                        <div>
                            Server Properties
                            <IconButton >
                                <Tooltip title="Refresh">
                                    <Refresh />
                                </Tooltip>
                            </IconButton>
                        </div>
                    </ExpansionPanelSummary>
                    
                    { minecraftProperties && minecraftProperties.serverProperties.length ? minecraftProperties.serverProperties.map(property => {
                        return (
                            <ExpansionPanelDetails key={ property.name }>
                                <FormControl fullWidth>
                                    <InputLabel
                                        htmlFor="{ property.name }">
                                        { property.name }
                                    </InputLabel>
                                    <Input
                                        id = { property.name }
                                        value = { property.value }
                                        fullWidth />
                                </FormControl>
                            </ExpansionPanelDetails>
                        );
                    }) : 'Waiting on Minecraft server...' }
                    
                    <Divider />

                    <ExpansionPanelActions>
                        <Button size="small">
                            Cancel
                        </Button>
                        <Button size="small" color="primary">
                            Save
                        </Button>
                    </ExpansionPanelActions>
                </ExpansionPanel>
            </div>
        );
    }
}

ServerControls.propTypes = {
    minecraftProperties: PropTypes.object.isRequired
};

export default ServerControls;

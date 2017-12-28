import React, { Component } from 'react';

import axios from 'axios';

import ExpansionPanel, {
    ExpansionPanelSummary,
    ExpansionPanelDetails,
  } from 'material-ui/ExpansionPanel';
import IconButton from 'material-ui/IconButton';
import TextField from 'material-ui/TextField';
import Tooltip from 'material-ui/Tooltip';

import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import Start from 'material-ui-icons/PlayArrow';
import Stop from 'material-ui-icons/Stop';
import Restart from 'material-ui-icons/Replay';
import UpdateAvailable from 'material-ui-icons/AssignmentLate';


const styles = {
    container: {
        margin: 10,
        padding: 10,
        // border: '2px solid gray',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.95rem'
    }
  };
  
  function startMinecraft (event) {
      axios({
          method: 'post',
          url: `/api/command?command=/start`
      }).then(res => {
          let minecraftStatus = res.data;
          console.log('minecraftStatus:', minecraftStatus);
      },
      err => {
          console.log('An error occurred contacting the Minecraft server.', err);
      });
  }

function stopMinecraft (event) {
    axios({
        method: 'post',
        url: `/api/command?command=/stop`
    }).then(res => {
        let minecraftStatus = res.data;
        console.log('minecraftStatus:', minecraftStatus);
    },
    err => {
        console.log('An error occurred contacting the Minecraft server.', err);
    });
}

function restartMinecraft (event) {
    axios({
        method: 'post',
        url: `/api/command?command=/restart`
    }).then(res => {
        let minecraftStatus = res.data;
        console.log('minecraftStatus:', minecraftStatus);
    },
    err => {
        console.log('An error occurred contacting the Minecraft server.', err);
    });
}

class ServerControls extends Component {
    render () {
        let minecraftStatus = this.props.minecraftState.minecraftStatus,
            minecraftProperties = this.props.minecraftState.minecraftServerProperties;

        return (
            <div>
            <div style={ styles.container }>
                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                        Server Controls
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        { !minecraftStatus.minecraftOnline ? <div>Waiting on Minecraft server...</div> : 
                        <div>
                            <IconButton
                                onClick = { startMinecraft }>
                                <Tooltip title="Start">
                                    <Start />
                                </Tooltip>
                            </IconButton>
                            <IconButton
                                onClick = { stopMinecraft }>
                                <Tooltip title="Stop">
                                    <Stop />
                                </Tooltip>
                            </IconButton>
                            <IconButton
                                onClick = { restartMinecraft }>
                                <Tooltip title="Restart">
                                    <Restart />
                                </Tooltip>
                            </IconButton>
                            { this.props.minecraftState.minecraftStatus && this.props.minecraftState.minecraftStatus.updateAvailable ?
                            <IconButton>
                                <Tooltip title="Update">
                                    <UpdateAvailable />
                                </Tooltip>
                            </IconButton>
                            : <div></div> }
                        </div> }
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            </div>

            <div style={ styles.container }>
                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                        Server Properties
                    </ExpansionPanelSummary>
                    
                    { minecraftProperties.length ? minecraftProperties.map(property => {
                        return (
                            <ExpansionPanelDetails key={ property.name }>
                                <TextField
                                    label={ property.name }
                                    value={ property.value }
                                    margin="normal"
                                    fullWidth
                                />
                            </ExpansionPanelDetails>
                        )
                    }) : 'Waiting on Minecraft server...' }
                    
                </ExpansionPanel>
            </div>
            </div>
        );
    }
}

export default ServerControls;

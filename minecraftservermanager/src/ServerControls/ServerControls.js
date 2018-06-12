import React from 'react';

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
import Restart from '@material-ui/icons/Replay';
import UpdateAvailable from '@material-ui/icons/AssignmentLate';

const styles = {
    container: {
        margin: 10,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.95rem'
    }
  };
  
  function startMinecraft (event) {
      axios({
          method: 'post',
          url: `/api/command?command=/start`
      }).then(res => {},
      err => {
          console.log('An error occurred contacting the Minecraft server.', err);
      });
  }

function stopMinecraft (event) {
    axios({
        method: 'post',
        url: `/api/command?command=/stop`
    }).then(res => {},
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

class ServerControls extends React.Component {
    render () {
        let minecraftState = this.props.minecraftState,
            minecraftStatus = this.props.minecraftState.minecraftStatus,
            minecraftProperties = this.props.minecraftState.minecraftServerProperties;

        return (
            <div style={ styles.container }>
                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary expandIcon={ <ExpandMoreIcon />} >
                        Server Controls
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        { !minecraftState ? <div>Waiting on Minecraft server...</div> : 
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
                            { minecraftState && minecraftStatus.updateAvailable ?
                            <IconButton>
                                <Tooltip title="Update">
                                    <UpdateAvailable />
                                </Tooltip>
                            </IconButton>
                            : <div></div> }
                        </div> }
                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                        Server Properties
                    </ExpansionPanelSummary>
                    
                    { minecraftState && minecraftProperties.length ? minecraftProperties.map(property => {
                        return (
                            <ExpansionPanelDetails key={ property.name }>
                                {/* <TextField
                                    label={ property.name }
                                    value={ property.value }
                                    margin="normal"
                                    fullWidth
                                /> */}
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
                        )
                    }) : 'Waiting on Minecraft server...' }
                    
                    <Divider />

                    <ExpansionPanelActions>
                        <Button size="small">Cancel</Button>
                        <Button size="small" color="primary">
                            Save
                        </Button>
                    </ExpansionPanelActions>
                </ExpansionPanel>
            </div>
        );
    }
}

export default ServerControls;

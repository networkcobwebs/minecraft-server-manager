import React, { Component } from 'react';

import axios from 'axios';

import IconButton from 'material-ui/IconButton';
import Table, {
    TableBody,
    TableRow,
    TableCell,
} from 'material-ui/Table';
import TextField from 'material-ui/TextField';
import Tooltip from 'material-ui/Tooltip';

import Start from 'material-ui-icons/PlayArrow';
import Stop from 'material-ui-icons/Stop';
import Restart from 'material-ui-icons/Replay';


const styles = {
    container: {
        margin: 10,
        padding: 10,
        border: '2px solid gray',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.95rem'
    }
  };
  
  function startMinecraft (event) {
      axios({
          method: 'post',
          url: `http://localhost:3001/api/command?command=/start`
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
        url: `http://localhost:3001/api/command?command=/stop`
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
        url: `http://localhost:3001/api/command?command=/restart`
    }).then(res => {
        let minecraftStatus = res.data;
        console.log('minecraftStatus:', minecraftStatus);
    },
    err => {
        console.log('An error occurred contacting the Minecraft server.', err);
    });
}

class ServerControls extends Component {
    constructor (props) {
        super(props);

        this.state = {
            minecraftServerProperties: props.minecraftState.minecraftServerProperties
        };
    }

    render () {
        return (
            <div>
                <div style={ styles.container }>
                    <h3>Server Controls</h3>
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
                    </div>
                </div>
                <div style={ styles.container }>
                    <h3>Server Properties</h3>
                    <div>
                        { this.state.minecraftServerProperties.map(property => {
                            return (
                                <TextField
                                    key={ property.name }
                                    label={ property.name }
                                    value={ property.value }
                                    margin="normal"
                                    fullWidth
                                />
                            )
                        }) }
                    </div>
                </div>
            </div>
        );
    }
}

export default ServerControls;

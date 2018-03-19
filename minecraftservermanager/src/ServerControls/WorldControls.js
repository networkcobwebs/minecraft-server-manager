import React, { Component } from 'react';

import axios from 'axios';

import ExpansionPanel, {
    ExpansionPanelSummary,
    ExpansionPanelDetails,
  } from 'material-ui/ExpansionPanel';
import IconButton from 'material-ui/IconButton';
import Tooltip from 'material-ui/Tooltip';

import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import Backup from 'material-ui-icons/Backup';
import Restore from 'material-ui-icons/Restore';
import New from 'material-ui-icons/Autorenew';

const styles = {
    container: {
        margin: 10,
        padding: 10,
        // border: '2px solid gray',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.95rem'
    }
  };
  
  function backupMinecraftWorld (event) {
      axios({
          method: 'get',
          url: `/api/status`
      }).then(res => {
          let minecraftStatus = res.data;
          console.log('minecraftStatus:', minecraftStatus);
      },
      err => {
          console.log('An error occurred contacting the Minecraft server.', err);
      });
  }

function restoreMinecraftWorld (event) {
    // TODO query for a list of backups
    axios({
        method: 'get',
        url: `/api/status`
    }).then(res => {
        let minecraftStatus = res.data;
        console.log('minecraftStatus:', minecraftStatus);
    },
    err => {
        console.log('An error occurred contacting the Minecraft server.', err);
    });
}

function newMinecraftWorld (event) {
    // axios({
    //     method: 'get',
    //     url: '/api/status'
    // }).then(res => {
    //     let minecraftStatus = res.data;
    //     console.log('minecraftStatus:', minecraftStatus);
    // },
    // err => {
    //     console.log('An error occurred contacting the Minecraft server.', err);
    // });

    axios({
        method: 'post',
        url: '/api/command',
        params: {
            command: '/newWorld'
        }
    }).then(res => {
        console.log('Response:', res);
    });
}

class WorldControls extends Component {
    render () {
        let minecraftState = this.props.minecraftState;

        return (
            <div style={ styles.container }>
                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                        World Controls
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        { !minecraftState ? <div>Waiting on Minecraft server...</div> : 
                        <div>
                            <IconButton
                                onClick = { backupMinecraftWorld }>
                                <Tooltip title="Backup">
                                    <Backup />
                                </Tooltip>
                            </IconButton>
                            <IconButton
                                onClick = { restoreMinecraftWorld }>
                                <Tooltip title="Restore">
                                    <Restore />
                                </Tooltip>
                            </IconButton>
                            <IconButton
                                onClick = { newMinecraftWorld }>
                                <Tooltip title="New">
                                    <New />
                                </Tooltip>
                            </IconButton>
                        </div> }
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            </div>
        );
    }
}

export default WorldControls;

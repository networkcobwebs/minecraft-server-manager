import React from 'react';
import PropTypes from 'prop-types';

import axios from 'axios';

import 'typeface-roboto';
import Backup from '@material-ui/icons/Backup';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import Help from '@material-ui/icons/Help';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import New from '@material-ui/icons/Public';
import Restore from '@material-ui/icons/Restore';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

import BackupBeforeNewDialog from './BackupBeforeNewDialog.js';
import ActionInProgressDialog from './ActionInProgressDialog.js';
import RawMinecraftCommandDialog from './RawMinecraftCommandDialog.js';
import RestoreBackupDialog from './RestoreBackupDialog.js';

const styles = {
  container: {
    margin: 10,
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.95rem'
  }
};

export default class WorldControls extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      backupDialogOpen: false,
      commandOutput: '',
      helpDialogOpen: false,
      potentialBackups: [],
      progressDialogOpen: false,
      rawMinecraftCommandDialogOpen: false,
      rawCommand: '',
      restoreDialogOpen: false,
      restoreBackup: { }
    };
    this.backupAndNewMinecraftWorld = this.backupAndNewMinecraftWorld.bind(this);
    this.backupAndRestoreMinecraftWorld = this.backupAndRestoreMinecraftWorld.bind(this);
    this.backupMinecraftWorld = this.backupMinecraftWorld.bind(this);
    this.closeBackupDialog = this.closeBackupDialog.bind(this);
    this.closeProgressDialog = this.closeProgressDialog.bind(this);
    this.closeRawCommandDialog = this.closeRawCommandDialog.bind(this);
    this.closeRestoreDialog = this.closeRestoreDialog.bind(this);
    this.getMinecraftWorldBackups = this.getMinecraftWorldBackups.bind(this);
    this.newMinecraftWorld = this.newMinecraftWorld.bind(this);
    this.onClearCommand = this.onClearCommand.bind(this);
    this.onClearOutput = this.onClearOutput.bind(this);
    this.onSendCommand = this.onSendCommand.bind(this);
    this.openBackupBeforeNewDialog = this.openBackupBeforeNewDialog.bind(this);
    this.openProgressDialog = this.openProgressDialog.bind(this);
    this.openRawCommandDialog = this.openRawCommandDialog.bind(this);
    this.openRestoreDialog = this.openRestoreDialog.bind(this);
    this.restoreMinecraftWorld = this.restoreMinecraftWorld.bind(this);
    this.updateRawCommandDialog = this.updateRawCommandDialog.bind(this);
    this.updateRawCommandType = this.updateRawCommandType.bind(this);
  }

  backupAndNewMinecraftWorld () {
    // TODO Fix issue of if failed backup then don't nuke
    this.backupMinecraftWorld();
    this.newMinecraftWorld();
  }

  backupAndRestoreMinecraftWorld () {
    // TODO Fix issue of if failed backup then don't nuke
    this.backupMinecraftWorld();
    this.restoreMinecraftWorld();
  }

  backupMinecraftWorld () {
    this.setState({ backupDialogOpen: false, progressDialogOpen: true, restoreDialogOpen: false });
    axios({
      method: 'post',
      url: '/api/backupWorld'
    }).then(() => {
      this.setState({ progressDialogOpen: false });
    },
    err => {
      console.log('An error occurred contacting the Minecraft server.', err);
      this.setState({ progressDialogOpen: false });
    });
  }

  closeBackupDialog () {
    this.setState({ backupDialogOpen: false });
  }

  closeProgressDialog () {
    this.setState({ progressDialogOpen: false });
  }

  closeRawCommandDialog () {
    this.setState({ rawMinecraftCommandDialogOpen: false });
  }

  closeRestoreDialog (worldBackup) {
    if (worldBackup.filename) {
      this.setState({ restoreBackup: worldBackup });
      console.log('Would restore world: ', worldBackup);
      this.setState({ restoreDialogOpen: false });
      this.restoreMinecraftWorld(worldBackup);
    } else {
      this.setState({ restoreDialogOpen: false });
    }
  }

  getMinecraftWorldBackups () {
    axios({
      method: 'get',
      url: '/api/listWorldBackups'
    }).then(res => {
      const backupList = res.data.backupList;
      console.log('backupList response:', backupList);
      if (backupList.length) {
        this.setState({ potentialBackups: backupList });
        this.setState({ restoreDialogOpen: true });
      } else {
        // TODO: Show error
        this.setState({ potentialBackups: [{ key: 'nothingtoseehere', fileName: 'nope', worldName: '', date: '' }] });
        console.log('An error occurred getting backups from the Minecraft server.', backupList);
      }
    },
    err => {
      console.log('An error occurred contacting the Minecraft server.', err);
      this.setState({ restoreDialogOpen: false });
    });
  }

  newMinecraftWorld () {
    this.setState({ backupDialogOpen: false, progressDialogOpen: true, restoreDialogOpen: false });
    axios({
      method: 'post',
      url: '/api/newWorld',
      params: {
        backup: false
      }
    }).then(() => {
      this.setState({ progressDialogOpen: false });
    },
    err => {
      console.log('An error occurred contacting the Minecraft server.', err);
      this.setState({ progressDialogOpen: false });
    });
  }

  onClearCommand () {
    this.setState({ rawCommand: '' });
  }

  onClearOutput () {
    this.setState({ commandOutput: '' });
  }

  onSendCommand () {
    if (this.state.rawCommand) {
      axios({
        method: 'post',
        url: '/api/command',
        params: {
          command: this.state.rawCommand
        }
      }).then(response => {
        const commandOutput = response.data.output;
        this.setState({ rawCommand: '' });
        this.setState({ commandOutput });
      },
      err => {
        console.log('An error occurred contacting the Minecraft server.', err);
        this.setState({ progressDialogOpen: false });
      });
    }
  }

  openBackupBeforeNewDialog () {
    this.setState({ backupDialogOpen: true, progressDialogOpen: false, rawMinecraftCommandDialogOpen: false });
  }

  openProgressDialog () {
    this.setState({ backupDialogOpen: false, progressDialogOpen: true, rawMinecraftCommandDialogOpen: false });
  }

  openRawCommandDialog () {
    this.setState({ backupDialogOpen: false, progressDialogOpen: false, rawMinecraftCommandDialogOpen: true });
  }

  openRestoreDialog () {
    this.getMinecraftWorldBackups();
    this.setState({ backupDialogOpen: false, progressDialogOpen: false, rawMinecraftCommandDialogOpen: false, restoreDialogOpen: true });
  }

  restoreMinecraftWorld (worldBackup) {
    this.setState({ backupDialogOpen: false, progressDialogOpen: true, restoreDialogOpen: false });
    axios({
      method: 'post',
      url: '/api/command',
      params: {
        command: '/restoreWorld',
        backupFile: worldBackup,
        backup: false
      }
    }).then(() => {
      this.setState({ backupDialogOpen: false, progressDialogOpen: false, restoreDialogOpen: false });
      this.setState({ restoreBackup: {} });
    },
    err => {
      console.log('An error occurred contacting the Minecraft server.', err);
      this.setState({ restoreDialogOpen: false });
    });
  }

  updateRawCommandType (event) {
    if (event.key === 'Enter') {
      this.onSendCommand();
    } else {
      this.setState({ rawCommand: event.target.value });
    }
  }

  updateRawCommandDialog (command) {
    this.setState({ rawCommand: command });
  }

  render () {
    return (
      <div style={styles.container}>
        <BackupBeforeNewDialog
          backupAndNew={this.backupAndNewMinecraftWorld}
          newOnly={this.newMinecraftWorld}
          cancelDialog={this.closeBackupDialog}
          open={this.state.backupDialogOpen}
        />
        <ActionInProgressDialog
          open={this.state.progressDialogOpen}
          onClose={this.closeProgressDialog}
        />
        <RawMinecraftCommandDialog
          open={this.state.rawMinecraftCommandDialogOpen}
          onClose={this.closeRawCommandDialog}
          minecraftCommands={this.props.minecraftProperties.fullHelp}
          updateRawCommandField={this.updateRawCommandDialog}
        />
        <RestoreBackupDialog
          open={this.state.restoreDialogOpen}
          onClose={this.closeRestoreDialog}
          potentialBackups={this.state.potentialBackups}
        />
        <Typography variant='subtitle1'>
                    World Controls
        </Typography>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={this.backupMinecraftWorld}
                >
                  <Backup />
                                    Backup World
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={this.openRestoreDialog} disabled
                >
                  <Restore />
                                    Restore World
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={this.openBackupBeforeNewDialog}
                >
                  <New />
                                    New World
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Typography variant='subtitle1'>
                    Send Minecraft Command
        </Typography>
        <FormControl fullWidth>
          <InputLabel htmlFor='rawCommand'>
                        Enter command. Click the Help icon for a full list of supported commands.
          </InputLabel>
          <Input id='rawCommand' fullWidth value={this.state.rawCommand} onChange={this.updateRawCommandType} onKeyPress={this.updateRawCommandType} />
          <Divider />
        </FormControl>
        <Tooltip title='List available Minecraft commands'>
          <Button
            variant='contained'
            color='primary'
            onClick={this.openRawCommandDialog}
          >
            <Help />
          </Button>
        </Tooltip>
        <Button
          variant='contained'
          color='primary'
          onClick={this.onClearCommand}
        >Clear Command
        </Button>
        <Button
          variant='contained'
          color='primary'
          disabled={!this.props.minecraftProperties.started && !this.state.rawCommand === ''}
          onClick={this.onSendCommand}
        >Send Command
        </Button>
        <FormControl fullWidth>
          <TextField
            label='Command Output'
            multiline
            rows='6'
            margin='normal'
            variant='outlined'
            value={this.state.commandOutput}
          />
        </FormControl>
        <Button
          variant='contained'
          color='primary'
          onClick={this.onClearOutput}
        >Clear Output
        </Button>
      </div>
    );
  }
}

WorldControls.propTypes = {
  minecraftProperties: PropTypes.object.isRequired
};

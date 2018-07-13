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
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import Backup from '@material-ui/icons/Backup';
import Restore from '@material-ui/icons/Restore';
import New from '@material-ui/icons/Autorenew';
import Help from '@material-ui/icons/Help';

import BackupBeforeNewDialog from './BackupBeforeNewDialog.js';
import RawMinecraftCommandDialog from './RawMinecraftCommandDialog.js';
import ProgressDialog from './ProgressDialog.js';
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
            helpDialogOpen: false,
            potentialBackups: [],
            progressDialogOpen: false,
            rawMinecraftCommandDialogOpen: false,
            rawCommand: '',
            restoreDialogOpen: false,
            restoreBackup: {  }
        }
    }
    
    openBackupBeforeNewDialog = () => {
        this.setState({ backupDialogOpen: true, progressDialogOpen: false, rawMinecraftCommandDialogOpen: false });
    };
    
    closeBackupDialog = () => {
        this.setState({ backupDialogOpen: false });
    };
    
    openProgressDialog = (e) => {
        this.setState({ backupDialogOpen: false, progressDialogOpen: true, rawMinecraftCommandDialogOpen: false });
    };
    
    closeProgressDialog = (e) => {
        this.setState({ progressDialogOpen: false });
    };

    openRawCommandDialog = (e) => {
        this.setState({ backupDialogOpen: false, progressDialogOpen: false, rawMinecraftCommandDialogOpen: true });
    };

    closeRawCommandDialog = (e) => {
        this.setState({ rawMinecraftCommandDialogOpen: false });
    };

    updateRawCommandType = event => {
        this.setState({ rawCommand: event.target.value });
    };

    updateRawCommandDialog = command => {
        this.setState({ rawCommand: command });
    };

    onClearCommand = (e) => {
        this.setState({ rawCommand: '' });
    };

    openRestoreDialog = (e) => {
        this.getMinecraftWorldBackups();
        this.setState({ backupDialogOpen: false, progressDialogOpen: false, rawMinecraftCommandDialogOpen: false, restoreDialogOpen: true });
    };

    closeRestoreDialog = worldBackup => {
        if (worldBackup.filename) {
            this.setState({ restoreBackup: worldBackup });
            console.log('Would restore world: ', worldBackup);
            this.setState({ restoreDialogOpen: false });
            this.restoreMinecraftWorld(worldBackup);
        } else {
            this.setState({ restoreDialogOpen: false });
        }
    };

    onSendCommand = (e) => {
        axios({
            method: 'post',
            url: '/api/command',
            params: {
                command: this.state.rawCommand
            }
        }).then(res => {
            this.setState({ rawCommand: '' });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
            this.setState({ progressDialogOpen: false });
        });
    };
      
    backupMinecraftWorld = () => {
        this.setState({ backupDialogOpen: false, progressDialogOpen: true,  restoreDialogOpen: false });
        axios({
            method: 'post',
            url: '/api/command',
            params: {
                command: '/backupWorld'
            }
        }).then(res => {
            this.setState({ progressDialogOpen: false });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
            this.setState({ progressDialogOpen: false });
        });
    };
    
    newMinecraftWorld = () => {
        this.setState({ backupDialogOpen: false, progressDialogOpen: true,  restoreDialogOpen: false });
        axios({
            method: 'post',
            url: '/api/command',
            params: {
                command: '/newWorld',
                backup: false
            }
        }).then(res => {
            this.setState({ progressDialogOpen: false });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
            this.setState({ progressDialogOpen: false });
        });
    };

    backupAndNewMinecraftWorld = () => {
        // TODO Fix issue of if failed backup then don't nuke
        this.backupMinecraftWorld();
        this.newMinecraftWorld();
    };

    getMinecraftWorldBackups = () => {
        axios({
            method: 'get',
            url: `/api/listWorldBackups`
        }).then(res => {
            let backupList = res.data.backupList;
            console.log('backupList response:', backupList);
            if (backupList.length) {
                this.setState({ potentialBackups: backupList });
                this.setState({ restoreDialogOpen: true });
            } else {
                // TODO: Show error
                this.setState({ potentialBackups: [{key: 'nothingtoseehere', fileName: 'nope', worldName: '', date: ''}] });
                console.log('An error occurred getting backups from the Minecraft server.', backupList);
            }
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
            this.setState({ restoreDialogOpen: false });
        });
    };
    
    restoreMinecraftWorld = worldBackup => {
        this.setState({ backupDialogOpen: false, progressDialogOpen: true, restoreDialogOpen: false });
        axios({
            method: 'post',
            url: '/api/command',
            params: {
                command: '/restoreWorld',
                backupFile: worldBackup,
                backup: false
            }
        }).then(res => {
            this.setState({ backupDialogOpen: false, progressDialogOpen: false, restoreDialogOpen: false });
            this.setState({ restoreBackup: {} });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
            this.setState({ restoreDialogOpen: false });
        });
    };

    backupAndRestoreMinecraftWorld = () => {
        // TODO Fix issue of if failed backup then don't nuke
        this.backupMinecraftWorld();
        this.restoreMinecraftWorld();
    };

    render () {
        return (
            <div>
                <BackupBeforeNewDialog 
                    backupAndNew = { this.backupAndNewMinecraftWorld } 
                    newOnly = { this.backupMinecraftWorld }
                    cancelDialog = { this.closeBackupDialog }
                    open = { this.state.backupDialogOpen }
                />
                <ProgressDialog
                    open = { this.state.progressDialogOpen }
                    onClose = { this.closeProgressDialog }
                />
                <RawMinecraftCommandDialog
                    open = { this.state.rawMinecraftCommandDialogOpen }
                    onClose = { this.closeRawCommandDialog }
                    minecraftCommands = { this.props.minecraftState.minecraftCommands }
                    updateRawCommandField = { this.updateRawCommandDialog }
                />
                <RestoreBackupDialog
                    open = { this.state.restoreDialogOpen }
                    onClose = { this.closeRestoreDialog }
                    potentialBackups = { this.state.potentialBackups }
                />
                <ExpansionPanel style = { styles.container } defaultExpanded>
                    <ExpansionPanelSummary expandIcon = { <ExpandMoreIcon /> }>
                        World Controls
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <IconButton onClick = { this.backupMinecraftWorld }>
                            <Tooltip title = "Backup">
                                <Backup />
                            </Tooltip>
                        </IconButton>
                        <IconButton onClick = { this.openRestoreDialog } disabled>
                            <Tooltip title = "Restore">
                                <Restore />
                            </Tooltip>
                        </IconButton>
                        <IconButton onClick = { this.openBackupBeforeNewDialog }>
                            <Tooltip title = "New">
                                <New />
                            </Tooltip>
                        </IconButton>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <ExpansionPanel style = { styles.container }>
                    <ExpansionPanelSummary expandIcon = {<ExpandMoreIcon />}>
                        Send raw Minecraft command
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <FormControl fullWidth>
                            <InputLabel htmlFor = "rawCommand">
                                Enter command. Click the Help icon for a full list of supported commands.
                            </InputLabel>
                            <Input id = 'rawCommand' fullWidth value = { this.state.rawCommand } onChange = { this.updateRawCommandType }/>
                            <Divider />
                            <ExpansionPanelActions>
                                <IconButton onClick = { this.openRawCommandDialog }>
                                    <Tooltip title = "List available Minecraft commands">
                                        <Help />
                                    </Tooltip>
                                </IconButton>
                                <Button size = "small" onClick = { this.onClearCommand }>Clear</Button>
                                <Button size = "small" color="primary" onClick = { this.onSendCommand }>Send Command</Button>
                            </ExpansionPanelActions>
                        </FormControl>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            </div>
        );
    };
};

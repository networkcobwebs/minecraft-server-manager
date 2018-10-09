import React, { Component } from 'react';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Select from '@material-ui/core/Select';

import BackupItem from './BackupItem';

export default class RestoreBackupDialog extends Component {
    state = {
        backupValue: ""
    };

    displayBackupItems = backup => 
        <BackupItem
            key = { backup.fileName }
            backup = { backup }
        />;

    render () {
        let potentialBackups = this.props.potentialBackups;
        return (
            <Dialog
                open = { this.props.open }>
                <DialogContent>
                    <FormControl>
                        <Select
                            native
                            // onChange = { this.handleChange('age') }
                            inputProps = {{
                                id: 'backup',
                            }}
                            value = { this.state.backupValue } >
                            { potentialBackups.map(this.displayBackupItems) }
                        </Select>
                    </FormControl>
                    <FormHelperText>Choose a backup to restore</FormHelperText>
                </DialogContent>
                <DialogActions>
                    <Button onClick = { this.props.onClose } color="primary" autoFocus>
                        Cancel
                    </Button>
                    <Button onClick = { this.props.onClose } color="primary" autoFocus>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };
}

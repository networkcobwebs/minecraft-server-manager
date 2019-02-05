import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Select from '@material-ui/core/Select';

import BackupItem from './BackupItem';

export default class RestoreBackupDialog extends Component {
    constructor (props) {
        super(props);
        this.state = {
            backupValue: ""
        };
    }

    displayBackupItems (backup) {
        return (
            <BackupItem
                key = { backup.fileName }
                backup = { backup }
            />
        );
    }

    render () {
        let potentialBackups = this.props.potentialBackups;
        
        return (
            <Dialog
                open = { this.props.open }>
                <DialogContent>
                    <FormControl>
                        <Select
                            native
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
                    <Button onClick = { this.props.onClose } color="primary">
                        Cancel
                    </Button>
                    <Button onClick = { this.props.onClose } color="primary" autoFocus>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

RestoreBackupDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    potentialBackups: PropTypes.array.isRequired
};

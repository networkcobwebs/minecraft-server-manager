import React, { Component } from 'react';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Button from '@material-ui/core/Button';

export default class RestoreBackupDialog extends Component {
    render () {
        return (
            <Dialog
                open = { this.props.open }>
                <DialogContent>
                    <DialogContentText>
                        Show list of backups here
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick = { this.props.onClose } color="primary" autoFocus>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };
}

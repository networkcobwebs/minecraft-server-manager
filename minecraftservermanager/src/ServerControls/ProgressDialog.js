import React from 'react';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Button from '@material-ui/core/Button';

export default class ProgressDialog extends React.Component {
    state = {};

    render () {
        return (
            <Dialog { ...this.props }>
                <DialogContent>
                    <DialogContentText>
                        Requested action in progress...
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick = { this.props.onClose } color = "primary" autoFocus>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };
};

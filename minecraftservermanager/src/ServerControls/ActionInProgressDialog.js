import React from 'react';
import PropTypes from 'prop-types';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Button from '@material-ui/core/Button';

export default function ActionInProgressDialog (props) {
    const { onClose, ...other } = props;
    return (
        <Dialog { ...other }>
            <DialogContent>
                <DialogContentText>
                    Requested action in progress...
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick = { onClose } color = "primary" autoFocus>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

ActionInProgressDialog.propTypes = {
    onClose: PropTypes.func.isRequired
};

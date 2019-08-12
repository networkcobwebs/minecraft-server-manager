import React from 'react';
import PropTypes from 'prop-types';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';

export default function ConfirmVersionDialog (props) {
    const { detectedVersion, selectedVersionToInstall, onNo, onYes, ...other } = props;
    // console.log('props:', props);
    let version = "";

    if (detectedVersion && detectedVersion.full) {
        version = detectedVersion.full;
    }
    // TODO: Detect "downgrade".
    return (
        <Dialog { ...other }>
            <DialogTitle>Confirm Version Change</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    The current running version is { version }, but the
                    selected version is { selectedVersionToInstall ? selectedVersionToInstall.full : 'unknown' }. Changing
                    to a lower version may delete the current world.
                </DialogContentText>
                <DialogContentText>
                    Continue?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick = { onNo }
                    color = "primary"
                    variant="contained"
                    autoFocus>
                    No
                </Button>
                <Button
                    onClick = { onYes }
                    color = "primary"
                    variant="contained">
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
}

ConfirmVersionDialog.propTypes = {
    detectedVersion: PropTypes.object,
    selectedVersionToInstall: PropTypes.object,
    onNo: PropTypes.func.isRequired,
    onYes: PropTypes.func.isRequired
};

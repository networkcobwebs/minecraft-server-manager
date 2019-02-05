import React from 'react';
import PropTypes from 'prop-types';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Button from '@material-ui/core/Button';
    
export default class BackupBeforeNewDialog extends React.Component {

    render () {
        return (
            <Dialog open = { this.props.open }>
                <DialogContent>
                    <DialogContentText>
                        Would you like to backup the world first?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick = { this.props.cancelDialog } color="primary">
                        Cancel
                    </Button>
                    <Button onClick = { this.props.newOnly } color="primary">
                        No
                    </Button>
                    <Button onClick = { this.props.backupAndNew } color="primary" autoFocus>
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

BackupBeforeNewDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    cancelDialog: PropTypes.func.isRequired,
    newOnly: PropTypes.func.isRequired,
    backupAndNew: PropTypes.func.isRequired
};

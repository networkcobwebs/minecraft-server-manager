import React from 'react';
import PropTypes from 'prop-types';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';

export default function ConfirmRestartDialog (props) {
  const { onNo, onYes, ...other } = props;

  return (
    <Dialog {...other}>
      <DialogTitle>Confirm Minecraft Restart</DialogTitle>
      <DialogContent>
        <DialogContentText>
                    Saving new properties will restart the Minecraft server.
        </DialogContentText>
        <DialogContentText>
                    Continue?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onNo}
          color='primary'
          variant='contained'
          autoFocus
        >
                    No
        </Button>
        <Button
          onClick={onYes}
          color='primary'
          variant='contained'
        >
                    Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmRestartDialog.propTypes = {
  onNo: PropTypes.func.isRequired,
  onYes: PropTypes.func.isRequired
};

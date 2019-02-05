import React from 'react';
import PropTypes from 'prop-types';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

const styles = {
    container: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.95rem'
    }
};
    
export default class RawMinecraftCommandDialog extends React.Component {
    constructor (props) {
        super(props);

        this.closeDialog = this.closeDialog.bind(this);
        this.listCommands = this.listCommands.bind(this);
    }

    closeDialog (command) {
        this.props.updateRawCommandField(command);
        this.props.onClose();
    }

    listCommands (command) {
        return (
            <div key = { command.key }>
                <ListItem button onClick = { () => { this.closeDialog(command.command); } }>
                    <ListItemText primary = { command.command } />
                    <Divider />
                </ListItem>
            </div>
        );
    }

    render () {
        return (
            <Dialog fullScreen open = { this.props.open } style = { styles.container } >
                <DialogTitle>
                    <IconButton onClick = { this.props.onClose }>
                        <CloseIcon />
                    </IconButton>
                    Available Minecraft Commands
                </DialogTitle>
                <DialogContent>
                    <List>
                        { this.props.minecraftCommands.map(this.listCommands) }
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick = { this.props.onClose } color="primary">
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

RawMinecraftCommandDialog.propTypes = {
    minecraftCommands: PropTypes.array.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    updateRawCommandField: PropTypes.func.isRequired
};

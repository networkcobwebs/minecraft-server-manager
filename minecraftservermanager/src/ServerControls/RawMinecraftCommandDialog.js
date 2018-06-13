import React from 'react';

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
    
export default class BackupBeforeNewDialog extends React.Component {

    render () {
        // TODO: Close on selection
        return (
            <Dialog fullScreen open = { this.props.open } style = { styles.container } >
                <DialogTitle>
                    <IconButton onClick = {this.props.onClose}>
                        <CloseIcon />
                    </IconButton>
                    Available Minecraft Commands
                </DialogTitle>
                <DialogContent>
                    <List>
                        { this.props.minecraftCommands.map(command => {
                            return (
                            <div key = { command.key }>
                                <ListItem button>
                                    <ListItemText primary = { command.command} />
                                    <Divider />
                                </ListItem>
                            </div>
                            );
                        }) }
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick = { this.props.cancelDialog } color="primary">
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
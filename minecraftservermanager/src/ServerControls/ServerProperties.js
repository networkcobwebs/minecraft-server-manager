import React from 'react';
import PropTypes from 'prop-types';

import 'typeface-roboto';
import Typography from '@material-ui/core/Typography';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelActions from '@material-ui/core/ExpansionPanelActions';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Tooltip from '@material-ui/core/Tooltip';
import Icon from '@material-ui/core/Icon';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Refresh from '@material-ui/icons/Cached';

export default function ServerProperties (props) {
    const { minecraftProperties, ...other } = props;
    return (
        <ExpansionPanel defaultExpanded>
            <ExpansionPanelSummary expandIcon={ <ExpandMoreIcon /> }>
                <Typography component="h2" marginRight={ 2 }>
                    Server Properties
                </Typography>
                <Typography>
                    <Tooltip title="Refresh">
                        <Button variant="contained" color="primary">
                            Refresh
                            <Icon>
                                <Refresh />
                            </Icon>
                        </Button>
                    </Tooltip>
                </Typography>
            </ExpansionPanelSummary>
            
            { minecraftProperties && minecraftProperties.serverProperties.length ? minecraftProperties.serverProperties.map(property => {
                return (
                    <ExpansionPanelDetails key={ property.name }>
                        <FormControl fullWidth>
                            <InputLabel
                                htmlFor="{ property.name }">
                                { property.name }
                            </InputLabel>
                            <Input
                                id = { property.name }
                                value = { property.value }
                                fullWidth />
                        </FormControl>
                    </ExpansionPanelDetails>
                );
            }) : 'Waiting on Minecraft server...' }
            
            <Divider />

            <ExpansionPanelActions>
                <Button size="small">
                    Cancel
                </Button>
                <Button size="small" color="primary">
                    Save
                </Button>
            </ExpansionPanelActions>
        </ExpansionPanel>
    )
}

ServerProperties.propTypes = {
    minecraftProperties: PropTypes.object.isRequired
};

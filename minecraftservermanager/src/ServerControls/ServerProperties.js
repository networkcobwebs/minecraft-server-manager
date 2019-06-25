import React from 'react';
import PropTypes from 'prop-types';

import 'typeface-roboto';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Refresh from '@material-ui/icons/Cached';
import Save from '@material-ui/icons/Save';
import Undo from '@material-ui/icons/Undo';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Typography from '@material-ui/core/Typography';

export default function ServerProperties (props) {
    const { minecraftProperties } = props;
    return (
        <div>
            <Typography variant="subtitle1">
                Server Properties
            </Typography>
            <Typography>
                Change Minecraft server properties. When finished, click <strong>Save</strong>.&nbsp;
                <Typography variant="caption">
                    (Saving changes will require a Minecraft restart.)
                </Typography>
            </Typography>
            <Typography>
                <strong>Undo</strong> will reset all fields to the current running settings.
            </Typography>
            <Typography>
                <strong>Refresh</strong> reads current values from the Minecraft server files.
            </Typography>
            <Button disabled variant="contained" color="primary">
                <Refresh />
                Refresh
            </Button>
            <Button disabled variant="contained" color="primary">
                <Save />
                Save
            </Button>
            <Button disabled variant="contained" color="primary">
                <Undo />
                Undo
            </Button>
            <div style={{maxHeight: "100vh", overflow: "auto"}}>
                <Table size="small">
                    <TableBody>
                        <TableRow><TableCell></TableCell></TableRow>
                        { minecraftProperties && minecraftProperties.serverProperties && minecraftProperties.serverProperties.length ? minecraftProperties.serverProperties.map(property => {
                            return (
                                <TableRow key={ property.name }>
                                    <TableCell>
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
                                    </TableCell>
                                </TableRow>
                            );
                        }) : <TableRow><TableCell>Waiting on Minecraft server...</TableCell></TableRow> }
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

ServerProperties.propTypes = {
    minecraftProperties: PropTypes.object.isRequired
};

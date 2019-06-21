import React from 'react';
import PropTypes from 'prop-types';

import 'typeface-roboto';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Icon from '@material-ui/core/Icon';
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
            <Button disabled variant="contained" color="primary">
                Refresh
                <Icon>
                    <Refresh />
                </Icon>
            </Button>
            <Button disabled variant="contained" color="primary">
                Save
                <Icon>
                    <Save />
                </Icon>
            </Button>
            <Button disabled variant="contained" color="primary">
                Undo
                <Icon>
                    <Undo />
                </Icon>
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
                        }) : 'Waiting on Minecraft server...' }
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

ServerProperties.propTypes = {
    minecraftProperties: PropTypes.object.isRequired
};

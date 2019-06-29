import React, { useState } from 'react';
import PropTypes from 'prop-types';

import axios from 'axios';

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

import ActionInProgressDialog from './ActionInProgressDialog.js';

export default function ServerProperties (props) {
    const currentMinecraftProperties = Object.assign({}, props.minecraftProperties);
    const [dirtyProps, setDirtyProps] = useState(false);
    const [minecraftProperties, setMinecraftProperties] = useState(props.minecraftProperties);
    const [progressDialogOpen, setProgressDialogOpen] = useState(false);
    
    const openProgressDialog = () => {
        setProgressDialogOpen(true);
    };
    
    const closeProgressDialog = () => {
        setProgressDialogOpen(false);
    };

    const refreshProperties = () => {
        openProgressDialog();
        axios({
            method: 'get',
            url: `/api/refreshServerProperties`
        }).then(() => {
            setMinecraftProperties(props.minecraftProperties);
            setProgressDialogOpen(false);
        }, err => {
            console.log('An error occurred contacting the Minecraft server.', err);
            setProgressDialogOpen(false);
        });
    };

    const saveProperties = () => {
        openProgressDialog();
        axios({
            method: 'post',
            url: `/api/saveMinecraftProperties`,
            params: {
                properties: minecraftProperties
            }
        }).then(() => {
            refreshProperties();
            setDirtyProps(false);
        }, err => {
            console.log('An error occurred contacting the Minecraft server.', err);
            refreshProperties();
        });
    };

    const undoPropertyEdits = () => {
        setMinecraftProperties(currentMinecraftProperties);
        setDirtyProps(false);
    };

    const updatePropertyType = (event) => {
        let newMinecraftProps = Object.assign({}, minecraftProperties);
        let newServerProps = newMinecraftProps.serverProperties;
        let changed = false;
        let property;
        for (let p = 0; p < newServerProps.length; p++) {
            property = newServerProps[p];
            if (property.name === event.target.id) {
                if (property.value !== event.target.value) {
                    property.value = event.target.value;
                    changed = true;
                }
                break;
            }
        }
        if (changed){
            setMinecraftProperties(newMinecraftProps);
            setDirtyProps(true);
        }
    };

    return (
        <div>
            <ActionInProgressDialog
                open = { progressDialogOpen }
                onClose = { closeProgressDialog }
            />
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
            <Button
                variant="contained"
                color="primary"
                onClick={ refreshProperties }>
                <Refresh />
                Refresh
            </Button>
            <Button
                disabled = { !dirtyProps }
                variant="contained"
                color="primary"
                onClick = { saveProperties }>
                <Save />
                Save
            </Button>
            <Button
                disabled = { !dirtyProps }
                variant="contained"
                color="primary"
                onClick = { undoPropertyEdits }>
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
                                                fullWidth
                                                onChange = { updatePropertyType }
                                                onKeyPress = { updatePropertyType }/>
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

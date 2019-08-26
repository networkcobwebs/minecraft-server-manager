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
import ConfirmRestartDialog from './ConfirmRestartDialog.js';

export default function ServerProperties (props) {
  let currentMinecraftProperties = Object.assign([], props.minecraftProperties.serverProperties);
  const [dirtyProps, setDirtyProps] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [serverProperties, setServerProperties] = useState(props.minecraftProperties.serverProperties);

  const openProgressDialog = () => {
    setProgressDialogOpen(true);
  };

  const closeProgressDialog = () => {
    setProgressDialogOpen(false);
  };

  const openRestartDialog = () => {
    setRestartDialogOpen(true);
  };

  const closeRestartDialog = () => {
    setRestartDialogOpen(false);
  };

  const refreshProperties = () => {
    openProgressDialog();
    axios({
      method: 'get',
      url: '/api/refreshServerProperties'
    }).then(res => {
      setServerProperties(res.data.properties);
      currentMinecraftProperties = Object.assign({}, res.data.properties);
      setDirtyProps(false);
      setProgressDialogOpen(false);
    }, err => {
      console.log('An error occurred contacting the Minecraft server.', err);
      setProgressDialogOpen(false);
    });
  };

  const saveProperties = () => {
    closeRestartDialog();
    openProgressDialog();
    const newProperties = JSON.stringify(serverProperties);
    axios({
      method: 'post',
      url: '/api/saveMinecraftProperties',
      params: {
        newProperties: newProperties
      }
    }).then(() => {
      refreshProperties();
    }, err => {
      console.log('An error occurred contacting the Minecraft server.', err);
      refreshProperties();
    });
  };

  const undoPropertyEdits = () => {
    setServerProperties(currentMinecraftProperties);
    setDirtyProps(false);
  };

  const updatePropertyType = (event) => {
    const newMinecraftProps = Object.assign([], serverProperties);
    let changed = false;
    let property;
    for (let p = 0; p < newMinecraftProps.length; p++) {
      property = newMinecraftProps[p];
      if (property.name === event.target.id) {
        if (property.value !== event.target.value) {
          property.value = event.target.value;
          changed = true;
        }
        break;
      }
    }
    if (changed) {
      setServerProperties(newMinecraftProps);
      setDirtyProps(true);
    }
  };

  return (
    <div>
      <ActionInProgressDialog
        open={progressDialogOpen}
        onClose={closeProgressDialog}
      />
      <ConfirmRestartDialog
        open={restartDialogOpen}
        onNo={closeRestartDialog}
        onYes={saveProperties}
      />
      <Typography variant='subtitle1'>
                Server Properties
      </Typography>
      <Typography>
                Change Minecraft server properties. When finished, click <strong>Save</strong>.&nbsp;
        <Typography variant='caption'>
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
        variant='contained'
        color='primary'
        onClick={refreshProperties}
      >
        <Refresh />
                Refresh
      </Button>
      <Button
        disabled={!dirtyProps}
        variant='contained'
        color='primary'
        onClick={openRestartDialog}
      >
        <Save />
                Save
      </Button>
      <Button
        disabled={!dirtyProps}
        variant='contained'
        color='primary'
        onClick={undoPropertyEdits}
      >
        <Undo />
                Undo
      </Button>
      <div style={{ maxHeight: '100vh', overflow: 'auto' }}>
        <Table size='small'>
          <TableBody>
            <TableRow><TableCell /></TableRow>
            {serverProperties && serverProperties.length ? serverProperties.map(property => {
              return (
                <TableRow key={property.name}>
                  <TableCell>
                    <FormControl fullWidth>
                      <InputLabel
                        htmlFor='{ property.name }'
                      >
                        {property.name}
                      </InputLabel>
                      <Input
                        id={property.name}
                        value={property.value}
                        fullWidth
                        onChange={updatePropertyType}
                        onKeyPress={updatePropertyType}
                      />
                    </FormControl>
                  </TableCell>
                </TableRow>
              );
            }) : <TableRow><TableCell>Waiting on Minecraft server...</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

ServerProperties.propTypes = {
  minecraftProperties: PropTypes.object.isRequired
};

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import axios from 'axios';

import 'typeface-roboto';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Save from '@material-ui/icons/Save';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';

export default function Preferences (props) {
  const [apiSettings, setApiSettings] = useState(props.apiSettings);
  // console.log(apiSettings);

  const savePreferences = () => {
    axios({
      method: 'post',
      url: '/api/saveApiPreferences',
      params: {
        settings: JSON.stringify(apiSettings)
      }
    }, err => {
      console.log('An error occurred contacting the Minecraft server.', err);
    });
  };

  const handleChange = (event, value) => {
    const oldApiSettings = Object.assign({}, apiSettings);
    let newApiSettings = { autoStartMinecraft: value };
    newApiSettings = Object.assign(oldApiSettings, newApiSettings);
    setApiSettings(newApiSettings);
  };

  return (
    <div>
      <Button
        variant='contained'
        color='primary'
        onClick={savePreferences}
      >
        <Save />
                Save
      </Button>
      <Table size='small'>
        <TableBody>
          <TableRow>
            <TableCell>
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={apiSettings.autoStartMinecraft}
                      onChange={handleChange}
                    />
                  } label='Auto-start Minecraft with this website?'
                />
              </FormControl>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <FormControl fullWidth>
                <InputLabel
                  htmlFor='{ ipAddress }'
                >
                                    The IP address to listen on.
                </InputLabel>
                <Input
                  id='ipAddress'
                  value={apiSettings.ipAddress}
                  fullWidth
                />
              </FormControl>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <FormControl fullWidth>
                <InputLabel
                  htmlFor='{ ipPort }'
                >
                                    The IP port to listen on.
                </InputLabel>
                <Input
                  id='ipPort'
                  value={apiSettings.ipPort}
                  fullWidth
                />
              </FormControl>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

Preferences.propTypes = {
  apiSettings: PropTypes.object.isRequired
};

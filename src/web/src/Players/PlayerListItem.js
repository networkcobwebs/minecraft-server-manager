import React from 'react';
import PropTypes from 'prop-types';

import 'typeface-roboto';
import Ban from '@material-ui/icons/Error';
import IconButton from '@material-ui/core/IconButton';
import Kick from '@material-ui/icons/Error';
import NetworkOnline from '@material-ui/icons/SignalWifi4Bar';
import NetworkOffline from '@material-ui/icons/SignalWifiOff';
import OpStatus from '@material-ui/icons/VerifiedUser';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import WhitelistIcon from '@material-ui/icons/PlaylistAdd';

export default function PlayerListItem (props) {
  const banPlayer = () => {
    props.banPlayer(props.player.name);
  };
  const pardonPlayer = () => {
    props.pardonPlayer(props.player.name);
  };
  const kickPlayer = () => {
    props.kickPlayer(props.player.name);
  };
  const opPlayer = () => {
    props.opPlayer(props.player.name);
  };
  const deopPlayer = () => {
    props.deopPlayer(props.player.name);
  };
  const whitelistPlayer = () => {
    props.whitelistPlayer(props.player.name);
  };

  return (
    <TableRow>
      <TableCell>
        <Typography>
          {props.player.name}
        </Typography>
      </TableCell>
      <TableCell>{props.player.online
        ? (
          <Tooltip title='Online'>
            <NetworkOnline />
          </Tooltip>
        )
        : (
          <Tooltip title='Offline'>
            <NetworkOffline />
          </Tooltip>
        )}{props.player.opped
        ? (
          <Tooltip title='Opped'>
            <OpStatus />
          </Tooltip>
        ) : <span />}{props.player.banned
        ? (
          <Tooltip title='Banned'>
            <Ban />
          </Tooltip>
        ) : <span />}{props.player.whitelisted
        ? (
          <Tooltip title='Whitelisted'>
            <WhitelistIcon />
          </Tooltip>
        ) : <span />}
      </TableCell>
      <TableCell>
        {props.player.banned
          ? (
            <IconButton onClick={pardonPlayer}>
              <Tooltip title='Pardon'>
                <Ban />
              </Tooltip>
            </IconButton>
          )
          : (
            <IconButton onClick={banPlayer}>
              <Tooltip title='Ban'>
                <Ban />
              </Tooltip>
            </IconButton>
          )}
        <IconButton onClick={kickPlayer}>
          <Tooltip title='Kick'>
            <Kick />
          </Tooltip>
        </IconButton>
        {props.player.opped
          ? (
            <IconButton onClick={deopPlayer}>
              <Tooltip title='De Op'>
                <OpStatus />
              </Tooltip>
            </IconButton>
          )
          : (
            <IconButton onClick={opPlayer}>
              <Tooltip title='Op'>
                <OpStatus />
              </Tooltip>
            </IconButton>
          )}
        {!props.player.whitelisted
          ? (
            <IconButton onClick={whitelistPlayer}>
              <Tooltip title='Whitelist'>
                <WhitelistIcon />
              </Tooltip>
            </IconButton>
          ) : <div />}
      </TableCell>
    </TableRow>
  );
}

PlayerListItem.propTypes = {
  player: PropTypes.object.isRequired,
  whitelistPlayer: PropTypes.func.isRequired,
  deopPlayer: PropTypes.func.isRequired,
  opPlayer: PropTypes.func.isRequired,
  kickPlayer: PropTypes.func.isRequired,
  pardonPlayer: PropTypes.func.isRequired,
  banPlayer: PropTypes.func.isRequired
};

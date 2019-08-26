import React from 'react';
import PropTypes from 'prop-types';

import 'typeface-roboto';
import Table from '@material-ui/core/Table';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

import PlayerListItem from './PlayerListItem';

const styles = {
  container: {
    margin: 10,
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.95rem'
  }
};

export default class PlayersSummary extends React.Component {
  displayPlayerListItems (player) {
    if (player.online) {
      return (
        <PlayerListItem
          key={player.key}
          player={player}
        />
      );
    }
  }

  render () {
    const minecraftProperties = this.props.minecraftProperties;
    const playerInfo = minecraftProperties.playerInfo;
    let players = [];
    let summary = '';

    if (playerInfo) {
      players = playerInfo.players;
      summary = playerInfo.summary;
    }

    return (
      <div style={styles.container}>
        <Typography variant='subtitle1'>
                    Connected Players
        </Typography>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant='subtitle2'>
                  {summary || 'Waiting on Minecraft server...'}
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
        <Table>
          <TableBody>
            {players.map(this.displayPlayerListItems)}
          </TableBody>
        </Table>
      </div>
    );
  }
}

PlayersSummary.propTypes = {
  minecraftProperties: PropTypes.object.isRequired
};

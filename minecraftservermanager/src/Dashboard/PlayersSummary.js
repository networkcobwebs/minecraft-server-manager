import React from 'react';
import PropTypes from 'prop-types';

import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
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
                    key = { player.key }
                    player = { player }
                />
            );
        }
    }

    render () {
        let players = this.props.playerInfo.players || [];
        let summary = this.props.playerInfo.summary || '';
        
        return (
            <div style = { styles.container }>
                <Typography variant="subtitle1">
                    Connected Players
                </Typography>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    { summary ? summary : 'Waiting on Minecraft server...' }
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
                <Table>
                    <TableBody>
                        { players.map(this.displayPlayerListItems) }
                    </TableBody>
                </Table>
            </div>
        );
    }
}

PlayersSummary.propTypes = {
    playerInfo: PropTypes.object.isRequired
};

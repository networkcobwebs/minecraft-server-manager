import React from 'react';

import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';

const styles = {
    container: {
        margin: 10,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.95rem'
    }
};

export default class PlayersSummary extends React.Component {
    render () {
        let playerNames = this.props.minecraftState.playerNames,
            summary = this.props.minecraftState.playerSummary;

        return (
            <div style={ styles.container }>
                <h3>Connected Players</h3>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{ summary ? summary : 'Waiting on Minecraft server...' }</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { playerNames.length ? playerNames.map(player => {
                            return (
                                <TableRow key={ player.name }>
                                    <TableCell>{ player.name }</TableCell>
                                </TableRow>
                            )
                        }) : <TableRow /> }
                    </TableBody>
                </Table>
            </div>
        );
    }
}

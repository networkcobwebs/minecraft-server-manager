import React, { Component } from 'react';

import Table, {
    TableHead,
    TableBody,
    TableRow,
    TableCell,
} from 'material-ui/Table';
import Tooltip from 'material-ui/Tooltip';

import OpStatus from 'material-ui-icons/VerifiedUser';
import NetworkOnline from 'material-ui-icons/SignalWifi4Bar';
import NetworkOffline from 'material-ui-icons/SignalWifiOff';

const styles = {
    container: {
        margin: 10,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.95rem'
    }
};

class PlayersSummary extends Component {
    render () {
        let playerNames = this.props.minecraftState.playerNames,
            summary = this.props.minecraftState.playerSummary;

        return (
            <div style={ styles.container }>
                <h3>Players</h3>
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

export default PlayersSummary;

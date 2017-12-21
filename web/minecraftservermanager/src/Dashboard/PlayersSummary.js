import React, { Component } from 'react';

import axios from 'axios';

import Table, {
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
    constructor (props) {
        super(props);

        this.state = {
            summary: '',
            playerNames: []
        };
    }

    componentDidMount () {
        this.getMinecraftPlayers(100);
    }

    componentWillUnmount() {
        let summary = '',
            playerNames = [];

        if (this.playersTimerId) {
            clearTimeout(this.playersTimerId);
        }

        this.setState({ summary });
        this.setState({ playerNames });
    }

    getMinecraftPlayers (pingWait) {
        let normalPingTime = 5 * 1000,
            appendTime = 5 * 1000,
            maxTime = 120 * 1000,
            pingTime;

        // normally ping every 10 seconds
        // if a fast ping was requested (from constructor/DidMount), honor it
        // once trouble hits, add 5 seconds until 2 minutes is reached, then reset to 10 seconds
        // once re/successful, reset to 10 seconds
        if (!pingWait) {
            pingTime = normalPingTime;
        } else if (pingWait < 1000) {
            pingTime = pingWait;
        } else if (pingWait > maxTime) {
            pingTime = normalPingTime;
        } else {
            pingTime = pingWait;
        }

        if (this.playersTimerId) {
            clearTimeout(this.playersTimerId);
        }

        this.playersTimerId = setTimeout(() => {
            // TODO Make the URL a property that can be changed
            axios(`http://localhost:3001/api/command?command=/list`).then(res => {
                let result = res.data,
                    playerList = result.response,
                    playerNames = [],
                    players, somePlayerName, somePlayerNames, testData, summary,
                    i, p;

                if (playerList.includes('Fail')) {
                    // Squelch for now
                    let summary = '',
                        playerNames = [];

                    this.setState({ summary });
                    this.setState({ playerNames });
                    pingTime = pingTime + appendTime;
                    this.playersTimerId = setTimeout(
                        () => this.getMinecraftPlayers(pingTime),
                        pingTime
                    );
                } else {
                    // First line is the summary,
                    // followed by player names, comma+space separated
                    players = playerList.split(/\n/);
                    summary = players.shift();
                    // Remove trailing ':'
                    summary = summary.slice(0, -1);
                    // Remove preceding timestamp/server info
                    summary = summary.split(']: ')[1];

                    // Get playerNames
                    for (i = 0; i < players.length; i++) {
                        // Remove preceding timestamp & server info
                        somePlayerNames = players[i].split(']: ')[1];

                        if (somePlayerNames) {
                            somePlayerNames = somePlayerNames.split(',');
                            for (p = 0; p < somePlayerNames.length; p++) {
                                somePlayerName = somePlayerNames[p];
                                if (somePlayerName) {
                                    // Make sure we check for multiple spaces so as to
                                    // ignore any bad data like things that were
                                    // accidentally in the buffer at the same time we
                                    // queried, etc.
                                    testData = somePlayerName.split(' ');
                                    if (testData.length <= 2) {
                                        playerNames.push(this.objectifyPlayer(somePlayerName.trim()));
                                    }
                                }
                            }
                        }
                    }

                    // console.log('playerNames discovered:', playerNames);
                    
                    this.setState({ summary });
                    this.setState({ playerNames });
                    this.playersTimerId = setTimeout(
                        () => this.getMinecraftPlayers(normalPingTime),
                        normalPingTime
                    );
                }
            },
            err => {
                pingTime = pingTime + appendTime;
                this.playersTimerId = setTimeout(
                    () => this.getMinecraftPlayers(pingTime),
                    pingTime
                );
            });
        }, pingTime);
    }

    objectifyPlayer (player) {
        return { key: player, name: player };
    }

    render () {
        return (
            <div style={ styles.container }>

                <h3>Players</h3>
                <div>
                    { this.state.summary }
                </div>

                <div>
                    <ul>
                        { this.state.playerNames.map(player => {
                            return <li key={ player.name }>{ player.name }</li>;
                        }) }
                    </ul>
                </div>

            </div>
        );
    }
}

export default PlayersSummary;

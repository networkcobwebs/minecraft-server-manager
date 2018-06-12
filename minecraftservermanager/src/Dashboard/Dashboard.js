import React from 'react';

import ServerSummary from './ServerSummary.js';
import PlayersSummary from './PlayersSummary.js';

const styles = {
    container: {
        margin: 10,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '0.95rem'
    }
};

class Dashboard extends React.Component {
    render () {
        return (
            <div style={ styles.container }>
                <ServerSummary minecraftState = { this.props.minecraftState } />
                <PlayersSummary minecraftState = { this.props.minecraftState } />
            </div>
        );
    }
}

export default Dashboard;

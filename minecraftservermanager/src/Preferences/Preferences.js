import React, { Component } from 'react';

const styles = {
    container: {
        margin: 10,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '.95rem'
    }
};

class Preferences extends Component {
    render () {
        return (
            <div style={styles.container}>
                <p>
                    Preferences will go here to handle Minecraft startup and status timers.
                </p>
            </div>
        );
    }
}

export default Preferences;

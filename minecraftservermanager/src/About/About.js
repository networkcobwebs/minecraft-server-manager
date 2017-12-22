import React, { Component } from 'react';

const styles = {
    container: {
        margin: 10,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '.95rem'
    }
  };

class About extends Component {
    render () {
        return (
            <div style={styles.container}>
                <p>
                    Talk about things used: Minecraft, NodeJS, React, Material-UI, developers, testers
                </p>
            </div>
        );
    }
}

export default About;

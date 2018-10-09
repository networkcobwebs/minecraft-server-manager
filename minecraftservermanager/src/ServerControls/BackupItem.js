import React from 'react';

export default class BackupItem extends React.Component {
    render () {
        let backup = this.props.backup;

        return (
            <option value = { backup.fileName }>{ backup.worldName }: Taken { backup.date } at { backup.time }</option>
        );
    }
}
import React from 'react';
import PropTypes from 'prop-types';

export default class BackupItem extends React.Component {
  render () {
    const backup = this.props.backup;

    return (
      <option value={backup.fileName}>{backup.worldName}: Taken {backup.date} at {backup.time}</option>
    );
  }
}

BackupItem.propTypes = {
  backup: PropTypes.object.isRequired
};

import React from 'react';
import PropTypes from 'prop-types';

import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';

export default class PlayerListItem extends React.Component {

    render () {
        let player = this.props.player || {};

        return (
            <TableRow>
                <TableCell>{ player.name }</TableCell>
            </TableRow>
        );
    }
}

PlayerListItem.propTypes = {
    player: PropTypes.object.isRequired
};

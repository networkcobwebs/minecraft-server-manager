import React from 'react';
import PropTypes from 'prop-types';

import 'typeface-roboto';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

export default class PlayerListItem extends React.Component {

    render () {
        let player = this.props.player || {};

        return (
            <TableRow>
                <TableCell>
                    <Typography>
                        { player.name }
                    </Typography>
                </TableCell>
            </TableRow>
        );
    }
}

PlayerListItem.propTypes = {
    player: PropTypes.object.isRequired
};

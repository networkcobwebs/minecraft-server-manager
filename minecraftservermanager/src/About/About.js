import React from 'react';
import PropTypes from 'prop-types';

import Help from '@material-ui/icons/Help';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Tooltip from '@material-ui/core/Tooltip';

const styles = {
    container: {
        margin: 10,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '.95rem'
    }
};

class About extends React.Component {
    render () {
        let minecraftProperties = this.props.minecraftProperties;
        const GB = 1024 ** 3;
        let mem = minecraftProperties.nodeInfo.mem / GB;

        return (
            <div style={styles.container}>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell><a href={ minecraftProperties.eulaUrl }>Minecraft End User License Agreement</a></TableCell>
                            <TableCell align='right'> </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Contributors</TableCell>
                            <TableCell> </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>Author</TableCell>
                            <TableCell align='right'>nickrnet</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Testing</TableCell>
                            <TableCell align='right'> </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <Table padding='dense'>
                    <TableHead>
                        <TableRow>
                            <TableCell>System Information</TableCell>
                            <TableCell> </TableCell>
                            <TableCell align='right'> </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>CPU</TableCell>
                            <TableCell align='right'>
                                { minecraftProperties.nodeInfo.cpus[0].model + ', ' + minecraftProperties.nodeInfo.cpus.length + ' cores' }
                            </TableCell>
                            <TableCell align='right'>
                                <Tooltip title = "Logical CPUs, both physical and virtual">
                                    <Help />
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>RAM</TableCell>
                            <TableCell align='right'>{ mem } GB</TableCell>
                            <TableCell align='right'> </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>NodeJS Version</TableCell>
                            <TableCell align='right'>{ minecraftProperties.nodeInfo.version }</TableCell>
                            <TableCell align='right'> </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                {/* <div>
                    <script type="text/javascript">
                        amzn_assoc_ad_type = "banner";
                        amzn_assoc_marketplace = "amazon";
                        amzn_assoc_region = "US";
                        amzn_assoc_placement = "assoc_banner_placement_default";
                        amzn_assoc_banner_type = "ez";
                        amzn_assoc_p = "9";
                        amzn_assoc_width = "180";
                        amzn_assoc_height = "150";
                        amzn_assoc_tracking_id = "nickrnet-20";
                        amzn_assoc_linkid = "2c598468f363378d5fb52de183d72a89";
                    </script>
                    <script src="https://z-na.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&Operation=GetScript&ID=OneJS&WS=1"></script>
                </div>
                <p>
                    Support this project by making purchases from Amazon.
                </p>
                <iframe src="https://rcm-na.amazon-adsystem.com/e/cm?o=1&p=9&l=ez&f=ifr&linkID=94a6a8bcf4c0832533e2ed9b53ea4ccc&t=nickrnet-20&tracking_id=nickrnet-20" width="180" height="150" scrolling="no" border="1" marginWidth="0" title="Amazon" style={ styles.container } frameBorder="0"></iframe> */}
            </div>
        );
    }
}

About.propTypes = {
    minecraftProperties: PropTypes.object.isRequired
};

export default About;

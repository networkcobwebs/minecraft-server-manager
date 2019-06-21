import React from 'react';
import PropTypes from 'prop-types';

import Help from '@material-ui/icons/Help';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

class About extends React.Component {
    render () {
        let minecraftProperties = this.props.minecraftProperties;
        const GB = 1024 ** 3;
        let mem = minecraftProperties.nodeInfo.mem / GB;

        return (
            <div>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Typography variant="h6">
                                    <a href={ minecraftProperties.eulaUrl } target="_blank" rel="noopener noreferrer">Minecraft End User License Agreement</a>
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    Contributors
                                </Typography>
                            </TableCell>
                            <TableCell> </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    Author
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography>
                                    nickrnet
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    Testing
                                </Typography>
                            </TableCell>
                            <TableCell> </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    System Information
                                </Typography>
                            </TableCell>
                            <TableCell> </TableCell>
                            <TableCell> </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    CPU
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography>
                                    { minecraftProperties.nodeInfo.cpus[0].model + ', ' + minecraftProperties.nodeInfo.cpus.length + ' cores' }
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Tooltip title = "Logical CPUs, both physical and virtual">
                                    <Help />
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    RAM
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography>
                                    { mem } GB
                                </Typography>
                            </TableCell>
                            <TableCell> </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2">
                                    NodeJS Version
                                </Typography>
                            </TableCell>
                            <TableCell>{ minecraftProperties.nodeInfo.version }</TableCell>
                            <TableCell> </TableCell>
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

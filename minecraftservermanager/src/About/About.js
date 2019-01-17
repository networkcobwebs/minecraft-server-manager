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
                <div>
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
                <iframe src="https://rcm-na.amazon-adsystem.com/e/cm?o=1&p=9&l=ez&f=ifr&linkID=94a6a8bcf4c0832533e2ed9b53ea4ccc&t=nickrnet-20&tracking_id=nickrnet-20" width="180" height="150" scrolling="no" border="1" marginWidth="0" title="Amazon" style={styles.container} frameBorder="1"></iframe>
            </div>
        );
    }
}

export default About;

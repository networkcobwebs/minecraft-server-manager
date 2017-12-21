import React, { Component } from 'react';

import axios from 'axios';

import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import * as Colors from 'material-ui/colors';
import Tabs, { Tab } from 'material-ui/Tabs';
import AppBar from 'material-ui/AppBar';

import Dashboard from './Dashboard/Dashboard.js';
import Players from './Players/Players.js';
import ServerControls from './ServerControls/ServerControls.js';
import WorldControls from './ServerControls/WorldControls.js';
import About from './About/About.js';

const getTheme = () => {
    const theme = createMuiTheme({
        "palette": {
            "primary": Colors.blue800,
            "primary2r": Colors.blue300,
            "accent": Colors.deepOrangeA200,
            "pickerHeader": Colors.blue800
        },
        "tableRowColumn": {
            "height": 60
        }
    });
    
    return theme;
}

class App extends Component {
    constructor (props) {
        super(props);

        this.state = {
            value: 0,
            minecraftStatus: {},
            minecraftServerProperties: {},
            minecraftServerBannedIps: {},
            minecraftServerBannedPlayers: {},
            minecraftServerWhitelist: {},
            minecraftServerOps: {},
            minecraftServerUserCache: {}
        };
    };

    componentWillMount () {
        this.getMinecraftStatus(100);
        this.getMinecraftServerProperties();
        this.getMinecraftServerBannedIps();
        this.getMinecraftServerBannedPlayers();
        this.getMinecraftServerWhitelist();
        this.getMinecraftServerOps();
        this.getMinecraftServerUserCache();
    };

    componentWillUnmount () {
        this.stopMinecraftStatus();
    };
    
    handleChange = (event, value) => {
        this.setState({ value });
    };

    getMinecraftStatus (pingWait) {
        let normalPingTime = 10 * 1000,
            appendTime = 5 * 1000,
            maxTime = 120 * 1000,
            pingTime;

        // normally ping every 10 seconds
        // if a fast ping was requested (from constructor/DidMount), honor it
        // once trouble hits, add 5 seconds until 2 minutes is reached, then reset to 10 seconds
        // once re/successful, reset to 10 seconds
        if (!pingWait) {
            pingTime = normalPingTime;
        } else if (pingWait < 1000) {
            pingTime = pingWait;
        } else if (pingWait > maxTime) {
            pingTime = normalPingTime;
        } else {
            pingTime = pingWait;
        }

        if (this.statusTimerId) {
            clearTimeout(this.statusTimerId);
        }

        this.statusTimerId = setTimeout(() => {
            // TODO Make the URL a property that can be changed
            axios(`http://localhost:3001/api/status`).then(res => {
                let minecraftStatus = res.data;
                this.setState({ minecraftStatus });
                this.statusTimerId = setTimeout(
                    () => this.getMinecraftStatus(normalPingTime),
                    normalPingTime
                );
            },
            err => {
                pingTime = pingTime + appendTime;
                this.statusTimerId = setTimeout(
                    () => this.getMinecraftStatus(pingTime),
                    pingTime
                );
            });
        }, pingTime);
    };

    stopMinecraftStatus () {
        let minecraftStatus = {};
        this.setState({ minecraftStatus });

        if (this.statusTimerId) {
            clearTimeout(this.statusTimerId);
        }
    };
  
    getMinecraftServerProperties () {
        return axios(`http://localhost:3001/api/properties`).then(res => {
            let minecraftServerProperties = res.data;
            minecraftServerProperties = minecraftServerProperties.properties;
            this.setState({ 
                minecraftServerProperties
            });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
        }).catch(e => {
            console.log('An error occurred getting the server properties:', e);
        });
    };
  
    getMinecraftServerBannedIps () {
        return axios(`http://localhost:3001/api/bannedIps`).then(res => {
            let minecraftServerBannedIps = res.data;
            minecraftServerBannedIps = minecraftServerBannedIps;
            this.setState({ 
                minecraftServerBannedIps
            });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
        }).catch(e => {
            console.log('An error occurred getting the banned IPs:', e);
        });
    };
  
    getMinecraftServerBannedPlayers () {
        return axios(`http://localhost:3001/api/bannedPlayers`).then(res => {
            let minecraftServerBannedPlayers = res.data;
            minecraftServerBannedPlayers = minecraftServerBannedPlayers.bannedPlayers;
            this.setState({ 
                minecraftServerBannedPlayers
            });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
        }).catch(e => {
            console.log('An error occurred getting the banned players:', e);
        });
    };
  
    getMinecraftServerWhitelist () {
        return axios(`http://localhost:3001/api/whitelist`).then(res => {
            let minecraftServerWhitelist = res.data;
            minecraftServerWhitelist = minecraftServerWhitelist.whitelist;
            this.setState({ 
                minecraftServerWhitelist
            });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
        }).catch(e => {
            console.log('An error occurred getting the banned players:', e);
        });
    };
  
    getMinecraftServerOps () {
        return axios(`http://localhost:3001/api/ops`).then(res => {
            let minecraftServerOps = res.data;
            minecraftServerOps = minecraftServerOps.ops;
            this.setState({ 
                minecraftServerOps
            });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
        }).catch(e => {
            console.log('An error occurred getting the ops:', e);
        });
    };
  
    getMinecraftServerUserCache () {
        return axios(`http://localhost:3001/api/userCache`).then(res => {
            let minecraftServerUserCache = res.data;
            minecraftServerUserCache = minecraftServerUserCache.userCache;
            this.setState({ 
                minecraftServerUserCache
            });
        },
        err => {
            console.log('An error occurred contacting the Minecraft server.', err);
        }).catch(e => {
            console.log('An error occurred getting the user cache:', e);
        });
    };

    render () {
        return (
            <MuiThemeProvider theme={ getTheme() }>
                <AppBar position="static">
                    <Tabs
                        value = { this.state.value }
                        onChange = { this.handleChange }
                        centered>
                        <Tab label="Dashboard" />
                        <Tab label="Players" />
                        <Tab label="Server Control" />
                        <Tab label="About" />
                    </Tabs>
                </AppBar>
                { this.state.value === 0 && <Dashboard minecraftState = { this.state } /> }
                { this.state.value === 1 && <Players /> }
                { this.state.value === 2 && <div>
                    <WorldControls />
                    <ServerControls
                        minecraftState = { this.state } />
                </div> }
                { this.state.value === 3 && <About /> }
            </MuiThemeProvider>
        );
    };
}

export default App;

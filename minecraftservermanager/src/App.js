import React, { Component } from 'react';

import axios from 'axios';

import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import * as Colors from 'material-ui/colors';
import Tabs, { Tab } from 'material-ui/Tabs';
import AppBar from 'material-ui/AppBar';
import Button from 'material-ui/Button';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';

import Dashboard from './Dashboard/Dashboard.js';
import Players from './Players/Players.js';
import ServerControls from './ServerControls/ServerControls.js';
import WorldControls from './ServerControls/WorldControls.js';
import About from './About/About.js';

const debug = false;

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
            debug: debug,
            value: 0,
            minecraftStatus: {},
            eulaOpen: true,
            minecraftServerProperties: [],
            minecraftServerBannedIps: [],
            minecraftServerBannedPlayers: [],
            minecraftServerWhitelist: [],
            minecraftServerOps: [],
            minecraftServerUserCache: [],
            playerSummary: '',
            playerNames: []
        };
        if (debug) {
            console.log('App state:', this.state);
        }
        this.getMinecraftStatus(25);
        this.getMinecraftPlayers(50);
    };

    componentWillUnmount () {
        if (debug) {
            console.log('Application shutting down.');
        }
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
            axios(`/api/status`).then(res => {
                let minecraftStatus = res.data;
                this.setState({ minecraftStatus });
                
                this.getMinecraftServerProperties();
                this.getMinecraftServerBannedIps();
                this.getMinecraftServerBannedPlayers();
                this.getMinecraftServerWhitelist();
                this.getMinecraftServerOps();
                this.getMinecraftServerUserCache();
                this.getMinecraftPlayers();

                if (debug) {
                    console.log('Setting Minecraft status poller to run in', pingTime/1000, 'seconds.');
                }
                this.getMinecraftStatus();
            },
            err => {
                let minecraftStatus = {};

                this.setState({ minecraftStatus });

                pingTime = pingTime + appendTime;

                if (debug) {
                    console.log('Application state:', this.state);
                    console.log('Setting Minecraft status poller to run in', pingTime/1000, 'seconds.');
                }
                this.getMinecraftStatus(pingTime);
            });
        }, pingTime);
    };

    stopMinecraftStatus () {
        if (debug) {
            console.log('Stopping Minecraft server poller.');
        }

        let minecraftStatus = {};
        this.setState({ minecraftStatus });

        if (this.statusTimerId) {
            clearTimeout(this.statusTimerId);
        }

        if (this.playersTimerId) {
            clearTimeout(this.playersTimerId);
        }
    };
  
    getMinecraftServerProperties () {
        if (debug) {
            console.log('Retrieving Minecraft Server properties.');
        }

        let minecraftStatus = this.state.minecraftStatus;

        if (minecraftStatus.minecraftOnline) {
            axios(`/api/properties`).then(res => {
                let minecraftServerProperties = res.data;
                minecraftServerProperties = minecraftServerProperties.properties;
                this.setState({ minecraftServerProperties });
                if (debug) {
                    console.log('App state after fetching properties:', this.state);
                }
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            }).catch(e => {
                console.log('An error occurred getting the server properties:', e);
            });
        }
    };
  
    getMinecraftServerBannedIps () {
        if (debug) {
            console.log('Retrieving Minecraft Server banned IPs.');
        }

        let minecraftStatus = this.state.minecraftStatus;

        if (minecraftStatus.minecraftOnline) {
            return axios(`/api/bannedIps`).then(res => {
                let minecraftServerBannedIps = res.data;
                minecraftServerBannedIps = minecraftServerBannedIps.bannedIps;
                this.setState({ 
                    minecraftServerBannedIps
                });
                if (debug) {
                    console.log('App state after fetching banned IPs:', this.state);
                }
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            }).catch(e => {
                console.log('An error occurred getting the banned IPs:', e);
            });
        }
    };
  
    getMinecraftServerBannedPlayers () {
        if (debug) {
            console.log('Retrieving Minecraft Server banned players.');
        }

        let minecraftStatus = this.state.minecraftStatus;

        if (minecraftStatus.minecraftOnline) {
            return axios(`/api/bannedPlayers`).then(res => {
                let minecraftServerBannedPlayers = res.data;
                minecraftServerBannedPlayers = minecraftServerBannedPlayers.bannedPlayers;
                this.setState({ 
                    minecraftServerBannedPlayers
                });
                if (debug) {
                    console.log('App state after fetching banned players:', this.state);
                }
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            }).catch(e => {
                console.log('An error occurred getting the banned players:', e);
            });
        }
    };
  
    getMinecraftServerWhitelist () {
        if (debug) {
            console.log('Retrieving Minecraft Server whitelist.');
        }

        let minecraftStatus = this.state.minecraftStatus;

        if (minecraftStatus.minecraftOnline) {
            return axios(`/api/whitelist`).then(res => {
                let minecraftServerWhitelist = res.data;
                minecraftServerWhitelist = minecraftServerWhitelist.whitelist;
                this.setState({ 
                    minecraftServerWhitelist
                });
                if (debug) {
                    console.log('App state after fetching whitelist:', this.state);
                }
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            }).catch(e => {
                console.log('An error occurred getting the banned players:', e);
            });
        }
    };
  
    getMinecraftServerOps () {
        if (debug) {
            console.log('Retrieving Minecraft Server ops.');
        }

        let minecraftStatus = this.state.minecraftStatus;

        if (minecraftStatus.minecraftOnline) {
            return axios(`/api/ops`).then(res => {
                let minecraftServerOps = res.data;
                minecraftServerOps = minecraftServerOps.ops;
                this.setState({ 
                    minecraftServerOps
                });
                if (debug) {
                    console.log('App state after fetching ops:', this.state);
                }
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            }).catch(e => {
                console.log('An error occurred getting the ops:', e);
            });
        }
    };
  
    getMinecraftServerUserCache () {
        if (debug) {
            console.log('Retrieving Minecraft Server user cache.');
        }

        let minecraftStatus = this.state.minecraftStatus;

        if (minecraftStatus.minecraftOnline) {
            return axios(`/api/userCache`).then(res => {
                let minecraftServerUserCache = res.data;
                minecraftServerUserCache = minecraftServerUserCache.userCache;
                this.setState({ 
                    minecraftServerUserCache
                });
                if (debug) {
                    console.log('App state after fetching user cache:', this.state);
                }
            },
            err => {
                console.log('An error occurred contacting the Minecraft server.', err);
            }).catch(e => {
                console.log('An error occurred getting the user cache:', e);
            });
        }
    };

    getMinecraftPlayers (pingWait) {
        let normalPingTime = 5 * 1000,
            appendTime = 5 * 1000,
            maxTime = 120 * 1000,
            pingTime,
            minecraftStatus = this.state.minecraftStatus;

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

        if (this.playersTimerId) {
            clearTimeout(this.playersTimerId);
        }

        this.playersTimerId = setTimeout(() => {
            if (minecraftStatus.minecraftOnline) {
                axios(`/api/command?command=/list`).then(res => {
                    let result = res.data,
                        playerList = result.response,
                        playerNames = [],
                        players, somePlayerName, somePlayerNames, testData, playerSummary,
                        i, p;

                    if (playerList.includes('Fail')) {
                        // Squelch for now
                        let playerSummary = '',
                            playerNames = [];

                        this.setState({ playerSummary });
                        this.setState({ playerNames });

                        pingTime = pingTime + appendTime;

                        if (this.state.debug) {
                            console.log('Setting Minecraft player poller to run in', pingTime/1000, 'seconds.');
                        }
                        this.getMinecraftPlayers(pingTime);
                    } else {
                        // First line is the summary,
                        // followed by player names, comma+space separated
                        players = playerList.split(/\n/);
                        playerSummary = players.shift();
                        // Remove trailing ':'
                        playerSummary = playerSummary.slice(0, -1);
                        // Remove preceding timestamp/server info
                        playerSummary = playerSummary.split(']: ')[1];

                        // Get playerNames
                        for (i = 0; i < players.length; i++) {
                            // Remove preceding timestamp & server info
                            somePlayerNames = players[i].split(']: ')[1];

                            if (somePlayerNames) {
                                somePlayerNames = somePlayerNames.split(',');
                                for (p = 0; p < somePlayerNames.length; p++) {
                                    somePlayerName = somePlayerNames[p];
                                    if (somePlayerName) {
                                        // Make sure we check for multiple spaces so as to
                                        // ignore any bad data like things that were
                                        // accidentally in the buffer at the same time we
                                        // queried, etc.
                                        testData = somePlayerName.split(' ');
                                        if (testData.length <= 2) {
                                            playerNames.push(this.objectifyPlayer(somePlayerName.trim()));
                                        }
                                    }
                                }
                            }
                        }

                        // console.log('playerNames discovered:', playerNames);
                        
                        this.setState({ playerSummary });
                        this.setState({ playerNames });

                        if (this.state.debug) {
                            console.log('PlayersSummary state:', this.state);
                            console.log('Setting Minecraft player poller to run in', pingTime/1000, 'seconds.');
                        }

                        this.getMinecraftPlayers();
                    }
                },
                err => {
                    let playerSummary = '',
                        playerNames = [];

                    this.setState({ playerSummary });
                    this.setState({ playerNames });

                    pingTime = pingTime + appendTime;

                    if (this.state.debug) {
                        console.log('PlayersSummary state:', this.state.playerSummary, this.state.playerNames);
                        console.log('Setting Minecraft player poller to run in', pingTime/1000, 'seconds.');
                    }
                    this.getMinecraftPlayers(pingTime);
                });
            } else {
                if (this.state.debug) {
                    console.log('Setting Minecraft player poller to run in', pingTime/1000, 'seconds.');
                }
                this.getMinecraftPlayers();
            }
        }, pingTime);
    }

    objectifyPlayer (player) {
        return { name: player };
    }

    handleEulaOpen = () => {
        this.setState({ eulaOpen: true });
    };
  
    handleEulaClose = () => {
        axios({
            method: 'post',
            url: '/api/acceptEula'
        }).then(res => {
            this.setState({ eulaOpen: false });
        });
    };

    displayEulaDialog () {
        let minecraftStatus = this.state.minecraftStatus;

        if (!minecraftStatus.minecraftAcceptedEula) {
            return (
                <Dialog
                    open={this.state.eulaOpen}
                    onClose={this.handleEulaClose}>
                    <DialogTitle>{"Accept Minecraft End User License Agreement?"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            By using this application, you agree to the terms of the Minecraft end user
                            license agreement, available <a href={ minecraftStatus.minecraftEulaUrl }>here</a>.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleEulaClose} color="primary">
                        Disagree
                        </Button>
                        <Button onClick={this.handleEulaClose} color="primary" autoFocus>
                        Agree
                        </Button>
                    </DialogActions>
                </Dialog>
            );
        } else {
            return <div></div>
        }
    }
    
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
                        {/* <Tab label="Preferences" /> */}
                        <Tab label="About" />
                    </Tabs>
                </AppBar>
                { this.state.value === 0 && <Dashboard minecraftState = { this.state } /> }
                { this.state.value === 1 && <Players /> }
                { this.state.value === 2 && <div>
                    <WorldControls minecraftState = { this.state } />
                    <ServerControls minecraftState = { this.state } />
                </div> }
                {/* TODO Preferences (poll times, start Minecraft always, updates, etc.) */}
                { this.state.value === 3 && <About /> }
                { this.displayEulaDialog() }
            </MuiThemeProvider>
        );
    };
}

export default App;

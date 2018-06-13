import React from 'react';

import axios from 'axios';

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { blue800 } from '@material-ui/core/colors';
import { blue300 } from '@material-ui/core/colors';
import { deepOrangeA200 } from '@material-ui/core/colors';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Snackbar from '@material-ui/core/Snackbar';

import Dashboard from './Dashboard/Dashboard.js';
import Players from './Players/Players.js';
import ServerControls from './ServerControls/ServerControls.js';
import WorldControls from './ServerControls/WorldControls.js';
import About from './About/About.js';

const debug = false;

const getTheme = () => {
    const theme = createMuiTheme({
        "palette": {
            "primary": blue800,
            "primary2r": blue300,
            "accent": deepOrangeA200,
            "pickerHeader": blue800
        },
        "tableRowColumn": {
            "height": 60
        }
    });
    
    return theme;
};

class App extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            debug: debug,
            value: 0,
            minecraftStatus: {},
            eulaOpen: false,
            minecraftEulaUrl: 'https://account.mojang.com/documents/minecraft_eula',
            minecraftServerProperties: [],
            minecraftServerBannedIps: [],
            minecraftServerBannedPlayers: [],
            minecraftServerWhitelist: [],
            minecraftServerOps: [],
            minecraftServerUserCache: [],
            minecraftCommands: [],
            playerSummary: '',
            playerNames: []
        };
        if (debug) {
            console.log('App state:', this.state);
        }
        this.getMinecraftStatus(25);
        this.getMinecraftPlayers(25);
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
      
    getMinecraftCommands = () => {
        return axios({
            method: 'get',
            url: '/api/commands'
        }).then(res => {
            this.setState({ minecraftCommands: res.data.commands });
        });
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
                this.setState({ eulaOpen: minecraftStatus.minecraftAcceptedEula });
                
                this.getMinecraftServerProperties();
                this.getMinecraftServerBannedIps();
                this.getMinecraftServerBannedPlayers();
                this.getMinecraftServerWhitelist();
                this.getMinecraftServerOps();
                this.getMinecraftServerUserCache();
                this.getMinecraftPlayers();

                if (!this.state.minecraftCommands || this.state.minecraftCommands.length === 0) {
                    this.getMinecraftCommands();
                }

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

        // normally ping every 5 seconds
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
    };

    objectifyPlayer (player) {
        return { name: player };
    };

    handleEulaOpen = () => {
        this.setState({ eulaOpen: true });
    };
  
    handleAcceptEula = () => {
        axios({
            method: 'post',
            url: '/api/acceptEula'
        }).then(res => {
            console.log('res:', res);
            this.setState({ eulaOpen: false });
        }, error => {
            console.log('error:', error);
            this.setState({ eulaOpen: false });
        }).catch(error => {
            console.log('error:', error);
            this.setState({ eulaOpen: false });
        });
    };
  
    handleDeclineEula = () => {
        axios({
            method: 'post',
            url: '/api/command?command=/stop'
        }).then(res => {
            console.log('res:', res);
            this.setState({ eulaOpen: false });
        }, error => {
            console.log('error:', error);
            this.setState({ eulaOpen: false });
        }).catch(error => {
            console.log('error:', error);
            this.setState({ eulaOpen: false });
        });
    };
    
    render () {
        let minecraftStatus = this.state.minecraftStatus,
            vertical = 'top',
            horizontal = 'left';

        return (
            <MuiThemeProvider theme={ getTheme() }>
                <AppBar position="static">
                    <Tabs
                        value = { this.state.value }
                        onChange = { this.handleChange }
                        centered>
                        <Tab label="Dashboard" />
                        <Tab label="Players" />
                        <Tab label="World Controls" />
                        <Tab label="Server Controls" />
                        {/* <Tab label="Preferences" /> */}
                        <Tab label="About" />
                    </Tabs>
                </AppBar>
                { this.state.value === 0 && <Dashboard minecraftState = { this.state } /> }
                { this.state.value === 1 && <Players minecraftState = { this.state } /> }
                { this.state.value === 2 && <WorldControls minecraftState = { this.state } /> }
                { this.state.value === 3 && <ServerControls minecraftState = { this.state } /> }
                {/* TODO Preferences (poll times, start Minecraft always, updates, etc.) */}
                { this.state.value === 4 && <About /> }
                <Snackbar
                    anchorOrigin = {{ vertical, horizontal }}
                    open = { !minecraftStatus.minecraftOnline }
                    message = {<span id="message-id">Minecraft is currently stopped.</span>}
                />
                <Dialog
                    open = { !minecraftStatus.minecraftAcceptedEula }>
                    <DialogTitle>{"Accept Minecraft End User License Agreement?"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            By using this application, you agree to the terms of the Minecraft end user
                            license agreement, available <a href={ minecraftStatus.minecraftEulaUrl || this.state.minecraftEulaUrl }>here</a>.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick = { this.handleDeclineEula } color="primary">
                        Disagree
                        </Button>
                        <Button onClick = { this.handleAcceptEula } color="primary" autoFocus>
                        Agree
                        </Button>
                    </DialogActions>
                </Dialog>
            </MuiThemeProvider>
        );
    };
};

export default App;

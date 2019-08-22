import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import axios from 'axios';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
});

it('gets minecraft status', () => {
  axios('/api/properties').then(res => {
    let minecraftServerProperties = res.data;
    minecraftServerProperties = minecraftServerProperties.properties;
    expect(minecraftServerProperties.length).not.toBe(0);
  },
  err => {
    // throw err;
    console.log('Minecraft online?');
  }).catch(e => {
    throw e;
  });
});

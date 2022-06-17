import React from 'react';

class Version extends React.Component {
  render() {
    let packageJson = require('../package.json');
    return ( <p><small><small>Version <a href="https://github.com/Salmon-Nation-Decentralized-Alliance/Theia">{packageJson.version}</a></small></small></p> );
  }
}

export { Version };



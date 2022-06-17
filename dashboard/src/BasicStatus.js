//import configData from './pool.json';

import React from 'react';

class BasicStatus extends React.Component {
  constructor(props) {
    super(props);

    this.state={};
    this.state.updateActive=false;
    this.state.updateInterval=1000; // ms

    this.state.pingCurrentIdx=0; 
    this.state.pingUrls=props.results
    props.results.forEach(ping => {
      this.setState({ping: {}});
    })

    this.activateUpdate = this.activateUpdate.bind(this);
    this.deactivateUpdate = this.deactivateUpdate.bind(this);
    this.initiateConnectionStateUpdate = this.initiateConnectionStateUpdate.bind(this);
    this.handleConnectionStateUpdate = this.handleConnectionStateUpdate.bind(this);

    this.request = new XMLHttpRequest(); 
    this.request.onreadystatechange = this.handleConnectionStateUpdate;
    this.requestIsInFlight=false; 
    this.requestIntervalId=null;

  }

  componentDidMount() {
    this.activateUpdate();
  }
  componentWillUnmount() {
    this.deactivateUpdate();
  }

  activateUpdate() {
    if (this.state.updateActive === false) {
      this.setState({ updateActive: true });
      this.requestIntervalId = window.setInterval(this.initiateConnectionStateUpdate,this.state.updateInterval);
    }
  }
  deactivateUpdate() {
    if (this.state.updateActive === true) {
      this.setState({ updateActive: false });
    }
    if (this.requestIntervalId != null) {
      window.clearInterval(this.requestintervalId);
      this.requestIntervalId=null;
    }
  }

  initiateConnectionStateUpdate() {
    if (!this.state.updateActive) { 
      return;
    }
    if (this.requestIsInFlight) { 
      console.log("AJAX: waiting for response from previous reqeust");
      return;
    }
    let idx=this.state.pingCurrentIdx;
    let url=this.state.pingUrls[idx];
    this.requestIsInFlight = true;
    this.request.open("GET", url, true);
    this.request.send();
  }

  flushCache() {
    console.log("Theia restarted");
  }

//    this.state.pingCurrentIdx=0; 
//    this.state.pingUrls=props.results
//    props.results.forEach(ping => {
//      this.state[ping] = {}
//    }

  handleConnectionStateUpdate() {
    let idx=this.state.pingCurrentIdx;
    let nextIdx = idx + 1;
    if (nextIdx >= this.state.pingUrls.length) {
      nextIdx = 0;
    }
    let url=this.state.pingUrls[idx];
    if (this.request.readyState === 4) {
      this.requestIsInFlight = false;
    }
    if (this.request.readyState === 4 && this.request.status === 202) {
      //console.log(this.request);
      if (this.state.updateActive) { 
        let parsedResult=JSON.parse(this.request.responseText);
        console.log("Updating state... ");
        let update = {
          pingCurrentIdx: nextIdx
        }
        update[url]=parsedResult
        this.setState(update);
      }
    }
  }

  render() {

    return (
      <div>
        <h1><img src={process.env.PUBLIC_URL + "/theia.png"} alt="Theia" />Theia</h1>
        <p><small><small>Version X built on X <a href="https://github.com/Salmon-Nation-Decentralized-Alliance/Theia">Source</a></small></small></p>
        <p>Result set {this.state.pingCurrentIdx}: {this.state.pingUrls[this.state.pingCurrentIdx]}</p>
      </div>
    );
  }
}

export { BasicStatus };



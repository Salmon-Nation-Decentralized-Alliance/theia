//import configData from './pool.json';
import React from 'react';
import { Version } from './Version';

class BasicStatus extends React.Component {
  constructor(props) {
    super(props);

    this.state={};
    this.state.updateActive=false;
    this.state.updateInterval=2000; // milliseconds

    this.state.pingResultSources=props.pingResultSources;
    this.state.pingResultCurrentIdx=0; 
    let pingResults = {};
    props.pingResultSources.forEach(pingResultSource => {
      pingResults[pingResultSource.id] = {};
    });
    this.state.pingResults = pingResults;

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
    let idx=this.state.pingResultCurrentIdx;
    let url=this.state.pingResultSources[idx].url;
    this.requestIsInFlight = true;
    this.request.open("GET", url, true);
    this.request.send();
  }

  flushCache() {
    console.log("Theia restarted");
  }

  handleConnectionStateUpdate() {
    let idx=this.state.pingResultCurrentIdx;
    let pingResultSource = this.state.pingResultSources[idx];
    let nextIdx = idx + 1;
    if (nextIdx >= this.state.pingResultSources.length) {
      nextIdx = 0;
    }
    //console.log("readyState = " + this.request.readyState + "  status = " + this.request.status);
    //console.log(this.request);
    if (this.request.readyState === 4) {
      this.requestIsInFlight = false;
    } 
    if (this.request.readyState === 4 && this.request.status === 200) {
      if (this.state.updateActive) { 
        //console.log("Updating state... ");
        let parsedResult = {};
        try {
          parsedResult = JSON.parse(this.request.responseText);
        } catch(err) {
          console.log("Error parsing JSON for pingResultSource " + pingResultSource.id + " (" + pingResultSource.name + ")");
          console.log(err);
        }
        let pingResults = this.state.pingResults;
        pingResults[pingResultSource.id]=parsedResult;
        let update = { 
          "pingResultCurrentIdx": nextIdx,
          "pingResults": pingResults
        };
        this.setState(update);
      }
    }
  }

  render() {
    return (
      <div>
        <h1><img src={process.env.PUBLIC_URL + "/theia.png"} alt="Theia" />Theia</h1>
        <Version />
        <p>Result set {this.state.pingResultCurrentIdx}: {this.state.pingResultSources[this.state.pingResultCurrentIdx].url}</p>
      </div>
    );
  }
}

export { BasicStatus };



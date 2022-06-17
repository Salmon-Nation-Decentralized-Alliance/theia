import React from 'react';
import { ResultHeader, ResultRow } from './Result';

class BasicStatus extends React.Component {
  constructor(props) {
    super(props);

    this.state={};
    this.state.updateActive=false;
    this.state.updateInterval=2000; // milliseconds

    this.state.pingResultCurrentIdx=0; 
    let pingResults = {};
    props.pingResultSources.forEach(pingResultSource => {
      pingResults[pingResultSource.id] = {};
    });
    this.state.pingResults = pingResults;
    this.state.poolIndex = {};

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
    let url=this.props.pingResultSources[idx].url;
    this.requestIsInFlight = true;
    this.request.open("GET", url, true);
    this.request.send();
  }

  flushCache() {
    console.log("Theia restarted");
  }

  generatePoolIndex(pingResultSources, pingResults) {
    let poolIndex = {};
    pingResultSources.forEach(pingResultSource => {
      let srcId = pingResultSource.id;
      if (srcId in pingResults && "ping_results" in pingResults[srcId]) {
        pingResults[srcId]["ping_results"].forEach(poolResult => {
          let publicKey = poolResult.publicKey;
          if (!(publicKey in poolIndex)) {
            poolIndex[publicKey] = {
              "name": "unknown", 
              "description": "", 
              "homepage": "",
              "address": "", 
              "port": "",
              "publicKey": "", 
              "ticker": "",
              "results": {}
            };
          }
          if (typeof poolResult !== 'undefined') {
            poolIndex[publicKey]["results"][srcId] = poolResult;
            let fields = ["name", "description", "homepage", "address", "port", "publicKey", "ticker"];
            fields.forEach( field => {
              if (field in poolResult) {
                poolIndex[publicKey][field] = poolResult[field];
              }
            });
          }
        });
      };
    });
    //console.log(poolIndex);
    return poolIndex;
  }

  handleConnectionStateUpdate() {
    let idx=this.state.pingResultCurrentIdx;
    let pingResultSource = this.props.pingResultSources[idx];
    let nextIdx = idx + 1;
    if (nextIdx >= this.props.pingResultSources.length) {
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
          "pingResults": pingResults,
          "poolIndex": this.generatePoolIndex(this.props.pingResultSources, pingResults)
        };
        this.setState(update);
      }
    }
  }

  //<div key="debugHelper">Last Updated: {this.props.pingResultSources[this.state.pingResultCurrentIdx].id} {this.props.pingResultSources[this.state.pingResultCurrentIdx].name}</div>
  render() {
    return (
      <div>
        <table><thead>
          <ResultHeader pingResultSources={this.props.pingResultSources} />
        </thead><tbody>
          {Object.keys(this.state.poolIndex).sort().map(publicKey => (
            <ResultRow key={"row_"+publicKey} pingResultSources={this.props.pingResultSources} publicKey={publicKey} pool={this.state.poolIndex[publicKey]} />
          ))}
        </tbody></table>
      </div>
    );
  }
}

export { BasicStatus };



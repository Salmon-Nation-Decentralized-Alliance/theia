class BasicStatus extends React.Component {
  constructor(props) {
    super(props);

    this.state={};
    this.state.connectionState={};
    this.state.updateActive=false;
    this.state.updateInterval=5000;

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
    if (this.state.updateActive == false) {
      this.setState({ updateActive: true });
      this.requestIntervalId = window.setInterval(this.initiateConnectionStateUpdate,this.state.updateInterval);
    }
  }
  deactivateUpdate() {
    if (this.state.updateActive == true) {
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
    this.requestIsInFlight = true;
    this.request.open("GET", "ping_results.json", true);
    this.request.send();
  }

  flushCache() {
    console.log("Theia restarted");
  }

  handleConnectionStateUpdate() {
    if (this.request.readyState == 4) {
      this.requestIsInFlight = false;
    }
    if (this.request.readyState == 4 && this.request.status == 200) {
      //console.log(this.request);
      if (this.state.updateActive) { 
        let parsedState=JSON.parse(this.request.responseText);
        console.log("Updating state... ");
        this.setState({ connectionState: parsedState });
      }
    }
  }

  render() {
    let conState=this.state.connectionState;
    let proxyInst=conState.proxyInstance;

    return (
      <div>
        <h1>Theia</h1>
        <p><small><small>Version {conState.version} built on {conState.buildDate} <a href="https://github.com/Salmon-Nation-Decentralized-Alliance/Theia">Source</a></small></small></p>
      </div>
    );
  }
}


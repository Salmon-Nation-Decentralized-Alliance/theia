import './App.css';
import { BasicStatus } from './BasicStatus';
import { Version } from './Version';

function App() {
  // We gather multiple ping_results created by multiple nodes throughout the internet. 
  // The idea: by having more than one view of each relays, we can detect
  // if some relays are reachable by some parts of the network, but unreachable 
  // from other parts of the network. 
  // TODO: the following list of ping_result URLs should come from a config file, 
  // dynamically loaded and updated in real-time, or something?
  let pingResultSources = [ 
     { "id": 1, "name": "Sweden", "url": "theia/example_ping_results_1.json" }, 
     { "id": 2, "name": "Brazil", "url": "theia/example_ping_results_2.json" },
     { "id": 3, "name": "Japan",  "url": "theia/example_ping_results_3.json" }
  ];
  return (
    <div className="App">
      <h1><img width="50" height="50" src={process.env.PUBLIC_URL + "/theia.png"} alt="Theia" />&nbsp;&nbsp;&nbsp;Theia</h1>
      <Version />
      <BasicStatus pingResultSources={pingResultSources} />
    </div>
  );
}

export default App;

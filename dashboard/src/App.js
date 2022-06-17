import './App.css';
import { BasicStatus } from './BasicStatus';

function App() {
  let result_urls = [ 'ping_results.json', 'ping_results.json' ]
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <BasicStatus results={result_urls} />
    </div>
  );
}

export default App;

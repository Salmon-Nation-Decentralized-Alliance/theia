import React from 'react';

class ResultHeader extends React.Component {
  render() {
    return (
      <tr>
        <th key="pool">Pool</th>
        {this.props.pingResultSources.map( src => (
          <th key={"header_"+src.id}><a href={src.url}>{src.name}</a></th>
        ))}
      </tr> 
    );
  }
}

function formatEntryBody(publicKey, pool, src) {
  let results=pool["results"];
  let body="";
  if ((src.id in results) && ("ping_result" in results[src.id])) {
    let result = results[src.id]["ping_result"];
    if ("errorMessage" in result) {
      body = result["errorMessage"];
    } else if ("connectDurationMs" in result) {
      body = result["connectDurationMs"] + " ms";
    }
  }
  return body;
}

function formatEntryColor(publicKey, pool, src) {
  let results=pool["results"];
  if ((src.id in results) && ("ping_result" in results[src.id]) && ("connectDurationMs" in results[src.id]["ping_result"])) {
    if (results[src.id]["ping_result"]["connectDurationMs"] > 500) {
      return "orange";
    }
    return "green";
  }
  return "red";
}

class ResultRow extends React.Component {
  render() {
    let pingResultSources = this.props.pingResultSources;
    let publicKey = this.props.publicKey;
    let pool = this.props.pool;
    return (
      <tr>
        <th key={"lead_"+publicKey}><a href={'https://pooltool.io/pool/'+publicKey+'/epochs'}>{pool["name"]}</a></th>
        {pingResultSources.map( src => (
          <td key={"entry_"+src.id+"_"+publicKey}><font color={formatEntryColor(publicKey, pool, src)}>{formatEntryBody(publicKey, pool, src)}</font></td>
        ))}
      </tr> 
    );
  }
}

export { ResultHeader, ResultRow };

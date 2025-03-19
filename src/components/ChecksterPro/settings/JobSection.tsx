import React from 'react';

export function JobSection() {
  return (
    <div>
      <h2>Check identity</h2>
      <p>The check identity is a combination of job name and instance name.</p>
      <h3>Job name</h3>
      <p>Basically the name of the check</p>
      <h3>Instance name</h3>
      <p>
        The particular <code>host:port</code> combination that this check is tasked to monitor
      </p>
    </div>
  );
}

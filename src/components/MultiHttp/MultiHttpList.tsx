import React from 'react';

function MultiHttpList(https) {
  console.log('https', https);

  return (
    <div>
      <ul>
        {https?.https.map((http) => {
          return <li key={http}>{http}</li>;
        })}
      </ul>
    </div>
  );
}

export default MultiHttpList;

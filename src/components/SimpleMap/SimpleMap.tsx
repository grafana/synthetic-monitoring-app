import React from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

import geo from './geo';

interface Props {
  latitude: number;
  longitude: number;
}

export const SimpleMap = ({ latitude, longitude }: Props) => {
  return (
    <div>
      <ComposableMap>
        <Geographies geography={JSON.parse(geo)}>
          {({ geographies }) => geographies.map((geo) => <Geography key={geo.rsmKey} geography={geo} />)}
        </Geographies>
        <Marker coordinates={[Number(longitude), Number(latitude)]}>
          <circle r={8} fill="#F53" />
        </Marker>
      </ComposableMap>
    </div>
  );
};

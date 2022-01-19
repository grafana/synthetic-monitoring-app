import React from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const geoUrl = 'https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json';

interface Props {
  latitude: number;
  longitude: number;
}

export const SimpleMap = ({ latitude, longitude }: Props) => {
  return (
    <div>
      <ComposableMap>
        <Geographies geography={geoUrl}>
          {({ geographies }) => geographies.map((geo) => <Geography key={geo.rsmKey} geography={geo} />)}
        </Geographies>
        <Marker coordinates={[Number(longitude), Number(latitude)]}>
          <circle r={8} fill="#F53" />
        </Marker>
      </ComposableMap>
    </div>
  );
};

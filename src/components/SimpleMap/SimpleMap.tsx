import React, { useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import { fromLonLat, toLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import View from 'ol/View';

import 'ol/ol.css';

interface Props {
  canEdit: boolean;
  latitude: number;
  longitude: number;
  onClick: (coords: number[]) => void;
}

export const SimpleMap = ({ canEdit, latitude, longitude, onClick }: Props) => {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<Feature<Point> | null>(null);

  useEffect(() => {
    if (mapDivRef.current) {
      const map = new Map({
        layers: [new TileLayer({ source: new OSM() })],
        target: mapDivRef.current,
        view: new View({
          center: fromLonLat([longitude, latitude]),
          zoom: 2,
          maxZoom: 7,
        }),
      });

      canEdit &&
        map.on(`click`, (evt) => {
          const point = map.getCoordinateFromPixel(evt.pixel);
          const coords = toLonLat(point);
          onClick(coords);
        });

      const feature = new Feature({
        geometry: new Point(fromLonLat([longitude, latitude])),
        type: 'geoMarker',
      });

      const styles = {
        geoMarker: new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: 'black' }),
            stroke: new Stroke({
              color: 'white',
              width: 2,
            }),
          }),
        }),
      };

      // Create a vector layer
      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: [feature],
        }),
        style: (feature) => {
          // @ts-expect-error
          return styles[feature.get('type')];
        },
      });

      // Add the vector layer to the map
      map.addLayer(vectorLayer);
      markerRef.current = feature;
      feature.getGeometry()?.setCoordinates(fromLonLat([longitude, latitude]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.getGeometry()?.setCoordinates(fromLonLat([longitude, latitude]));
    }
  }, [longitude, latitude]);

  return <div ref={mapDivRef} className={css({ width: `100%`, height: `400px` })} />;
};

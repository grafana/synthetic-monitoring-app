import React, { useEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { platformModifierKeyOnly } from 'ol/events/condition';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { defaults, MouseWheelZoom } from 'ol/interaction';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import { fromLonLat, toLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
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
  const styles = useStyles2(getStyles);
  const mousePointerOver = useRef<boolean>(false);
  const [showWheelHelper, setShowWheelHelperText] = useState(false);

  useEffect(() => {
    if (mapDivRef.current) {
      const map = new Map({
        interactions: defaults({ mouseWheelZoom: false }).extend([
          new MouseWheelZoom({
            condition: platformModifierKeyOnly,
          }),
        ]),
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

  useEffect(() => {
    const key = isMac() ? `metaKey` : `ctrlKey`;

    const handleWheel = (event: WheelEvent) => {
      if (mousePointerOver.current) {
        setShowWheelHelperText(event[key] ? false : true);
      }
    };

    const handleMousedown = (event: MouseEvent) => {
      if (mousePointerOver.current) {
        setShowWheelHelperText(false);
      }
    };

    document.addEventListener('wheel', handleWheel);
    document.addEventListener('mousedown', handleMousedown);

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousedown', handleMousedown);
    };
  }, []);

  return (
    <div className={styles.container}>
      <div
        ref={mapDivRef}
        className={styles.map}
        onMouseEnter={() => (mousePointerOver.current = true)}
        onMouseLeave={() => {
          mousePointerOver.current = false;
          setShowWheelHelperText(false);
        }}
      />
      <div className={cx(styles.overlay, { [styles.active]: showWheelHelper })}>
        <div>
          Hold <kbd>{isMac() ? `command` : `ctrl`}</kbd> to enable zooming with your mousewheel.
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    position: `relative`,
  }),
  map: css({
    height: `400px`,
    width: `100%`,
  }),
  overlay: css({
    alignItems: `center`,
    backgroundColor: `rgba(0,0,0,0.5)`,
    display: `flex`,
    height: `100%`,
    justifyContent: `center`,
    left: 0,
    opacity: 0,
    padding: theme.spacing(3),
    pointerEvents: `none`,
    position: `absolute`,
    textAlign: `center`,
    top: 0,
    transition: `opacity 0.3s ease-in-out`,
    width: `100%`,
  }),
  active: css({
    opacity: 1,
  }),
});

function isMac() {
  try {
    // eslint-disable-next-line deprecation/deprecation -- doesn't seem to be a stable alternative yet
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  } catch (e) {
    return false;
  }
}

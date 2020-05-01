import React, { Component } from 'react';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
import { css } from 'emotion';

type State = {
  lat: number;
  lng: number;
  zoom: number;
};

export default class ProbesMap extends Component<{}, State> {
  state = {
    lat: 0,
    lng: 0,
    zoom: 2,
  };

  componentDidMount() {
    const addCss = document.createElement('link');
    addCss.setAttribute('rel', 'stylesheet');
    addCss.setAttribute('href', '//unpkg.com/leaflet@1.6.0/dist/leaflet.css');
    addCss.setAttribute(
      'integrity',
      'sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=='
    );
    addCss.setAttribute('crossorigin', '');
    document.body.appendChild(addCss);

    const addScript = document.createElement('script');
    addScript.setAttribute('src', '//unpkg.com/leaflet@1.6.0/dist/leaflet.js');
    addScript.setAttribute(
      'integrity',
      'sha512-gZwIG9x3wUXg2hdXF6+rVkLF/0Vi9U8D2Ntg4Ga5I5BZpVkVxlJWbSQtXPSiUTtC0TjtGOmxa1AJPuV0CPthew=='
    );
    addScript.setAttribute('crossorigin', '');
    document.body.appendChild(addScript);
  }

  render() {
    const position = [this.state.lat, this.state.lng];
    return (
      <div>
        <Map
          center={position}
          zoom={this.state.zoom}
          className={css`
             {
              height: 400px;
            }
          `}
        >
          <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />
          <Marker position={position}>
            <Popup>
              A pretty CSS3 popup. <br /> Easily customizable.
            </Popup>
          </Marker>
        </Map>
      </div>
    );
  }
}

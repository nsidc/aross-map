import React, { useState, useEffect } from 'react';

import GeoJSON from 'ol/format/GeoJSON'
import Feature from 'ol/Feature';

import {version} from '../package.json';
import './style/App.css';
import Map from './components/Map';
import BasemapSelector from './components/BasemapSelector';
import {Basemap} from './types/Map';

const LEO_NETWORK_URL: string = (
  'https://www.leonetwork.org/en/explore/posts?query='
  // Get posts, tweets, and articles:
  + '&type=TWEET&type=POST&type=ARTICLE'
  // In GeoJSON:
  + '&mode=geojson_compact'
  // With no spatial selection:
  + '&region=&polygon=&bbox=&minlat=&maxlat=&near=&radius='
  // With "Rain on Snow" or "ROS" in the category field:
  + '&categories=ROS%7cRain+on+Snow&categories_anyOrAll=ANY'
  // With no temporal selection:
  + '&fromdate=&todate='
);


const App: React.FC = () => {
  const [ selectedBasemap, setSelectedBasemap ] = useState<Basemap>('USGSTopo');
  const [ features, setFeatures ] = useState<Feature[]>([])

  // Fetch features from LEO on app initialization.
  useEffect(() => {
    void fetch(LEO_NETWORK_URL)
      .then(response => response.json())
      .then((fetchedFeatures) => {

        const wktOptions = {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        }
        const parsedFeatures = new GeoJSON().readFeatures(
            fetchedFeatures,
            wktOptions
        )

        setFeatures(parsedFeatures)
      })
  }, [])

  return (
    <div className="App">
      <div id="version">v{version}</div>

      <Map
        features={features}
        selectedBasemap={selectedBasemap} />

      <BasemapSelector
        selectedBasemap={selectedBasemap}
        onChange={setSelectedBasemap} />


    </div>
  );
}

export default App;

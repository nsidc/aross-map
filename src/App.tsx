import React, { useState, useEffect } from 'react';

import GeoJSON from 'ol/format/GeoJSON'
// import Feature from 'ol/Feature';

import './style/App.css';
import MapWrapper from './components/MapWrapper';
import Feature from 'ol/Feature';


const App: React.FC = () => {
  // set intial state
  const [ features, setFeatures ] = useState<Feature[]>([])

	// initialization - retrieve GeoJSON features from Mock JSON API get features
  // from mock GeoJson API (read from flat .json file in public directory)
  useEffect(() => {
    void fetch('/boulder_city_limits.geojson')
      .then(response => response.json())
      .then((fetchedFeatures) => {

        // parse fetched geojson into OpenLayers features
        //  use options to convert feature from EPSG:4326 to EPSG:3857
        const wktOptions = {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        }
        const parsedFeatures = new GeoJSON().readFeatures(
            fetchedFeatures,
            wktOptions
        )

        // set features into state (which will be passed into OpenLayers
        //  map component as props)
        setFeatures(parsedFeatures)

      })

  }, [])


  return (
    <div className="App">

      <MapWrapper features={features} />

    </div>
  );
}

export default App;

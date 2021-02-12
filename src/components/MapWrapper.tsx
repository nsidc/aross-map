// Inspired by a very helpful blog post:
//     https://taylor.callsen.me/using-openlayers-with-react-functional-components/

import React, { useState, useEffect, useRef } from 'react';

import Feature from 'ol/Feature';
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import {transform} from 'ol/proj'
import {toStringXY} from 'ol/coordinate';
import type {Layer} from 'ol/layer'
import type {Coordinate} from 'ol/coordinate';  
import type MapBrowserEvent from 'ol/MapBrowserEvent';


interface IMapWrapperProps {
  features: Array<Feature>;
}

const MapWrapper: React.FC<IMapWrapperProps> = (props) => {
  type TMap = Map | undefined;
  type TFeatureLayer = Layer | undefined;
  type TCoordinate = Coordinate | undefined;

  const [ map, setMap ] = useState<TMap>();
  const [ featuresLayer, setFeaturesLayer ] = useState<TFeatureLayer>();
  const [ selectedCoord , setSelectedCoord ] = useState<TCoordinate>();

  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  mapRef.current = map || null;

  // Initialize Map on first render 
  useEffect(() => {
    const initialFeaturesLayer = new VectorLayer({
      source: new VectorSource()
    })

    const initialMap = new Map({
      target: mapElement.current || undefined,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
          })
        }),
        initialFeaturesLayer
      ],
      view: new View({
        projection: 'EPSG:3857',
        center: [0, 0],
        zoom: 2
      }),
      controls: []
    })

    initialMap.on('click', handleMapClick)

    setMap(initialMap)
    setFeaturesLayer(initialFeaturesLayer)
  }, [])

  // Update on state change
  useEffect(() => {
    if (
      map === undefined
      || featuresLayer === undefined
      || props.features === undefined
      || props.features.length === 0
    ) {
      return;
    }

    featuresLayer.setSource(
      new VectorSource({
        features: props.features
      })
    )

    map.getView().fit(
      /* eslint-disable @typescript-eslint/no-unsafe-call */
      // @ts-ignore TS2339
      featuresLayer.getSource().getExtent(),
      /* eslint-enable @typescript-eslint/no-unsafe-call */
      {padding: [100, 100, 100, 100]}
    )

  }, [props.features, featuresLayer, map])

  const handleMapClick = (event: MapBrowserEvent) => {

    if ( !mapRef || !mapRef.current ) {
      return;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const clickedCoord = mapRef.current.getCoordinateFromPixel(event.pixel);
    const transormedCoord = transform(clickedCoord, 'EPSG:3857', 'EPSG:4326')

    setSelectedCoord( transormedCoord )
  }

  // TODO: Give names to hooks and call them

  return (      
    <div>
      <div ref={mapElement} className="map-container"></div>
      
      <div className="clicked-coord-label">
        <p>{ (selectedCoord) ? toStringXY(selectedCoord, 5) : '' }</p>
      </div>
    </div>
  ) 
}

export default MapWrapper
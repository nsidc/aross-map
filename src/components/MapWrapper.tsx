// Inspired by a very helpful blog post:
//     https://taylor.callsen.me/using-openlayers-with-react-functional-components/

import { useState, useEffect, useRef } from 'react';

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


interface IMapWrapperProps {
  features: Array<any>;
}

function MapWrapper(props: IMapWrapperProps) {
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
      map == undefined
      || featuresLayer == undefined
      || props.features == undefined
      || props.features.length == 0
    ) {
      return;
    }

    featuresLayer.setSource(
      new VectorSource({
        features: props.features
      })
    )

    map.getView().fit(
      // @ts-ignore TS2339 -- are the typedefs wrong?
      featuresLayer.getSource().getExtent(),
      {padding: [100, 100, 100, 100]}
    )

  }, [props.features, featuresLayer, map])

  // TODO: Better type for "event"
  const handleMapClick = (event: any) => {

    if ( !mapRef || !mapRef.current ) {
      return;
    }
    
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

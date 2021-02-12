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


const BASEMAP_CHOICES = [
  'USGSTopo',
  'USGSImageryTopo',
  'USGSImageryOnly',
  'USGSShadedReliefOnly',
  'USGSHydroCached',
] as const;

interface IMapWrapperProps {
  features: Array<Feature>;
}
type TMap = Map | undefined;
type TLayer = Layer | undefined
type TCoordinate = Coordinate | undefined;
type TBasemap = typeof BASEMAP_CHOICES[number];

const getBasemapUrl = (basemap: TBasemap): string => {
  const basemap_url = (
    'https://basemap.nationalmap.gov/arcgis/rest/services'
    + `/${basemap}/MapServer/tile/{z}/{y}/{x}`
  );
  return basemap_url;
}


const MapWrapper: React.FC<IMapWrapperProps> = (props) => {

  const [ map, setMap ] = useState<TMap>();
  const [ featuresLayer, setFeaturesLayer ] = useState<TLayer>();
  const [ basemapLayer, setBasemapLayer ] = useState<TLayer>();
  const [ selectedCoord, setSelectedCoord ] = useState<TCoordinate>();
  const [ selectedBasemap, setSelectedBasemap ] = useState<TBasemap>('USGSImageryTopo');

  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  mapRef.current = map || null;

  // Initialize Map on first render 
  useEffect(() => {
    const initialFeaturesLayer = new VectorLayer({
      // @ts-ignore: TS2304
      id: 'features',
      source: new VectorSource()
    })
    const initialBasemapLayer = new TileLayer({
      // @ts-ignore: TS2304
      id: 'basemap',
      source: new XYZ({
        url: getBasemapUrl(selectedBasemap),
      })
    })

    const initialMap = new Map({
      target: mapElement.current || undefined,
      layers: [
        initialBasemapLayer,
        initialFeaturesLayer,
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
    setBasemapLayer(initialBasemapLayer)
  }, [])

  // Update on basemap change
  useEffect(() => {
    if (
      map === undefined
      || basemapLayer === undefined
    ) {
      return;
    }
    
    console.log(selectedBasemap);
    basemapLayer.setSource(new XYZ({url: getBasemapUrl(selectedBasemap)}))
   
    debugger;
  }, [selectedBasemap, basemapLayer]);

  // Update on feature/map change
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
      
      <div className="select-map">
        <select
          value={selectedBasemap}
          onChange={e => setSelectedBasemap(
            e.currentTarget.value as TBasemap
          )}
        >
          {BASEMAP_CHOICES.map(basemap => (
            <option key={basemap}>{basemap}</option>
          ))}
        </select>
      </div>

      <div className="clicked-coord-label">
        <p>{ (selectedCoord) ? toStringXY(selectedCoord, 5) : '' }</p>
      </div>
    </div>
  ) 
}

export default MapWrapper

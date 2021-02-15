// Inspired by a very helpful blog post:
//     https://taylor.callsen.me/using-openlayers-with-react-functional-components/

import React, { useState, useEffect, useRef } from 'react';
import type {RefObject} from 'react';

import Feature from 'ol/Feature';
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import {transform} from 'ol/proj'
import {toStringXY} from 'ol/coordinate';
import type MapBrowserEvent from 'ol/MapBrowserEvent';

import {
  BASEMAP_CHOICES,
  Basemap,
  OptionalMap,
  OptionalLayer, 
  OptionalCoordinate,
} from '../types/Map';
import { StateSetter } from '../types/misc';


interface IMapWrapperProps {
  features: Array<Feature>;
}

const getBasemapUrl = (basemap: Basemap): string => {
  const basemap_url = (
    'https://basemap.nationalmap.gov/arcgis/rest/services'
    + `/${basemap}/MapServer/tile/{z}/{y}/{x}`
  );
  return basemap_url;
}

const useMapInit = (
  selectedBasemap: Basemap,
  mapElement: RefObject<HTMLDivElement>,
  clickHandler: (event: MapBrowserEvent) => void,
  setFeaturesLayer: StateSetter<OptionalLayer>,
  setBasemapLayer: StateSetter<OptionalLayer>,
): Map | undefined => {
  // TODO: We use the state outside of this function, but tnot the setter, so
  // we return the state. Should we be instead declaring the state and setter
  // from outside and passing in the setter?
  const [ map, setMap ] = useState<OptionalMap>();

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

    initialMap.on('click', clickHandler)

    setMap(initialMap)
    setFeaturesLayer(initialFeaturesLayer)
    setBasemapLayer(initialBasemapLayer)
  }, [])

  return map;
};

const useSelectedBasemap = (
  selectedBasemap: Basemap,
  map: OptionalMap,
  basemapLayer: OptionalLayer,
): void => {
  useEffect(() => {
    if (
      map === undefined
      || basemapLayer === undefined
    ) {
      return;
    }
    
    basemapLayer.setSource(new XYZ({url: getBasemapUrl(selectedBasemap)}))
  }, [selectedBasemap, basemapLayer]);
}

const useFeatures = (
  features: Array<Feature>,
  featuresLayer: OptionalLayer,
  map: OptionalMap,
): void => {
  useEffect(() => {
    if (
      map === undefined
      || featuresLayer === undefined
      || features === undefined
      || features.length === 0
    ) {
      return;
    }

    featuresLayer.setSource(
      new VectorSource({features})
    )

    map.getView().fit(
      /* eslint-disable @typescript-eslint/no-unsafe-call */
      // @ts-ignore TS2340
      featuresLayer.getSource().getExtent(),
      /* eslint-enable @typescript-eslint/no-unsafe-call */
      {padding: [100, 100, 100, 100]}
    )

  }, [features, featuresLayer, map])

}

const MapWrapper: React.FC<IMapWrapperProps> = (props) => {

  const [ featuresLayer, setFeaturesLayer ] = useState<OptionalLayer>();
  const [ basemapLayer, setBasemapLayer ] = useState<OptionalLayer>();
  const [ selectedCoord, setSelectedCoord ] = useState<OptionalCoordinate>();
  const [ selectedBasemap, setSelectedBasemap ] = useState<Basemap>('USGSImageryTopo');

  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const handleMapClick = (event: MapBrowserEvent) => {

    if ( !mapRef || !mapRef.current ) {
      return;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const clickedCoord = mapRef.current.getCoordinateFromPixel(event.pixel);
    const transormedCoord = transform(clickedCoord, 'EPSG:3857', 'EPSG:4326')

    setSelectedCoord( transormedCoord )
  }

  // Register behaviors
  const map = useMapInit(
    selectedBasemap,
    mapElement,
    handleMapClick,
    setFeaturesLayer,
    setBasemapLayer,
  );
  useSelectedBasemap(
    selectedBasemap,
    map,
    basemapLayer,
  );
  useFeatures(
    props.features,
    featuresLayer,
    map,
  );


  mapRef.current = map || null;

  return (      
    <div>
      <div ref={mapElement} className="map-container"></div>
      
      <div className="select-map">
        <select
          value={selectedBasemap}
          onChange={e => setSelectedBasemap(
            e.currentTarget.value as Basemap
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

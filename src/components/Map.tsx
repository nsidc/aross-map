// Inspired by a very helpful blog post:
//     https://taylor.callsen.me/using-openlayers-with-react-functional-components/

import React, { useState, useEffect, useRef } from 'react';
import type {RefObject} from 'react';

import 'ol/ol.css';
import Feature from 'ol/Feature';
import Map from 'ol/Map'
import Overlay from 'ol/Overlay';
import View from 'ol/View'
import Select, {SelectEvent} from 'ol/interaction/Select';
import * as style from 'ol/style';
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import {click} from 'ol/events/condition';
import {transform} from 'ol/proj'
import {toStringXY} from 'ol/coordinate';
import type MapBrowserEvent from 'ol/MapBrowserEvent';

import '../style/Map.css';
import MapTip from './MapTip';
import {
  Basemap,
  OptionalCoordinate,
  OptionalLayer,
  OptionalMap,
  OptionalOverlay,
} from '../types/Map';
import { StateSetter } from '../types/misc';


interface IMapProps {
  features: Array<Feature>;
  selectedBasemap: Basemap;
}

const getBasemapUrl = (basemap: Basemap): string => {
  const basemap_url = (
    'https://basemap.nationalmap.gov/arcgis/rest/services'
    + `/${basemap}/MapServer/tile/{z}/{y}/{x}`
  );
  return basemap_url;
}

// When this component is first loaded, populate the map and other initial
// state.
const useMapInit = (
  selectedBasemap: Basemap,
  mapElement: RefObject<HTMLDivElement>,
  overlayElement: RefObject<HTMLDivElement>,
  clickHandler: (event: MapBrowserEvent) => void,
  selectHandler: (event: SelectEvent) => void,
  setMap: StateSetter<OptionalMap>,
  setFeaturesLayer: StateSetter<OptionalLayer>,
  setBasemapLayer: StateSetter<OptionalLayer>,
  setFeatureInfoOverlay: StateSetter<OptionalOverlay>,
): void => {
  useEffect(() => {
    const initialFeatureInfoOverlay = new Overlay({
      element: overlayElement.current!,
    });

    const initialFeaturesLayer = new VectorLayer({
      // @ts-ignore: TS2304
      id: 'features',
      source: new VectorSource(),
      opacity: 1,
      style: new style.Style({
        image: new style.Circle({
          radius: 4,
          stroke: new style.Stroke({
            color: '#D04721',
            width: 3,
          }),
          fill: new style.Fill({
            color: '#FAECE8',
          }),
        }),
      }),
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
        zoom: 2,
        maxZoom: 8,
      }),
      overlays: [
        initialFeatureInfoOverlay,
      ],
    })

    initialMap.on('click', clickHandler);

    // We have to add the interaction after instantiating `initialMap` because
    // we want to take advantage of the default interactions (click-and-drag to
    // pan, etc.)
    const selectInteraction = new Select({
      condition: click,
      style: new style.Style({
        image: new style.Circle({
          radius: 8,
          stroke: new style.Stroke({
            color: '#D04721',
            width: 3,
          }),
          fill: new style.Fill({
            color: '#E37557',
          }),
        }),
      }),
    });
    selectInteraction.on('select', selectHandler);
    initialMap.addInteraction(selectInteraction);

    // Populate states that depend on map initialization
    setMap(initialMap);
    setFeaturesLayer(initialFeaturesLayer);
    setBasemapLayer(initialBasemapLayer);
    setFeatureInfoOverlay(initialFeatureInfoOverlay);

  /* eslint-disable react-hooks/exhaustive-deps */
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */
};

// When the selected basemap is updated, update the basemap layer.
const useSelectedBasemap = (
  selectedBasemap: Basemap,
  basemapLayer: OptionalLayer,
  map: OptionalMap,
): void => {
  useEffect(() => {
    if (
      map === undefined
      || basemapLayer === undefined
    ) {
      return;
    }

    basemapLayer.setSource(new XYZ({url: getBasemapUrl(selectedBasemap)}))
  }, [selectedBasemap, basemapLayer, map]);
}

// When features are updated, place them on the map and update the map view.
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
      new VectorSource({
        features,
        wrapX: false,
      }),
    )

    map.getView().fit(
      /* eslint-disable @typescript-eslint/no-unsafe-call */
      // @ts-ignore TS2340
      featuresLayer.getSource().getExtent(),
      /* eslint-enable @typescript-eslint/no-unsafe-call */
      {padding: [100, 100, 100, 100]}
    )

  }, [features, featuresLayer, map])
};

// When a feature is selected, position the overlay appropriately.
const useSelectedFeature = (
  featureInfoOverlay: OptionalOverlay,
  selectedFeatures: Array<Feature>,
): void => {
  if (
    featureInfoOverlay === undefined
    || selectedFeatures.length === 0
  ) {
    return;
  }

  // @ts-ignore TS2339
  // flatCoordinates is not documented, but is present on the object. Why? Is
  // this dangerous?
  const pos = selectedFeatures[0].getGeometry()!.flatCoordinates as Array<float>;
  featureInfoOverlay.setPosition(pos);
}

const MapComponent: React.FC<IMapProps> = (props) => {

  const [ map, setMap ] = useState<OptionalMap>();
  const [ featuresLayer, setFeaturesLayer ] = useState<OptionalLayer>();
  const [ basemapLayer, setBasemapLayer ] = useState<OptionalLayer>();
  const [ selectedCoord, setSelectedCoord ] = useState<OptionalCoordinate>();
  const [ selectedFeatures, setSelectedFeatures ] =
    useState<Array<Feature>>([]);
  const [ featureInfoOverlay, setFeatureInfoOverlay ] =
    useState<OptionalOverlay>();

  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const overlayElement = useRef<HTMLDivElement | null>(null);

  const handleFeatureSelect = (event: SelectEvent) => {
    setSelectedFeatures(event.selected);
  }

  const handleMapClick = (event: MapBrowserEvent) => {

    if ( !mapRef || !mapRef.current ) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const clickedCoord = mapRef.current.getCoordinateFromPixel(event.pixel);
    const transormedCoord = transform(clickedCoord, 'EPSG:3857', 'EPSG:4326')

    setSelectedCoord(transormedCoord);
  }

  // Register behaviors
  useMapInit(
    props.selectedBasemap,
    mapElement,
    overlayElement,
    handleMapClick,
    handleFeatureSelect,
    setMap,
    setFeaturesLayer,
    setBasemapLayer,
    setFeatureInfoOverlay,
  );
  useSelectedBasemap(
    props.selectedBasemap,
    basemapLayer,
    map,
  );
  useFeatures(
    props.features,
    featuresLayer,
    map,
  );
  useSelectedFeature(
    featureInfoOverlay,
    selectedFeatures,
  );

  mapRef.current = map || null;


  return (
    <div className="Map">

      <div ref={mapElement} className="map-container"></div>

      <div ref={overlayElement}>
        <MapTip features={selectedFeatures} />
      </div>

      <div className="clicked-coord-label">
        <p>{ (selectedCoord) ? toStringXY(selectedCoord, 5) : '' }</p>
      </div>

    </div>
  )
}

export default MapComponent

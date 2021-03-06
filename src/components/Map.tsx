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
import {
  FullScreen,
  ScaleLine,
  defaults as defaultControls
} from 'ol/control';
import {transform} from 'ol/proj'
import {toStringXY} from 'ol/coordinate';
import type MapBrowserEvent from 'ol/MapBrowserEvent';

import '../style/Map.css';
import MapTip from './MapTip';
import {
  Basemap,
  OptionalCoordinate,
  OptionalMap,
  OptionalOverlay,
  OptionalSelect,
  OptionalTileLayer,
  OptionalVectorLayer,
} from '../types/Map';
import { StateSetter } from '../types/misc';
import {
  featureSeek,
  getLatestFeatureFromLayer,
  selectFeature,
} from '../util/features';


const basemapSourceDefaults = {
  maxZoom: 8,
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
  setFeaturesLayer: StateSetter<OptionalVectorLayer>,
  setBasemapLayer: StateSetter<OptionalTileLayer>,
  setFeatureInfoOverlay: StateSetter<OptionalOverlay>,
  setSelectInteraction: StateSetter<OptionalSelect>,
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
          radius: 8,
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
        ...basemapSourceDefaults,
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
        maxZoom: 16,
      }),
      overlays: [
        initialFeatureInfoOverlay,
      ],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      controls: defaultControls().extend([
        new FullScreen(),
        new ScaleLine(),
      ]),
    })

    initialMap.on('click', clickHandler);

    // We have to add the interaction after instantiating `initialMap` because
    // we want to take advantage of the default interactions (click-and-drag to
    // pan, etc.)
    const initialSelectInteraction = new Select({
      condition: click,
      style: new style.Style({
        image: new style.Circle({
          radius: 16,
          stroke: new style.Stroke({
            color: '#D04721',
            width: 8,
          }),
          fill: new style.Fill({
            color: '#E37557',
          }),
        }),
      }),
    });

    // TODO: Is this the right thing to do? Here, usual control flow is
    // inverted, where instead of updating the map in response to a React state
    // change (an Effect), we're updating React state in response to a map
    // change. I think this is needed because we have to respond to user clicks
    // on map objects. However, there are cases where we select things
    // programmatically, and for that it would make more sense to update the
    // React state and having the map respond in an Effect. But how would we
    // tell the difference in _how_ the state was changed?
    initialSelectInteraction.on('select', selectHandler);
    initialMap.addInteraction(initialSelectInteraction);

    // Populate states that depend on map initialization
    setMap(initialMap);
    setFeaturesLayer(initialFeaturesLayer);
    setBasemapLayer(initialBasemapLayer);
    setFeatureInfoOverlay(initialFeatureInfoOverlay);
    setSelectInteraction(initialSelectInteraction);

  /* eslint-disable react-hooks/exhaustive-deps */
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */
};

// When the selected basemap is updated, update the basemap layer.
const useSelectedBasemap = (
  selectedBasemap: Basemap,
  basemapLayer: OptionalTileLayer,
  map: OptionalMap,
): void => {
  useEffect(() => {
    if (
      map === undefined
      || basemapLayer === undefined
    ) {
      return;
    }

    basemapLayer.setSource(new XYZ({
      ...basemapSourceDefaults,
      url: getBasemapUrl(selectedBasemap),
    }));
  }, [selectedBasemap, basemapLayer, map]);
}

// When features are updated, place them on the map and update the map view.
const useFeatures = (
  features: Array<Feature>,
  featuresLayer: OptionalVectorLayer,
  selectInteraction: OptionalSelect,
  map: OptionalMap,
): void => {
  useEffect(() => {
    if (
      map === undefined
      || selectInteraction === undefined
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

    // Select the latest feature and zoom to it.
    const latestFeature: Feature = getLatestFeatureFromLayer(featuresLayer);

    selectFeature(selectInteraction, latestFeature);

    map.getView().fit(
      featuresLayer.getSource().getExtent(),
      {padding: [100, 100, 100, 100]},
    );

  }, [features, featuresLayer, selectInteraction, map]);
};

// When a feature is selected, position the overlay appropriately.
const useSelectedFeature = (
  featureInfoOverlay: OptionalOverlay,
  selectedFeatures: Array<Feature>,
  selectInteraction: OptionalSelect,
  map: OptionalMap,
): void => {
  useEffect(() => {
    if (
      map === undefined
      || featureInfoOverlay === undefined
      || selectInteraction === undefined
    ) {
      return;
    }
    if (selectedFeatures.length === 0) {
      // @ts-ignore: TS2339
      // .clear is not documented, but is present on the Collection object.
      // Danger?
      selectInteraction.getFeatures().clear();
      return;
    }

    // @ts-ignore TS2339
    // .flatCoordinates is not documented, but is present on the object.
    // Danger?
    const pos = selectedFeatures[0].getGeometry()!.flatCoordinates as Array<float>;
    featureInfoOverlay.setPosition(pos);

    map.getView().animate({
      center: pos,
      duration: 1000,
    });
  }, [selectedFeatures, selectInteraction, map]);
}

interface IMapProps {
  features: Array<Feature>;
  selectedBasemap: Basemap;
}

const MapComponent: React.FC<IMapProps> = (props) => {

  // TODO: More specific types; maybe some way to succinctly make optional?
  const [ map, setMap ] = useState<OptionalMap>();
  const [ featuresLayer, setFeaturesLayer ] =
    useState<OptionalVectorLayer>();
  const [ basemapLayer, setBasemapLayer ] =
    useState<OptionalTileLayer>();
  const [ selectedCoord, setSelectedCoord ] =
    useState<OptionalCoordinate>();
  const [ selectedFeatures, setSelectedFeatures ] =
    useState<Array<Feature>>([]);
  const [ featureInfoOverlay, setFeatureInfoOverlay ] =
    useState<OptionalOverlay>();
  const [ selectInteraction, setSelectInteraction ] =
    useState<OptionalSelect>();

  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const overlayElement = useRef<HTMLDivElement | null>(null);

  const handleFeatureSelect = (event: SelectEvent) => {
    setSelectedFeatures(event.selected);
  }

  const handleMapTipClose = () => {
    if (selectInteraction === undefined) {
      return;
    }
    // TODO: use selectInteraction to clear the features?
    selectFeature(selectInteraction, null);
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

  // TODO: Reconsider if this is readable
  const handleFeatureSeekFactory = (increment: number) => {
    return () => {
      if (
        featuresLayer === undefined
        || selectInteraction === undefined
        || selectedFeatures.length === 0
      ) {
        return;
      }
      const feat = featureSeek(
        featuresLayer,
        selectedFeatures,
        increment,
      );
      selectFeature(selectInteraction, feat);
    }
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
    setSelectInteraction,
  );
  useSelectedBasemap(
    props.selectedBasemap,
    basemapLayer,
    map,
  );
  useFeatures(
    props.features,
    featuresLayer,
    selectInteraction,
    map,
  );
  useSelectedFeature(
    featureInfoOverlay,
    selectedFeatures,
    selectInteraction,
    map,
  );

  mapRef.current = map || null;


  return (
    <div className="Map">

      <div ref={mapElement} className="map-container"></div>

      <div ref={overlayElement}>
        <MapTip
          features={selectedFeatures}
          featureSeekCallbackFactory={handleFeatureSeekFactory}
          onClose={handleMapTipClose} />
      </div>

      <div className="clicked-coord-label">
        <p>{ (selectedCoord) ? toStringXY(selectedCoord, 5) : '' }</p>
      </div>

    </div>
  )
}

export default MapComponent

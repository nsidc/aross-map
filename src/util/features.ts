import Feature from 'ol/Feature';
import Select from 'ol/interaction/Select';
import VectorLayer from 'ol/layer/Vector'

export const getLatestFeatureFromLayer = (
  layer: VectorLayer,
): Feature => {
  const source = layer.getSource();

  // TODO: Should we store features in date-sorted order so we can grab
  // the last element?
  return source.getFeatures().reduce((prev, current) => {
    const prevDate = new Date(prev.getProperties()['date']);
    const currDate = new Date(current.getProperties()['date']);

    return prevDate > currDate ? prev : current;
  });
}

// TODO: Avoid sorting every time we seek through features. Will become a
// problem with increased number of features.
export const featureSeek = (
  featuresLayer: VectorLayer,
  selectedFeatures: Array<Feature>,
  increment: number,
): Feature => {
  const source = featuresLayer.getSource();
  // TODO: If the features were already in date-sorted order, we wouldn't have
  // to do this step.
  // Sort from oldest to newest:
  const features = source.getFeatures().sort((a, b) => {
    const aDate = new Date(a.getProperties()['date']);
    const bDate = new Date(b.getProperties()['date']);

    if (aDate < bDate) {
      return -1;
    }
    if (aDate > bDate) {
      return 1;
    }
    return 0;

  });

  const selectedIndex = features.indexOf(selectedFeatures[0]);

  const newIndex = (selectedIndex + increment) % features.length;

  // Javascript doesn't let us access from the end of the array using negative
  // indexes like cool languages do, so we have to handle that special case.
  const jsIndex = newIndex < 0 ? features.length + newIndex : newIndex;
  return features[jsIndex];
}

export const selectFeature = (
  selectInteraction: Select,
  feature: Feature | null,
) => {
  const selected = selectInteraction.getFeatures();
  const oldSelected: Array<Feature> =  // Clone
    [...selected.getArray()];

  selected.clear();
  if (feature) {
    // Adds the selected feature to the collection. This is really the
    // prescribed way:
    //   https://openlayers.org/en/latest/examples/box-selection.html
    selected.push(feature);
  }

  // Manually dispatch an event. It's not clear why this didn't fire on push or
  // clear.
  selectInteraction.dispatchEvent({
    type: 'select',
    // @ts-ignore TS2345
    // Typescript expects a BaseEvent. This isn't 100% match for a BaseEvent
    // or SelectEvent... How do?
    selected: feature ? [feature] : [],
    deselected: oldSelected,
  });
}

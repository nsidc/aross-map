import Feature from 'ol/Feature';
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

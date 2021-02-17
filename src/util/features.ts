import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector'

export const getLatestFeatureFromLayer = (
  layer: VectorLayer,
): Feature => {
  const source = layer.getSource();

  return source.getFeatures().reduce((prev, current) => {
    const prevDate = new Date(prev.getProperties()['date']);
    const currDate = new Date(current.getProperties()['date']);

    return prevDate > currDate ? prev : current;
  });
}

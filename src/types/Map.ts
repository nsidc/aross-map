import Map from 'ol/Map'
import type {Coordinate} from 'ol/coordinate';  
import type {Layer} from 'ol/layer'


export const BASEMAP_CHOICES = [
  'USGSTopo',
  'USGSImageryTopo',
  'USGSImageryOnly',
  'USGSShadedReliefOnly',
  'USGSHydroCached',
] as const;

export type OptionalMap = Map | undefined;
export type OptionalLayer = Layer | undefined
export type OptionalCoordinate = Coordinate | undefined;
export type Basemap = typeof BASEMAP_CHOICES[number];

import React from 'react';

import Feature from 'ol/Feature';
import {
  MdClose,
  MdLaunch,
} from 'react-icons/md';

import '../style/MapTip.css';
import FeatureNavigation from './FeatureNavigation';

interface IFeatureProperties {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  location: string;
  source: string;
  url: string;
  // Support "geometry" and keys added in the future
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface IMapTipProps {
  features: Array<Feature>;
  featureSeekCallbackFactory: (increment: number) => (() => void);
  onClose: () => void;
}


const MapTip: React.FC<IMapTipProps> = (props) => {

  const featuresHTML = (features: Array<Feature>): JSX.Element | null => {
    const f = features[0]
    if (f === undefined) {
      return null;
    }

    // The real return type of .getProperties() is `{ [key: string]: any; }`
    const featureProperties = f.getProperties() as IFeatureProperties;
    delete featureProperties.geometry;

    const date = new Date(featureProperties['date']);
    const dateStr = date.toDateString();

    // NOTE: The key on the `img` tag prevents the browser from re-using the
    // last image while waiting for the next image to load. There must be a
    // better way.
    return (
      <div className="MapTip">
        <div className="content">

          <div className="close-button"  onClick={props.onClose}>
            <MdClose />
          </div>
          <div className="feature-title">
            <div className='feature-thumbnail'>
              <img
                alt={'thumbnail'}
                key={Date.now()}
                src={featureProperties['thumbnail']} />
            </div>

            <div className="feature-date">
              {dateStr}
            </div>

            <h3>{featureProperties['title']}</h3>
          </div>

          <div className="feature-location">
            {featureProperties['location']}
          </div>

          <div className="feature-description">
            <p>{featureProperties['description']}</p>
          </div>

          <div className="feature-source">
            Source: {featureProperties['source']}
          </div>

          <a href={featureProperties['url']}
             target={'_blank'} rel={'noreferrer'}>
            {'Read more at LEO Network'}<MdLaunch />
          </a>

          <FeatureNavigation
            onPrevious={props.featureSeekCallbackFactory(-1)}
            onNext={props.featureSeekCallbackFactory(1)} />

        </div>
      </div>
    );
  };

  return featuresHTML(props.features);
}

export default MapTip;

import React from 'react';

import Feature from 'ol/Feature';

import '../style/MapTip.css';

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

        <div onClick={props.onClose}>Close</div>
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

          <h3>
            <a
              href={featureProperties['url']}
              target={'_blank'} rel={'noreferrer'}>
              {featureProperties['title']}
            </a>
          </h3>
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
          {'Read more...'}
        </a>

      </div>
    );
  };

  return featuresHTML(props.features);
}

export default MapTip;

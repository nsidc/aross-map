import React from 'react';

import Feature from 'ol/Feature';

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

    return (
      <div className="selected-features">
        <div className="feature-title">
          <h3>
            <a
              href={featureProperties['url']}
              target={'_blank'} rel={'noreferrer'}>
              {featureProperties['title']}
            </a>
          </h3>
        </div>
        <div className="feature-date">
          {dateStr}
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

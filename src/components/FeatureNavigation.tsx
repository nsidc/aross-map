import React from 'react';

import {
  MdArrowBack as PreviousIcon,
  MdArrowForward as NextIcon,
} from 'react-icons/md';

import '../style/FeatureNavigation.css';


interface IFeatureNavProps {
  onPrevious: () => void;
  onNext: () => void;
}

const FeatureNavigation: React.FC<IFeatureNavProps> = (props): JSX.Element => {
  return (
    <div className='FeatureNavigation'>
      <span
        className={'nav-button'}
        onClick={props.onPrevious}>
        <PreviousIcon />{' Previous'}
      </span>
      <span
        className={'nav-button'}
        onClick={props.onNext}>
        {'Next '}<NextIcon />
      </span>
    </div>
  );
}

export default FeatureNavigation;

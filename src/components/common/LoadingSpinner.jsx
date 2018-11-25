import React from 'react'
import classNames from 'classnames';

const LoadingTypes = {
  ROTATING_PLANE: 'rotating-plane',
  DOUBLE_BOUNCE: 'double-bounce',
  THREE_BOUNCE: 'three-bounce',
  FADING_CIRCLE: 'fading-circle',
}

const LoadingSpinner = props => {
  var spinnerRender
  const { type, className, iconWidth, iconHeight, isLoading, pastDelay, timedOut, ...elementProps } = props
  switch (type) {
    case LoadingTypes.ROTATING_PLANE:
      spinnerRender = (
        <div className="sk-spinner sk-spinner-rotating-plane" style={{ width: iconWidth, height: iconHeight }}></div>
      )
      break;
    case LoadingTypes.DOUBLE_BOUNCE:
      spinnerRender = (
        <div className="sk-spinner sk-spinner-double-bounce" style={{ width: iconWidth, height: iconHeight }}>
          <div className="sk-double-bounce1"></div>
          <div className="sk-double-bounce2"></div>
        </div>
      )
      break;
    case LoadingTypes.THREE_BOUNCE:
      spinnerRender = (
        <div className="sk-spinner sk-spinner-three-bounce" style={{ width: iconWidth, height: iconHeight }}>
          <div className="sk-bounce1"></div>
          <div className="sk-bounce2"></div>
          <div className="sk-bounce3"></div>
        </div>
      )
      break;
    case LoadingTypes.FADING_CIRCLE:
      spinnerRender = (
        <div className="sk-spinner sk-spinner-fading-circle" style={{ width: iconWidth, height: iconHeight }}>
          <div className="sk-circle1 sk-circle"></div>
          <div className="sk-circle2 sk-circle"></div>
          <div className="sk-circle3 sk-circle"></div>
          <div className="sk-circle4 sk-circle"></div>
          <div className="sk-circle5 sk-circle"></div>
          <div className="sk-circle6 sk-circle"></div>
          <div className="sk-circle7 sk-circle"></div>
          <div className="sk-circle8 sk-circle"></div>
          <div className="sk-circle9 sk-circle"></div>
          <div className="sk-circle10 sk-circle"></div>
          <div className="sk-circle11 sk-circle"></div>
          <div className="sk-circle12 sk-circle"></div>
        </div>
      )
      break;
    default:
      spinnerRender = (
        <div className="sk-spinner sk-spinner-three-bounce" style={{ width: iconWidth, height: iconHeight }}>
          <div className="sk-bounce1"></div>
          <div className="sk-bounce2"></div>
          <div className="sk-bounce3"></div>
        </div>
      )
      break;
  }
  return (
    <div className={classNames('loading-spinner', className)} {...elementProps}>
      {spinnerRender}
    </div >
  )
}

LoadingSpinner.LoadingTypes = LoadingTypes

export default LoadingSpinner;
export { LoadingTypes };

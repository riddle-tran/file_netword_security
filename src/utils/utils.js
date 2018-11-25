Math.clamp = function (value, min, max) {
  return Math.min(Math.max(value, min), max);
};

// http://gizma.com/easing/#quad3
Math.easeInOutQuad = function (t, b, c, d) {
  t /= d / 2;
  if (t < 1) return c / 2 * t * t + b;
  t--;
  return -c / 2 * (t * (t - 2) - 1) + b;
};

Object.assignDeep = function (target = {}, ...sources) {
  for (let i = 0; i < sources.length; i++) {
    const obj = sources[i]
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (obj[key] && typeof obj[key] === 'object') {
          Object.assignDeep(target[key], obj[key])
        } else if (typeof obj[key] !== "undefined") {
          target[key] = obj[key]
        }
      }
    }
  }
};

Object.cloneDeep = function (val) {
  return typeof val === 'object' ? JSON.parse(JSON.stringify(val)) : val
}

Math.linearTween = function (t, b, c, d) {
  return c * t / d + b;
};

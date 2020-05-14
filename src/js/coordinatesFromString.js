class CoordinatesFromStrError extends Error {
  constructor(code = CoordinatesFromStrError.WRONG_FORMAT, message = 'Wrong string') {
    super(message);
    this.code = code;
  }
}

CoordinatesFromStrError.WRONG_FORMAT = 1;
CoordinatesFromStrError.WRONG_LATITUDE = 2;
CoordinatesFromStrError.WRONG_LONGITUDE = 3;

function coordinatesFromStr(str) {
  const coords = str.replace(/\s|\]|\[/g, '').split(',');
  const lat = Number(coords[0]);
  const lon = Number(coords[1]);
  if (!lat || !lon || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new CoordinatesFromStrError(CoordinatesFromStrError.WRONG_FORMAT);
  }
  if (lat > 90 || lat < -90) {
    throw new CoordinatesFromStrError(CoordinatesFromStrError.WRONG_LATITUDE);
  }
  if (lon > 180 || lon < -180) {
    throw new CoordinatesFromStrError(CoordinatesFromStrError.WRONG_LONGITUDE);
  }
  return { lat, lon };
}

export { coordinatesFromStr, CoordinatesFromStrError };

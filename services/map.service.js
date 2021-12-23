var NodeGeocoder = require("node-geocoder");

var options = {
  provider: "google",
  // Optionnal depending of the providers
  httpAdapter: "https", // Default
  apiKey: "AIzaSyDQiv46FsaIrqpxs4PjEpQYTEncAUZFYlU", // for Mapquest, OpenCage, Google Premier
  formatter: null, // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);

const reverseGeocoding = async (Latlng) => {
  try {
    const response = await geocoder.reverse({ lat: Latlng.lat, lon: Latlng.lng });
    return response[0];
  } catch (error) {
    return error;
  }
};

module.exports = { reverseGeocoding };

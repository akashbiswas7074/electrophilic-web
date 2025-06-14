// Empty module to replace MongoDB client-side encryption in browser environments
module.exports = {
  MongoCryptError: class MongoCryptError extends Error {
    constructor(message) {
      super(message);
      this.name = 'MongoCryptError';
    }
  },
  MongocryptdManager: class MongocryptdManager {
    constructor() {}
    start() { return Promise.resolve(); }
    stop() { return Promise.resolve(); }
    withSpawnOptions() { return this; }
  }
};
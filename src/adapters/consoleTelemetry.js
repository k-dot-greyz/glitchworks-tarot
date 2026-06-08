export function createConsoleTelemetry() {
  return {
    log: (level, event, meta = {}) => {
      const message = `[AETHER_TELEMETRY] [${level.toUpperCase()}] ${event}`;
      if (level === 'error') {
        console.error(message, meta);
      } else if (level === 'warn') {
        console.warn(message, meta);
      } else {
        console.log(message, meta);
      }
    }
  };
}

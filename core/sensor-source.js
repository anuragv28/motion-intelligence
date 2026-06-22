/**
 * MotionCore — Sensor Wrapper
 * ----------------------------
 * Isolates the browser DeviceMotionEvent API (and its iOS permission quirks)
 * from the rest of the app. If you later port to native, only this file
 * needs to be replaced.
 */

export class SensorSource {
  constructor() {
    this.listeners = [];
    this._handleMotion = this._handleMotion.bind(this);
  }

  /**
   * iOS 13+ requires an explicit user-gesture-triggered permission request.
   * Android/desktop browsers generally don't, so we handle both.
   */
  async requestPermission() {
    const DME = window.DeviceMotionEvent;
    if (!DME) {
      throw new Error('DeviceMotionEvent is not supported on this device/browser.');
    }
    if (typeof DME.requestPermission === 'function') {
      const result = await DME.requestPermission();
      if (result !== 'granted') {
        throw new Error('Motion sensor permission was denied.');
      }
    }
    // Non-iOS: no explicit permission step exists; access is implicit.
    return true;
  }

  start() {
    window.addEventListener('devicemotion', this._handleMotion);
  }

  stop() {
    window.removeEventListener('devicemotion', this._handleMotion);
  }

  onSample(callback) {
    this.listeners.push(callback);
  }

  _handleMotion(event) {
    // Prefer accelerationIncludingGravity since plain `acceleration` is
    // null on many devices/browsers (notably Android Chrome).
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc || acc.x === null) return;

    const sample = {
      x: (acc.x || 0) / 9.81, // convert m/s^2 -> g
      y: (acc.y || 0) / 9.81,
      z: (acc.z || 0) / 9.81,
      t: Date.now(),
    };

    for (const cb of this.listeners) cb(sample);
  }
}

/**
 * Best-effort GPS tagging for event logs. Optional — failures here should
 * never block detection logic.
 */
export function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => resolve(null),
      { timeout: 4000 }
    );
  });
}

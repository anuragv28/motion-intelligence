/* Motion Intelligence Engine
   This file contains the core motion model.
   Do not change thresholds unless testing properly.
*/

const MotionEngine = {
  values: [],
  sensorHandler: null,
  alertActive: false,
  emergencyTimer: null,

  start(onSample, onEmergency, onComplete) {
    this.values = [];
    this.alertActive = false;

    const begin = () => {
      this.startMotion(onSample, onEmergency);
      setTimeout(() => {
        this.stop();
        const result = this.analyze();
        onComplete(result);
      }, 5000);
    };

    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      DeviceMotionEvent.requestPermission().then((state) => {
        if (state === "granted") {
          begin();
        } else {
          alert("Motion permission denied");
        }
      });
    } else {
      begin();
    }
  },

  startMotion(onSample, onEmergency) {
    this.sensorHandler = (event) => {
      const acc = event.accelerationIncludingGravity;

      if (!acc) return;

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      const magnitude = Math.abs(Math.sqrt(x * x + y * y + z * z) - 9.8);

      this.values.push(magnitude);

      onSample({
        x,
        y,
        z,
        magnitude
      });

      /* Emergency system is separate from normal classification */
      if (magnitude > 12 && !this.alertActive) {
        this.alertActive = true;

        this.emergencyTimer = setTimeout(() => {
          onEmergency();
        }, 5000);
      }
    };

    window.addEventListener("devicemotion", this.sensorHandler);
  },

  cancelEmergency() {
    this.alertActive = false;

    if (this.emergencyTimer) {
      clearTimeout(this.emergencyTimer);
    }
  },

  stop() {
    if (this.sensorHandler) {
      window.removeEventListener("devicemotion", this.sensorHandler);
      this.sensorHandler = null;
    }
  },

  analyze() {
    if (this.values.length === 0) {
      return {
        state: "No motion detected",
        avg: 0,
        max: 0,
        variation: 0,
        stability: "Unknown",
        samples: 0
      };
    }

    let sum = 0;
    let max = 0;

    for (let v of this.values) {
      sum += v;
      if (v > max) max = v;
    }

    const avg = sum / this.values.length;

    /* Original classification rules */
    let activity = "Idle 😴";

    if (avg > 0.5) activity = "Walking 🚶";
    if (avg > 1.5) activity = "Running 🏃";
    if (max > 6) activity = "Phone Shake 📳";

    /* Professional display state */
    let state = "Static State";

    if (activity.includes("Walking")) state = "Moderate Motion";
    if (activity.includes("Running")) state = "High Motion State";
    if (activity.includes("Shake")) state = "Impulse Motion Event";

    const variation = max - avg;

    let stability = "Stable";

    if (variation > 2) stability = "Unstable";
    if (variation > 4) stability = "Highly Unstable";

    return {
      state,
      avg,
      max,
      variation,
      stability,
      samples: this.values.length
    };
  }
};

function positive(values) {
  if (values.some(value => !Number.isFinite(value) || value <= 0)) {
    throw new RangeError('Enter a positive number in every field.');
  }
}

function percentage(value, name) {
  if (value > 100) throw new RangeError(`${name} must be 100% or less.`);
}

export function batteryRuntime({ voltage, capacity, load, usable }) {
  positive([voltage, capacity, load, usable]);
  percentage(usable, 'Usable capacity');
  const energy = voltage * capacity * usable / 100;
  return { energy, hours: energy / load, minutes: energy / load * 60 };
}

export function drivetrainSpeed({ rpm, reduction, diameter, loss }) {
  positive([rpm, reduction, diameter]);
  if (!Number.isFinite(loss) || loss < 0 || loss >= 100) throw new RangeError('Speed loss must be between 0% and 99%.');
  const wheelRpm = rpm / reduction;
  const speed = Math.PI * diameter / 1000 * wheelRpm / 60 * (1 - loss / 100);
  return { wheelRpm, speed, kmh: speed * 3.6 };
}

export function droneLift({ rotors, thrust, mass, usable }) {
  positive([rotors, thrust, mass, usable]);
  if (!Number.isInteger(rotors) || rotors < 2 || rotors > 16) throw new RangeError('Use a whole number of rotors between 2 and 16.');
  percentage(usable, 'Available thrust');
  const totalThrust = rotors * thrust / 1000 * usable / 100;
  return { totalThrust, ratio: totalThrust / mass, planningMass: totalThrust / 2 };
}

export function powerCurrent({ voltage, power, efficiency, duty }) {
  positive([voltage, power, efficiency, duty]);
  percentage(efficiency, 'Efficiency');
  percentage(duty, 'Duty cycle');
  const inputPower = power / (efficiency / 100);
  const current = inputPower / voltage;
  return { inputPower, current, average: current * duty / 100 };
}

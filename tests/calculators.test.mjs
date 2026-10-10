import test from 'node:test';
import assert from 'node:assert/strict';
import { batteryRuntime, drivetrainSpeed, droneLift, powerCurrent } from '../dist/calculators.js';

test('battery includes usable energy and converts hours to minutes', () => {
  assert.deepEqual(batteryRuntime({ voltage: 24, capacity: 10, load: 120, usable: 80 }), { energy: 192, hours: 1.6, minutes: 96 });
});
test('drivetrain converts millimetres and RPM with gear and speed losses', () => {
  const result = drivetrainSpeed({ rpm: 3000, reduction: 30, diameter: 150, loss: 10 });
  assert.equal(result.wheelRpm, 100);
  assert.ok(Math.abs(result.speed - .706858347) < .000001);
  assert.ok(Math.abs(result.kmh - 2.54469) < .00001);
});
test('drone comparison uses derated gram-force and kilogram take-off mass', () => {
  const result = droneLift({ rotors: 4, thrust: 1200, mass: 2, usable: 80 });
  assert.equal(result.totalThrust, 3.84);
  assert.equal(result.ratio, 1.92);
  assert.equal(result.planningMass, 1.92);
});
test('electrical calculation separates active and average current', () => {
  const result = powerCurrent({ voltage: 24, power: 120, efficiency: 80, duty: 50 });
  assert.deepEqual(result, { inputPower: 150, current: 6.25, average: 3.125 });
});
test('invalid inputs cannot create misleading finite estimates', () => {
  assert.throws(() => batteryRuntime({ voltage: 24, capacity: 10, load: 0, usable: 80 }), RangeError);
  assert.throws(() => batteryRuntime({ voltage: NaN, capacity: 10, load: 120, usable: 80 }), RangeError);
  assert.throws(() => batteryRuntime({ voltage: 24, capacity: 10, load: 120, usable: 101 }), RangeError);
  assert.throws(() => drivetrainSpeed({ rpm: 3000, reduction: 30, diameter: 150, loss: 100 }), RangeError);
  assert.throws(() => droneLift({ rotors: 4.5, thrust: 1200, mass: 2, usable: 80 }), RangeError);
  assert.throws(() => powerCurrent({ voltage: 24, power: 120, efficiency: 0, duty: 50 }), RangeError);
});

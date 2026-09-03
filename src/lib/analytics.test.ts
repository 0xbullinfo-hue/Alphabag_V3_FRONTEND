import { isGaMeasurementId } from './analytics';

test('accepts GA4 measurement IDs and rejects placeholders', () => {
  expect(isGaMeasurementId('G-AB12CD34')).toBe(true);
  expect(isGaMeasurementId('G-XXXXXXXXXX')).toBe(false);
  expect(isGaMeasurementId('UA-12345-1')).toBe(false);
  expect(isGaMeasurementId(undefined)).toBe(false);
});

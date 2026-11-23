import { normalizePhone } from './phone.js';

describe('normalizePhone', () => {
  it.each([
    ['082 123 4567', '+27821234567'],
    ['0821234567', '+27821234567'],
    ['082-123-4567', '+27821234567'],
    ['+27821234567', '+27821234567'],
    ['+27 82 123 4567', '+27821234567'],
  ])('turns %s into %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it('gives the same result for both formats of one number', () => {
    expect(normalizePhone('082 123 4567')).toBe(normalizePhone('+27821234567'));
  });

  it.each([
    '', // empty
    '82 123 4567', // missing the leading 0
    '082 123 456', // too short
    '082 123 45678', // too long
    '+44 20 7946 0958', // not South African
    '+270821234567', // extra 0 after +27
    '00821234567', // 0 then 0
    '082 ABC 4567', // letters
  ])('rejects %s', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

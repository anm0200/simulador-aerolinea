import { AIRPORTS } from './airports.data';

describe('Airports Data', () => {
  it('should have a list of airports', () => {
    expect(AIRPORTS).toBeDefined();
    expect(AIRPORTS.length).toBeGreaterThan(0);
  });

  it('should have correct properties for each airport', () => {
    const airport = AIRPORTS[0];
    expect(airport).toHaveProperty('id');
    expect(airport).toHaveProperty('name');
    expect(airport).toHaveProperty('city');
    expect(airport).toHaveProperty('country');
    expect(airport).toHaveProperty('lat');
    expect(airport).toHaveProperty('lng');
  });

  it('should contain Spanish airports', () => {
    const spanishAirports = AIRPORTS.filter((a) => a.country === 'España');
    expect(spanishAirports.length).toBeGreaterThan(0);
  });
});

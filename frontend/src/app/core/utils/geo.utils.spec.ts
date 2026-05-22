import { describe, it, expect } from 'vitest';
import {
  dmsToDecimal,
  isPointInPolygon,
  doesSegmentIntersectPolygon,
  interpolateGreatCircle,
} from './geo.utils';

describe('Geo Utils', () => {
  describe('dmsToDecimal', () => {
    it('should convert valid N coordinates correctly', () => {
      const result = dmsToDecimal('351700N');
      expect(result).toBeCloseTo(35.283333, 4);
    });

    it('should convert valid S coordinates correctly', () => {
      const result = dmsToDecimal('351700S');
      expect(result).toBeCloseTo(-35.283333, 4);
    });

    it('should convert valid W coordinates correctly', () => {
      const result = dmsToDecimal('0025500W');
      expect(result).toBeCloseTo(-2.916666, 4);
    });

    it('should convert valid E coordinates correctly', () => {
      const result = dmsToDecimal('0025500E');
      expect(result).toBeCloseTo(2.916666, 4);
    });

    it('should return 0 for invalid formats', () => {
      const result = dmsToDecimal('INVALID');
      expect(result).toBe(0);
    });
  });

  describe('interpolateGreatCircle', () => {
    it('should return identical point if distance is 0', () => {
      const p1 = { lat: 40, lng: -3 };
      const result = interpolateGreatCircle(p1, p1, 0.5);
      expect(result.lat).toBe(40);
      expect(result.lng).toBe(-3);
    });

    it('should interpolate correctly between two different points', () => {
      const p1 = { lat: 0, lng: 0 };
      const p2 = { lat: 10, lng: 10 };
      const result = interpolateGreatCircle(p1, p2, 0.5);
      expect(result.lat).toBeCloseTo(5.02, 2);
      expect(result.lng).toBeCloseTo(4.96, 2);
    });
  });

  describe('isPointInPolygon', () => {
    const polygon = [
      { lat: 0, lng: 0 },
      { lat: 10, lng: 0 },
      { lat: 10, lng: 10 },
      { lat: 0, lng: 10 },
    ];

    it('should return true if point is inside polygon', () => {
      const point = { lat: 5, lng: 5 };
      expect(isPointInPolygon(point, polygon)).toBe(true);
    });

    it('should return false if point is outside polygon', () => {
      const point = { lat: 15, lng: 15 };
      expect(isPointInPolygon(point, polygon)).toBe(false);
    });

    it('should return false if point is outside (negative coordinates)', () => {
      const point = { lat: -5, lng: -5 };
      expect(isPointInPolygon(point, polygon)).toBe(false);
    });
  });

  describe('doesSegmentIntersectPolygon', () => {
    const polygon = [
      { lat: 0, lng: 0 },
      { lat: 10, lng: 0 },
      { lat: 10, lng: 10 },
      { lat: 0, lng: 10 },
    ];

    it('should return true if segment starts outside and ends inside', () => {
      const p1 = { lat: -5, lng: 5 };
      const p2 = { lat: 5, lng: 5 };
      expect(doesSegmentIntersectPolygon(p1, p2, polygon)).toBe(true);
    });

    it('should return true if segment crosses completely through polygon', () => {
      const p1 = { lat: -5, lng: 5 };
      const p2 = { lat: 15, lng: 5 };
      expect(doesSegmentIntersectPolygon(p1, p2, polygon)).toBe(true);
    });

    it('should return false if segment is completely outside', () => {
      const p1 = { lat: -5, lng: -5 };
      const p2 = { lat: -5, lng: 15 };
      expect(doesSegmentIntersectPolygon(p1, p2, polygon)).toBe(false);
    });

    it('should handle collinear segments outside correctly', () => {
      const p1 = { lat: 20, lng: 20 };
      const p2 = { lat: 30, lng: 30 };
      expect(doesSegmentIntersectPolygon(p1, p2, polygon)).toBe(false);
    });

    it('should detect intersection even if all sample points miss the polygon', () => {
      const thinPolygon = [
        { lat: 0, lng: 0 },
        { lat: 10, lng: 0 },
        { lat: 10, lng: 1 },
        { lat: 0, lng: 1 },
      ];
      // Segment crosses the polygon but step size misses the [0,1] range
      // samples=5, length=11 => step=2.2
      // lng values: -5, -2.8, -0.6, 1.6, 3.8, 6
      const p1 = { lat: 5, lng: -5 };
      const p2 = { lat: 5, lng: 6 };
      expect(doesSegmentIntersectPolygon(p1, p2, thinPolygon)).toBe(true);
    });
  });
});

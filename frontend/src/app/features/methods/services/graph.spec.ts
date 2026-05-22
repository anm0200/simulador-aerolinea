import { setupTestEnvironment } from '../../../../test-setup';
setupTestEnvironment();
import { TestBed } from '@angular/core/testing';
import { GraphService } from './graph.service';
import { FlightService } from '../../../core/services/flight.service';

describe('GraphService (Original)', () => {
  let service: GraphService;
  let flightServiceMock: any;

  beforeEach(() => {
    flightServiceMock = {
      refreshData: vi.fn().mockResolvedValue(true),
      getScheduledFlights: vi.fn().mockReturnValue([]),
      getAirports: vi.fn().mockReturnValue([]),
      getRestrictedZones: vi.fn().mockReturnValue([]),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: FlightService, useValue: flightServiceMock }],
    });
    service = TestBed.inject(GraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Restricted Zones', () => {
    it('should identify and correct a path that crosses a restricted zone', () => {
      // Ruta recta de (40, -4) a (40, -2)
      const path = [
        { lat: 40, lng: -4 },
        { lat: 40, lng: -2 },
      ];

      // Zona en el medio (40, -3) con radio de 50km
      const zone = {
        id: 'test-zone',
        type: 'CIRCLE',
        center: { lat: 40, lng: -3 },
        radius: 50,
        polygon: [{ lat: 40, lng: -3 }],
      };

      // @ts-ignore - Acceder a método privado para el test
      const corrected = service.correctPathForZone(path, zone);

      expect(corrected).not.toBeNull();
      if (corrected) {
        expect(corrected.length).toBeGreaterThan(2);
        // El punto medio debe estar fuera de la zona (o al menos desplazado)
        const mid = corrected[1];
        // @ts-ignore
        const distToCenter = service.calculateDistance(
          mid.lat,
          mid.lng,
          zone.center.lat,
          zone.center.lng,
        );
        expect(distToCenter).toBeGreaterThanOrEqual(zone.radius);
      }
    });

    it('should NOT correct a path that is far from the restricted zone', () => {
      const path = [
        { lat: 42, lng: -4 },
        { lat: 42, lng: -2 },
      ];

      const zone = {
        id: 'test-zone',
        type: 'CIRCLE',
        center: { lat: 40, lng: -3 },
        radius: 50,
        polygon: [{ lat: 40, lng: -3 }],
      };

      // @ts-ignore
      const corrected = service.correctPathForZone(path, zone);
      expect(corrected).toBeNull();
    });
  });

  describe('Algorithms', () => {
    beforeEach(() => {
      // Configurar un grafo simple para las pruebas
      service.graph = {
        nodes: [
          { id: 'MAD', label: 'Madrid', type: 'AIRPORT', lat: 40, lng: -3 },
          { id: 'BCN', label: 'Barcelona', type: 'AIRPORT', lat: 41, lng: 2 },
          { id: 'VLC', label: 'Valencia', type: 'AIRPORT', lat: 39, lng: -0 },
        ],
        edges: [
          { from: 'MAD', to: 'BCN', weight: 500, durationMinutes: 60, type: 'AIRWAY' },
          { from: 'MAD', to: 'VLC', weight: 300, durationMinutes: 40, type: 'AIRWAY' },
          { from: 'VLC', to: 'BCN', weight: 350, durationMinutes: 45, type: 'AIRWAY' },
        ],
      };
      (service as any).adjacencyList = new Map<string, any[]>();
      service.graph.nodes.forEach((n) => (service as any).adjacencyList.set(n.id, []));
      service.graph.edges.forEach((e) => {
        (service as any).adjacencyList.get(e.from).push(e);
        const reverseEdge = { ...e, from: e.to, to: e.from };
        (service as any).adjacencyList.get(e.to).push(reverseEdge);
      });
    });

    it('should run Dijkstra', () => {
      const result = service.runDijkstra('MAD', 'BCN');
      expect(result).toBeDefined();
      expect(result.distance).toBeGreaterThanOrEqual(0);
    });

    it('should run AStar', () => {
      const result = service.runAStar('MAD', 'BCN');
      expect(result).toBeDefined();
      expect(result.distance).toBeGreaterThanOrEqual(0);
    });

    it('should run BFS', () => {
      const result = service.runBFS('MAD', 'BCN');
      expect(result).toBeDefined();
      expect(result.distance).toBeGreaterThanOrEqual(0);
    });

    it('should run Kruskal', () => {
      const result = service.runKruskal();
      expect(result).toBeDefined();
    });

    it('should run Prim', () => {
      const result = service.runPrim('MAD');
      expect(result).toBeDefined();
    });

    it('should run MultiPointAlgorithm', () => {
      const result = service.runMultiPointAlgorithm(['MAD', 'VLC', 'BCN'], 'dijkstra');
      expect(result).toBeDefined();
      expect(result.distance).toBeGreaterThanOrEqual(0);
    });
  });
});

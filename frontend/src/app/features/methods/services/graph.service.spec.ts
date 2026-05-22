import { TestBed } from '@angular/core/testing';
import { GraphService } from './graph.service';
import { FlightService } from '../../../core/services/flight.service';

describe('GraphService', () => {
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
      providers: [GraphService, { provide: FlightService, useValue: flightServiceMock }],
    });
    service = TestBed.inject(GraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get predefined zones correctly', () => {
    const zones = service.getPredefinedZones();
    expect(zones).toBeDefined();
    expect(zones.length).toBeGreaterThan(0);
    expect(zones[0].type).toBeDefined();
  });

  it('should clear restricted zones', () => {
    service.setRestrictedZones([
      {
        id: 'test',
        name: 'test',
        type: 'CIRCLE',
        center: { lat: 0, lng: 0 },
        radius: 10,
      },
    ]);

    expect(service.getRestrictedZones().length).toBe(1);

    service.clearRestrictedZones();

    expect(service.getRestrictedZones().length).toBe(0);
  });

  it('should return initial empty graph', () => {
    const graph = service.getGraph();
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it('should call flightService to get airports', () => {
    service.getAirports();
    expect(flightServiceMock.getAirports).toHaveBeenCalled();
  });

  it('should load graph from real data gracefully with empty data', async () => {
    const graph = await service.loadGraphFromRealData();
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
    expect(flightServiceMock.refreshData).toHaveBeenCalled();
  });
});

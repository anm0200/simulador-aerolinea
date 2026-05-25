import { Injectable } from '@angular/core';
import { FlightService } from '../../../core/services/flight.service';
import { calculateDistance, interpolateGreatCircle } from '../../../core/utils/geo.utils';
import { dmsToDecimal, doesSegmentIntersectPolygon } from '../../../core/utils/geo.utils';
import { PREDEFINED_ZONES } from '../../../core/models/restricted-zones.data';

export interface Point {
  lat: number;
  lng: number;
}

export interface Node {
  id: string; // "lat,lng"
  lat: number;
  lng: number;
  cityName?: string;
  airportName?: string;
  originalIndex?: number;
}

export interface Edge {
  sourceId: string;
  targetId: string;
  weight: number; // Distancia (usada en Kruskal por defecto o como fallback)
  durationMinutes: number; // Tiempo de tránsito real
  type: 'flight' | 'transfer';
  flightId?: string;
  path?: Point[];
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export interface RestrictedZone {
  id: string;
  name: string;
  type: 'CIRCLE' | 'POLYGON';
  center?: Point; // Para CIRCLE
  radius?: number; // Para CIRCLE
  points?: Point[]; // Para POLYGON
  upperLimit?: string;
  lowerLimit?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GraphService {
  private graph: GraphData = { nodes: [], edges: [] };
  private originalEdges: Edge[] = []; // Para restaurar si se quitan restricciones
  private adjacencyList: Map<string, Edge[]> = new Map();
  private restrictedZones: RestrictedZone[] = [];

  constructor(private flightService: FlightService) {}

  /**
   * Datos predefinidos de zonas restringidas en España
   */
  getPredefinedZones(): RestrictedZone[] {
    return PREDEFINED_ZONES.map((z) => {
      if (z.coordenadas.length === 1) {
        // Melilla y Ceuta parecen puntos. Les asignamos un radio por defecto (20km)
        const [latStr, lngStr] = z.coordenadas[0].split(' ');
        return {
          id: z.id,
          name: z.nombre,
          type: 'CIRCLE' as const,
          center: { lat: dmsToDecimal(latStr), lng: dmsToDecimal(lngStr) },
          radius: 20,
          upperLimit: z.limite_superior,
        };
      } else {
        // Polígonos
        const points = z.coordenadas.map((c) => {
          const [latStr, lngStr] = c.split(' ');
          return { lat: dmsToDecimal(latStr), lng: dmsToDecimal(lngStr) };
        });
        return {
          id: z.id,
          name: z.nombre,
          type: 'POLYGON' as const,
          points: points,
          upperLimit: z.limite_superior,
        };
      }
    });
  }

  /**
   * Lee el archivo GeoJSON y crea un grafo basado estrictamente
   * en los extremos inicial y final de cada vuelo, sin agrupar por distancia.
   */
  async loadGraphFromRealData(
    clusterRadiusKm: number = 50,
    targetDate?: string,
  ): Promise<GraphData> {
    try {
      // Nos aseguramos de tener los datos actualizados desde la BD (PostgreSQL)
      await this.flightService.refreshData();
      const allFlights = this.flightService.getScheduledFlights();
      const allAirports = this.flightService.getAirports();

      // Filtramos vuelos: Diarios O que coincidan con la fecha seleccionada
      const scheduledFlights = allFlights.filter(
        (f) => f.isActive && (f.isDaily || (targetDate && f.date === targetDate)),
      );

      this.graph = { nodes: [], edges: [] };
      this.originalEdges = [];
      this.adjacencyList.clear();

      // Para clustering: Guardamos los clústeres creados
      const clusters: { id: string; lat: number; lng: number }[] = [];

      const getCluster = (lat: number, lng: number): { id: string; lat: number; lng: number } => {
        if (clusterRadiusKm <= 0) {
          return { id: `${lat},${lng}`, lat, lng };
        }

        let closest = null;
        let minDist = Infinity;

        for (const c of clusters) {
          const d = calculateDistance(lat, lng, c.lat, c.lng);
          if (d < minDist) {
            minDist = d;
            closest = c;
          }
        }

        if (closest && minDist <= clusterRadiusKm) {
          return closest; // Fusionar con un nodo/cluster cercano existente
        }

        // Crear nuevo cluster
        const newC = { id: `cluster_${clusters.length}`, lat, lng };
        clusters.push(newC);
        return newC;
      };

      for (let i = 0; i < scheduledFlights.length; i++) {
        const flight = scheduledFlights[i];
        if (!flight.isActive) continue; // Ignorar vuelos inactivos

        const origin = allAirports.find((a) => a.id === flight.originId);
        const destination = allAirports.find((a) => a.id === flight.destinationId);

        if (!origin || !destination) continue;

        // Obtener u agrupar endpoints
        const startNode = getCluster(origin.lat, origin.lng);
        const endNode = getCluster(destination.lat, destination.lng);

        this.addNodeIfMissing(
          startNode.id,
          startNode.lat,
          startNode.lng,
          i,
          origin.city,
          origin.name,
        );
        this.addNodeIfMissing(
          endNode.id,
          endNode.lat,
          endNode.lng,
          i,
          destination.city,
          destination.name,
        );

        // Si inicio y fin caen en el mismo cluster, descartar ruta circular
        if (startNode.id === endNode.id) {
          continue;
        }

        const weight = calculateDistance(startNode.lat, startNode.lng, endNode.lat, endNode.lng);

        const duration = flight.durationMinutes;

        // Generamos una trayectoria realista (curvada/geodésica) para los vuelos
        const path = this.generateGeodesicPath(
          { lat: origin.lat, lng: origin.lng },
          { lat: destination.lat, lng: destination.lng },
          flight.id,
        );

        this.addEdge(startNode.id, endNode.id, weight, duration, 'flight', flight.id, path);
        this.addEdge(
          endNode.id,
          startNode.id,
          weight,
          duration,
          'flight',
          flight.id,
          [...path].reverse(),
        );
      }

      // --- PASO 2: CONECTIVIDAD TOTAL (TRANSFERENCIAS) ---
      // Conectamos nodos cercanos para que el pasajero pueda "hacer transbordo"
      // entre vuelos distintos. De lo contrario, los vuelos son líneas aisladas.
      const MAX_TRANSFER_DIST = 300; // km (Reducido para evitar "telarañas" irreales)

      const nodesList = this.graph.nodes;
      for (let i = 0; i < nodesList.length; i++) {
        for (let j = i + 1; j < nodesList.length; j++) {
          const n1 = nodesList[i];
          const n2 = nodesList[j];

          const dist = calculateDistance(n1.lat, n1.lng, n2.lat, n2.lng);

          if (dist < MAX_TRANSFER_DIST && dist > 0) {
            // BLOQUEO DE AGUA: No permitir transbordos por tierra si hay mar de por medio
            if (!this.isTransferPossibleByLand(n1, n2)) continue;

            // Penalizamos un poco el peso del transbordo para que prefiera vuelos largos reales
            const weight = dist * 1.5;

            // Verificamos si ya existe una arista real entre ellos
            const existingEdges = this.adjacencyList.get(n1.id) || [];
            const alreadyConnected = existingEdges.some((e) => e.targetId === n2.id);

            if (!alreadyConnected) {
              const path = [
                { lat: n1.lat, lng: n1.lng },
                { lat: n2.lat, lng: n2.lng },
              ];

              // Un transbordo terrestre (80km/h aprox)
              const duration = Math.round((dist / 80) * 60);

              this.addEdge(n1.id, n2.id, weight, duration, 'transfer', 'transfer', path);
              this.addEdge(
                n2.id,
                n1.id,
                weight,
                duration,
                'transfer',
                'transfer',
                [...path].reverse(),
              );
            }
          }
        }
      }

      // --- PASO 3: APLICAR ZONAS RESTRINGIDAS CUSTOM ---
      // Cargamos las de la DB y las unimos a las seleccionadas actualmente (predefinidas)
      const dbZones = this.flightService.getRestrictedZones();
      const activeDbZones = dbZones
        .filter(
          (z) => z.isActive && (!z.specificDate || (targetDate && z.specificDate === targetDate)),
        )
        .map((z) => ({
          id: z.id,
          name: z.name,
          type: z.type as 'CIRCLE' | 'POLYGON',
          center: z.center
            ? typeof z.center === 'string'
              ? JSON.parse(z.center)
              : z.center
            : undefined,
          radius: z.radius,
          points: z.points
            ? typeof z.points === 'string'
              ? JSON.parse(z.points)
              : z.points
            : undefined,
          upperLimit: z.upperLimit,
        }));

      // Evitamos duplicados por ID si el usuario vuelve a cargar
      const currentIds = new Set(this.restrictedZones.map((z) => z.id));
      for (const az of activeDbZones) {
        if (!currentIds.has(az.id)) {
          this.restrictedZones.push(az);
        }
      }

      this.applyRestrictions();

      return this.graph;
    } catch (error) {
      console.error('Error loading graph data:', error);
      throw error;
    }
  }

  getGraph(): GraphData {
    return this.graph;
  }

  getAirports() {
    return this.flightService.getAirports();
  }

  private addNodeIfMissing(
    id: string,
    lat: number,
    lng: number,
    originalIdx: number,
    city?: string,
    name?: string,
  ) {
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, []);
      this.graph.nodes.push({
        id,
        lat,
        lng,
        originalIndex: originalIdx,
        cityName: city,
        airportName: name,
      });
    }
  }

  private addEdge(
    sourceId: string,
    targetId: string,
    weight: number,
    duration: number,
    type: 'flight' | 'transfer',
    flightId: string,
    path: Point[],
  ) {
    const edge: Edge = {
      sourceId,
      targetId,
      weight,
      durationMinutes: duration,
      type,
      flightId,
      path,
    };
    this.graph.edges.push(edge);
    this.originalEdges.push({ ...edge, path: [...path] });
    this.adjacencyList.get(sourceId)?.push(edge);
  }

  // --- NUEVA LÓGICA: RALLYS AÉREOS (ZONAS RESTRINGIDAS) ---

  getRestrictedZones() {
    return this.restrictedZones;
  }

  setRestrictedZones(zones: RestrictedZone[]) {
    // Asegurarnos de que center y points estén parseados si vienen como string del backend
    this.restrictedZones = zones.map((z) => ({
      ...z,
      center: typeof z.center === 'string' ? JSON.parse(z.center) : z.center,
      points: typeof z.points === 'string' ? JSON.parse(z.points) : z.points,
    }));
    this.applyRestrictions();
  }

  clearRestrictedZones() {
    this.restrictedZones = [];
    this.applyRestrictions();
  }

  /**
   * Re-calcula la geometría y pesos de todas las aristas
   * basándose en las zonas restringidas actuales.
   */
  private applyRestrictions() {
    // 1. Restaurar aristas originales
    this.graph.edges = this.originalEdges.map((e) => ({ ...e, path: [...(e.path || [])] }));

    // 2. Si no hay zonas, terminar
    if (this.restrictedZones.length === 0) {
      this.rebuildAdjacencyList();
      return;
    }

    // 3. Para cada arista, verificar y corregir contra cada zona
    for (const edge of this.graph.edges) {
      if (edge.type !== 'flight' || !edge.path) continue;

      let edgeAffected = false;

      // Realizamos hasta 3 pasadas para asegurar que el desvío de una zona
      // no nos meta en otra zona solapada.
      for (let pass = 0; pass < 3; pass++) {
        let passAffected = false;
        for (const zone of this.restrictedZones) {
          const corrected = this.correctPathForZone(edge.path, zone);
          if (corrected) {
            edge.path = corrected;
            edgeAffected = true;
            passAffected = true;
          }
        }
        if (!passAffected) break;
      }

      if (edgeAffected) {
        const newDistance = this.calculatePathDistance(edge.path);

        let stillIntersects = false;
        for (const zone of this.restrictedZones) {
          const checkFn =
            zone.type === 'CIRCLE'
              ? (p1: Point, p2: Point) =>
                  this.doesSegmentIntersectCircle(p1, p2, zone.center!, zone.radius!)
              : (p1: Point, p2: Point) => doesSegmentIntersectPolygon(p1, p2, zone.points!);

          for (let k = 0; k < edge.path.length - 1; k++) {
            if (checkFn(edge.path[k], edge.path[k + 1])) {
              stillIntersects = true;
              break;
            }
          }
          if (stillIntersects) break;
        }

        // Si es seguro, penalización mínima (1.05) para que lo prefiera a layovers.
        // Si sigue fallando, prohibido (x1000).
        const penaltyFactor = stillIntersects ? 1000.0 : 1.05;

        edge.weight = newDistance * penaltyFactor;

        const originalDist = calculateDistance(
          this.graph.nodes.find((n) => n.id === edge.sourceId)!.lat,
          this.graph.nodes.find((n) => n.id === edge.sourceId)!.lng,
          this.graph.nodes.find((n) => n.id === edge.targetId)!.lat,
          this.graph.nodes.find((n) => n.id === edge.targetId)!.lng,
        );

        const distRatio = newDistance / (originalDist || 1);
        edge.durationMinutes = Math.round(edge.durationMinutes * distRatio * penaltyFactor);
      }
    }

    this.rebuildAdjacencyList();
  }

  private rebuildAdjacencyList() {
    this.adjacencyList.clear();
    for (const node of this.graph.nodes) {
      this.adjacencyList.set(node.id, []);
    }
    for (const edge of this.graph.edges) {
      this.adjacencyList.get(edge.sourceId)?.push(edge);
    }
  }

  private calculatePathDistance(path: Point[]): number {
    let dist = 0;
    for (let i = 0; i < path.length - 1; i++) {
      dist += calculateDistance(path[i].lat, path[i].lng, path[i + 1].lat, path[i + 1].lng);
    }
    return dist;
  }

  /**
   * Toma una trayectoria y la "dobla" para que bordee la zona si la atraviesa.
   */
  /**
   * Toma una trayectoria y la "dobla" de forma suave para que rodee la zona.
   * Utiliza un muestreo de alta resolución para que el trazo parezca una curva natural.
   */
  private correctPathForZone(path: Point[], zone: RestrictedZone): Point[] | null {
    let affected = false;
    const marginKm = 10;
    const resolutionKm = 5; // Un punto cada 5km para suavizar la curva

    const centroid = zone.type === 'CIRCLE' ? zone.center! : this.calculateCentroid(zone.points!);
    const radiusKm =
      (zone.type === 'CIRCLE' ? zone.radius! : this.calculateMaxRadius(zone.points!, centroid)) +
      marginKm;

    // 1. Remuestrear el camino a alta resolución
    const highResPath: Point[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const dist = calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
      const steps = Math.max(1, Math.ceil(dist / resolutionKm));

      for (let s = 0; s < steps; s++) {
        const f = s / steps;
        highResPath.push({
          lat: p1.lat + (p2.lat - p1.lat) * f,
          lng: p1.lng + (p2.lng - p1.lng) * f,
        });
      }
    }
    highResPath.push(path[path.length - 1]);

    // 2. Empujar puntos que estén dentro del radio (o peligrosamente cerca)
    const correctedPath: Point[] = [];
    for (const p of highResPath) {
      const d = calculateDistance(centroid.lat, centroid.lng, p.lat, p.lng);

      // Si el punto está dentro del radio + margen, lo empujamos
      if (d < radiusKm) {
        affected = true;
        let vLat = p.lat - centroid.lat;
        let vLng = p.lng - centroid.lng;

        if (Math.abs(vLat) < 1e-9 && Math.abs(vLng) < 1e-9) vLat = 0.001;

        const currentDistDeg = Math.sqrt(vLat * vLat + vLng * vLng);
        // Empujamos un pelín más (0.5km extra) para evitar errores de precisión en la validación
        const targetDistDeg = (radiusKm + 0.5) / 111.32;
        const ratio = targetDistDeg / (currentDistDeg || 0.0001);

        correctedPath.push({
          lat: centroid.lat + vLat * ratio,
          lng: centroid.lng + vLng * ratio,
        });
      } else {
        correctedPath.push(p);
      }
    }

    return affected ? this.cleanPath(correctedPath) : null;
  }

  private calculateMaxRadius(polygon: Point[], centroid: Point): number {
    let maxR = 0;
    for (const p of polygon) {
      const d = calculateDistance(centroid.lat, centroid.lng, p.lat, p.lng);
      if (d > maxR) maxR = d;
    }
    return maxR;
  }

  private doesSegmentIntersectCircle(p1: Point, p2: Point, center: Point, radius: number): boolean {
    const d = this.distPointToSegment(center, p1, p2);
    return d < radius;
  }

  private distPointToSegment(p: Point, a: Point, b: Point): number {
    const dx = b.lat - a.lat;
    const dy = b.lng - a.lng;
    if (dx === 0 && dy === 0) return calculateDistance(p.lat, p.lng, a.lat, a.lng);

    const t = ((p.lat - a.lat) * dx + (p.lng - a.lng) * dy) / (dx * dx + dy * dy);
    const clampedT = Math.max(0, Math.min(1, t));
    const projection = { lat: a.lat + clampedT * dx, lng: a.lng + clampedT * dy };
    return calculateDistance(p.lat, p.lng, projection.lat, projection.lng);
  }

  private calculateCentroid(points: Point[]): Point {
    let lat = 0,
      lng = 0;
    for (const p of points) {
      lat += p.lat;
      lng += p.lng;
    }
    return { lat: lat / points.length, lng: lng / points.length };
  }

  private cleanPath(path: Point[]): Point[] {
    const clean: Point[] = [];
    for (let i = 0; i < path.length; i++) {
      if (i === 0 || path[i].lat !== path[i - 1].lat || path[i].lng !== path[i - 1].lng) {
        clean.push(path[i]);
      }
    }
    return clean;
  }

  /**
   * Encuentra un punto en el borde del círculo para desviar la ruta.
   */
  private getArcMidpoint(p1: Point, p2: Point, center: Point, pushDistanceKm: number): Point {
    const latMid = (p1.lat + p2.lat) / 2;
    const lngMid = (p1.lng + p2.lng) / 2;

    // Vector desde el centroide al punto medio (en grados)
    let vLat = latMid - center.lat;
    let vLng = lngMid - center.lng;

    // Si el centroide coincide con el punto medio, empujamos un poco hacia el norte
    if (Math.abs(vLat) < 1e-7 && Math.abs(vLng) < 1e-7) {
      vLat = 0.01;
    }

    // Calculamos la distancia actual en KM para normalizar
    const currentDistKm = calculateDistance(center.lat, center.lng, latMid, lngMid) || 0.001;

    // 1 grado latitud ≈ 111.32 km. Para longitud escalamos por cos(lat).
    const degLat = (vLat / currentDistKm) * pushDistanceKm;
    const degLng = (vLng / currentDistKm) * pushDistanceKm;

    return {
      lat: center.lat + degLat,
      lng: center.lng + degLng,
    };
  }

  private calculateFlightArrivalTime(
    flightId: string | undefined,
    currentTime: number,
    durationMinutes: number,
    minConnectionTime: number,
  ): number {
    const flight = this.flightService.getScheduledFlights().find((f) => f.id === flightId);
    if (flight) {
      const [h, m] = flight.departureTime.split(':').map(Number);
      let depMinutes = h * 60 + m;
      const earliestPossibleDeparture = currentTime + minConnectionTime;
      while (depMinutes < earliestPossibleDeparture) {
        depMinutes += 1440;
      }
      return depMinutes + durationMinutes;
    }
    return currentTime + durationMinutes + minConnectionTime;
  }

  /**
   * Algoritmo de Dijkstra Temporal (Earliest Arrival Path)
   */
  runDijkstra(
    startId: string,
    endId: string,
    startTimeMinutes: number = 480, // Por defecto 08:00
  ): {
    pathMap: Map<string, Edge | null>;
    shortestPath: Edge[];
    visitedOrder: string[];
    distance: number;
    time: number; // Tiempo total en minutos
    arrivalTimes: Map<string, number>;
  } {
    const arrivalTimes = new Map<string, number>();
    const previous = new Map<string, Edge | null>();
    const visited = new Set<string>();
    const visitedOrder: string[] = [];
    const queue: { id: string; time: number }[] = [];

    const MIN_CONNECTION_TIME = 45; // minutos

    for (const node of this.graph.nodes) {
      arrivalTimes.set(node.id, Infinity);
      previous.set(node.id, null);
    }

    arrivalTimes.set(startId, startTimeMinutes);
    queue.push({ id: startId, time: startTimeMinutes });

    while (queue.length > 0) {
      queue.sort((a, b) => a.time - b.time);
      const current = queue.shift()!;
      const currentId = current.id;

      if (visited.has(currentId)) continue;
      visited.add(currentId);
      visitedOrder.push(currentId);

      if (currentId === endId) break;

      const neighbors = this.adjacencyList.get(currentId) || [];
      for (const edge of neighbors) {
        if (visited.has(edge.targetId)) continue;

        let edgeCostMinutes = 0;
        let arrivalAtTarget = 0;

        if (edge.type === 'flight') {
          arrivalAtTarget = this.calculateFlightArrivalTime(
            edge.flightId,
            current.time,
            edge.durationMinutes,
            MIN_CONNECTION_TIME,
          );
          edgeCostMinutes = arrivalAtTarget - current.time;
        } else {
          // --- MEJORA DE REALISMO: PENALIZACIÓN DE TRANSBORDO ---
          // El tiempo terrestre "pesa" más (x2) y tiene un coste fijo de "molestia" (120 min)
          // Esto hace que Dijkstra prefiera esperar un vuelo antes que cruzar el país en bus
          edgeCostMinutes = edge.durationMinutes * 2 + 120;
          arrivalAtTarget = current.time + edge.durationMinutes;
        }

        if (arrivalAtTarget < arrivalTimes.get(edge.targetId)!) {
          arrivalTimes.set(edge.targetId, arrivalAtTarget);
          previous.set(edge.targetId, edge);
          const effortScore = arrivalAtTarget + (edge.type === 'transfer' ? 500 : 0);
          queue.push({ id: edge.targetId, time: effortScore });
        }
      }
    }

    const shortestPath: Edge[] = [];
    let curr = endId;
    if (arrivalTimes.get(endId) === Infinity) {
      return {
        pathMap: previous,
        shortestPath: [],
        visitedOrder,
        distance: Infinity,
        time: Infinity,
        arrivalTimes,
      };
    }

    while (curr !== startId) {
      const edge = previous.get(curr);
      if (edge) {
        shortestPath.unshift(edge);
        curr = edge.sourceId;
      } else break;
    }

    const totalDistance = shortestPath.reduce((acc, e) => acc + e.weight, 0);

    return {
      pathMap: previous,
      shortestPath,
      visitedOrder,
      distance: totalDistance,
      time: arrivalTimes.get(endId)! - startTimeMinutes,
      arrivalTimes,
    };
  }

  /**
   * Algoritmo A* Temporal
   */
  runAStar(
    startId: string,
    endId: string,
    startTimeMinutes: number = 480,
  ): {
    pathMap: Map<string, Edge | null>;
    shortestPath: Edge[];
    visitedOrder: string[];
    distance: number;
    time: number;
  } {
    const endNode = this.graph.nodes.find((n) => n.id === endId);
    if (!endNode)
      return {
        pathMap: new Map(),
        shortestPath: [],
        visitedOrder: [],
        distance: Infinity,
        time: Infinity,
      };

    const arrivalTimes = new Map<string, number>();
    const fScore = new Map<string, number>(); // Tiempo estimado total (g + h)
    const previous = new Map<string, Edge | null>();
    const visited = new Set<string>();
    const visitedOrder: string[] = [];
    const openSet: { id: string; f: number }[] = [];

    const MIN_CONNECTION_TIME = 45;

    for (const node of this.graph.nodes) {
      arrivalTimes.set(node.id, Infinity);
      fScore.set(node.id, Infinity);
      previous.set(node.id, null);
    }

    arrivalTimes.set(startId, startTimeMinutes);

    // Heurística temporal: distancia / 900km/h (crucero)
    const getH = (nodeId: string) => {
      const node = this.graph.nodes.find((n) => n.id === nodeId)!;
      const dist = calculateDistance(node.lat, node.lng, endNode.lat, endNode.lng);
      return (dist / 900) * 60; // h -> min
    };

    const hStart = getH(startId);
    fScore.set(startId, startTimeMinutes + hStart);
    openSet.push({ id: startId, f: startTimeMinutes + hStart });

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentId = current.id;

      if (visited.has(currentId)) continue;
      visited.add(currentId);
      visitedOrder.push(currentId);

      if (currentId === endId) break;

      const neighbors = this.adjacencyList.get(currentId) || [];
      for (const edge of neighbors) {
        if (visited.has(edge.targetId)) continue;

        let arrivalAtTarget = 0;
        let effortPenalty = 0;

        if (edge.type === 'flight') {
          arrivalAtTarget = this.calculateFlightArrivalTime(
            edge.flightId,
            arrivalTimes.get(currentId)!,
            edge.durationMinutes,
            MIN_CONNECTION_TIME,
          );
        } else {
          // Penalización A* para transbordos
          arrivalAtTarget = arrivalTimes.get(currentId)! + edge.durationMinutes;
          effortPenalty = edge.durationMinutes + 120; // Penalización extra de búsqueda
        }

        if (arrivalAtTarget < arrivalTimes.get(edge.targetId)!) {
          previous.set(edge.targetId, edge);
          arrivalTimes.set(edge.targetId, arrivalAtTarget);

          const f = arrivalAtTarget + getH(edge.targetId) + effortPenalty;
          fScore.set(edge.targetId, f);

          if (!openSet.some((item) => item.id === edge.targetId)) {
            openSet.push({ id: edge.targetId, f });
          }
        }
      }
    }

    const shortestPath: Edge[] = [];
    let curr = endId;
    if (arrivalTimes.get(endId) === Infinity) {
      return {
        pathMap: previous,
        shortestPath: [],
        visitedOrder,
        distance: Infinity,
        time: Infinity,
      };
    }

    while (curr !== startId) {
      const edge = previous.get(curr);
      if (edge) {
        shortestPath.unshift(edge);
        curr = edge.sourceId;
      } else break;
    }

    const totalDistance = shortestPath.reduce((acc, e) => acc + e.weight, 0);

    return {
      pathMap: previous,
      shortestPath,
      visitedOrder,
      distance: totalDistance,
      time: arrivalTimes.get(endId)! - startTimeMinutes,
    };
  }

  /**
   * Algoritmo de Búsqueda en Anchura (BFS)
   * Encuentra el camino con el mínimo número de escalas (aristas).
   */
  runBFS(
    startId: string,
    endId: string,
    startTimeMinutes: number = 480,
  ): {
    pathMap: Map<string, Edge | null>;
    shortestPath: Edge[];
    visitedOrder: string[];
    distance: number;
    time: number;
  } {
    const queue: { id: string; time: number }[] = [{ id: startId, time: startTimeMinutes }];
    const visited = new Set<string>();
    const visitedOrder: string[] = [];
    const previous = new Map<string, Edge | null>();
    const arrivalTimes = new Map<string, number>();

    visited.add(startId);
    arrivalTimes.set(startId, startTimeMinutes);

    let found = false;
    while (queue.length > 0) {
      const { id: currentId, time: currentTime } = queue.shift()!;
      visitedOrder.push(currentId);

      if (currentId === endId) {
        found = true;
        break;
      }

      const neighbors = this.adjacencyList.get(currentId) || [];
      for (const edge of neighbors) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          previous.set(edge.targetId, edge);

          // Calculamos el tiempo de llegada para el reporte, aunque no se use para la prioridad
          let arrivalAtTarget = currentTime + edge.durationMinutes;
          if (edge.type === 'flight') {
            arrivalAtTarget = this.calculateFlightArrivalTime(
              edge.flightId,
              currentTime,
              edge.durationMinutes,
              45,
            );
          }

          arrivalTimes.set(edge.targetId, arrivalAtTarget);
          queue.push({ id: edge.targetId, time: arrivalAtTarget });
        }
      }
    }

    if (!found) {
      return {
        pathMap: previous,
        shortestPath: [],
        visitedOrder,
        distance: Infinity,
        time: Infinity,
      };
    }

    const shortestPath: Edge[] = [];
    let curr = endId;
    while (curr !== startId) {
      const edge = previous.get(curr);
      if (edge) {
        shortestPath.unshift(edge);
        curr = edge.sourceId;
      } else break;
    }

    const totalDistance = shortestPath.reduce((acc, e) => acc + e.weight, 0);
    const totalTime = arrivalTimes.get(endId)! - startTimeMinutes;

    return {
      pathMap: previous,
      shortestPath,
      visitedOrder,
      distance: totalDistance,
      time: totalTime,
    };
  }

  /**
   * Algoritmo de Kruskal (MST)
   * Devuelve un arreglo de aristas que forman el Árbol de Recubrimiento Mínimo.
   */
  runKruskal(): { mstEdges: Edge[]; totalWeight: number; edgeProcessOrder: Edge[] } {
    // 1. Extraer TODAS las aristas y eliminar duplicados (A->B es lo mismo que B->A para MST no dirigido)
    const uniqueEdges: Edge[] = [];
    const seenMap = new Set<string>();

    for (const edge of this.graph.edges) {
      // Ordenar IDs para garantizar misma clave independientemente de la dirección
      const key = [edge.sourceId, edge.targetId].sort().join('-');
      if (!seenMap.has(key)) {
        seenMap.add(key);
        uniqueEdges.push(edge);
      }
    }

    // 2. Ordenar de menor a mayor DURACIÓN
    uniqueEdges.sort((a, b) => {
      const weightA = a.type === 'transfer' ? a.durationMinutes * 2 : a.durationMinutes;
      const weightB = b.type === 'transfer' ? b.durationMinutes * 2 : b.durationMinutes;
      return weightA - weightB;
    });

    // 3. Estructura Union-Find (Conjuntos Disjuntos)
    const parent = new Map<string, string>();
    const rank = new Map<string, number>();

    // Inicializar cada nodo como su propio padre (subconjunto propio)
    for (const node of this.graph.nodes) {
      parent.set(node.id, node.id);
      rank.set(node.id, 0);
    }

    // Función: Buscar la raíz del conjunto
    const find = (i: string): string => {
      if (parent.get(i) === i) {
        return i;
      }
      // Path compression
      const root = find(parent.get(i)!);
      parent.set(i, root);
      return root;
    };

    // Función: Unir dos conjuntos
    const union = (i: string, j: string): void => {
      const rootI = find(i);
      const rootJ = find(j);

      if (rootI !== rootJ) {
        const rankI = rank.get(rootI)!;
        const rankJ = rank.get(rootJ)!;

        // Union by rank
        if (rankI < rankJ) {
          parent.set(rootI, rootJ);
        } else if (rankI > rankJ) {
          parent.set(rootJ, rootI);
        } else {
          parent.set(rootJ, rootI);
          rank.set(rootI, rankI + 1);
        }
      }
    };

    const mstEdges: Edge[] = [];
    const edgeProcessOrder: Edge[] = [];
    let totalWeight = 0;

    // 4. Iterar sobre las aristas ordenadas
    for (const edge of uniqueEdges) {
      edgeProcessOrder.push(edge); // Para visualización: todas las aristas comprobadas

      const rootSource = find(edge.sourceId);
      const rootTarget = find(edge.targetId);

      // Si no comparten raíz, añadimos la arista al MST y unimos los conjuntos
      if (rootSource !== rootTarget) {
        mstEdges.push(edge);
        totalWeight += edge.weight;
        union(rootSource, rootTarget);
      }

      // OPTIMIZACIÓN REALISTA: Kruskal termina cuando tenemos N-1 aristas en el árbol
      if (mstEdges.length === this.graph.nodes.length - 1) {
        break;
      }
    }

    return { mstEdges, totalWeight, edgeProcessOrder };
  }

  /**
   * Algoritmo de Prim (MST)
   * Construye el Árbol de Recubrimiento Mínimo creciendo desde un nodo origen.
   */
  runPrim(startId?: string): { mstEdges: Edge[]; totalWeight: number; edgeProcessOrder: Edge[] } {
    if (this.graph.nodes.length === 0)
      return { mstEdges: [], totalWeight: 0, edgeProcessOrder: [] };

    const startNodeId = startId || this.graph.nodes[0].id;
    const mstEdges: Edge[] = [];
    const edgeProcessOrder: Edge[] = [];
    const visitedNodes = new Set<string>([startNodeId]);
    let totalWeight = 0;

    // Usamos una cola de prioridad simple (array sorted) para las aristas candidatas
    const candidateEdges: Edge[] = [...(this.adjacencyList.get(startNodeId) || [])];

    while (visitedNodes.size < this.graph.nodes.length && candidateEdges.length > 0) {
      // Ordenar por peso (duración con penalización de transbordo)
      candidateEdges.sort((a, b) => {
        const weightA = a.type === 'transfer' ? a.durationMinutes * 2 : a.durationMinutes;
        const weightB = b.type === 'transfer' ? b.durationMinutes * 2 : b.durationMinutes;
        return weightA - weightB;
      });

      const bestEdge = candidateEdges.shift()!;
      edgeProcessOrder.push(bestEdge);

      if (visitedNodes.has(bestEdge.targetId)) continue;

      // Añadir al MST
      mstEdges.push(bestEdge);
      totalWeight += bestEdge.weight;
      visitedNodes.add(bestEdge.targetId);

      // Añadir nuevas aristas candidatas del nuevo nodo visitado
      const newNeighbors = this.adjacencyList.get(bestEdge.targetId) || [];
      for (const edge of newNeighbors) {
        if (!visitedNodes.has(edge.targetId)) {
          candidateEdges.push(edge);
        }
      }
    }

    return { mstEdges, totalWeight, edgeProcessOrder };
  }

  /**
   * Encuentra el camino único entre dos nodos dentro de un Árbol de Recubrimiento Mínimo (MST)
   */
  findPathInMST(startId: string, endId: string, mstEdges: Edge[]): Edge[] {
    // 1. Construir lista de adyacencia bidireccional solo con las aristas del MST
    const mstAdj = new Map<string, Edge[]>();
    for (const e of mstEdges) {
      if (!mstAdj.has(e.sourceId)) mstAdj.set(e.sourceId, []);
      if (!mstAdj.has(e.targetId)) mstAdj.set(e.targetId, []);

      mstAdj.get(e.sourceId)!.push(e);
      // Para navegar en ambas direcciones necesitamos crear la arista inversa visualmente (para la dirección del path)
      mstAdj.get(e.targetId)!.push({
        ...e,
        sourceId: e.targetId,
        targetId: e.sourceId,
        path: e.path ? [...e.path].reverse() : undefined,
      });
    }

    // 2. Búsqueda BFS estándar
    const queue: string[] = [startId];
    const visited = new Set<string>();
    const parent = new Map<string, Edge>();

    visited.add(startId);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === endId) break;

      const neighbors = mstAdj.get(curr) || [];
      for (const edge of neighbors) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          parent.set(edge.targetId, edge);
          queue.push(edge.targetId);
        }
      }
    }

    // 3. Reconstruir el camino desde endId hasta startId
    if (!parent.has(endId)) return []; // No están conectados (raro en un MST completo, a menos que sean disjuntos)

    const path: Edge[] = [];
    let curr = endId;
    while (curr !== startId) {
      const edge = parent.get(curr)!;
      path.unshift(edge);
      curr = edge.sourceId;
    }

    return path;
  }

  /**
   * Genera una trayectoria geodésica con ligeras desviaciones para mayor realismo visual,
   * imitando el comportamiento de los vuelos en el simulador principal.
   */
  private generateGeodesicPath(origin: Point, dest: Point, flightId: string): Point[] {
    const points: Point[] = [];
    const seed = flightId.split('').reduce((acc, char) => acc + (char.codePointAt(0) || 0), 0);

    // Generamos puntos intermedios con desplazamiento pseudo-aleatorio
    const numIntermediate = 6;
    const keyPoints: Point[] = [origin];

    for (let j = 1; j <= numIntermediate; j++) {
      const ratio = j / (numIntermediate + 1);
      const mLat = origin.lat + (dest.lat - origin.lat) * ratio;
      const mLng = origin.lng + (dest.lng - origin.lng) * ratio;

      // Desplazamiento muy sutil para evitar zig-zags excesivos pero dar algo de curvatura
      const offLat = (((seed * j) % 15) / 10 - 0.75) * 0.05;
      const offLng = (((seed * j) % 25) / 10 - 1.25) * 0.05;

      keyPoints.push({ lat: mLat + offLat, lng: mLng + offLng });
    }
    keyPoints.push(dest);

    // Interpolación por tramos para suavizar la línea
    const stepsPerSegment = 12;
    for (let i = 0; i < keyPoints.length - 1; i++) {
      const p1 = keyPoints[i];
      const p2 = keyPoints[i + 1];

      for (let step = 0; step < stepsPerSegment; step++) {
        const f = step / stepsPerSegment;
        points.push(interpolateGreatCircle(p1, p2, f));
      }
    }
    points.push(dest);

    return points;
  }

  /**
   * Ejecuta un algoritmo a través de múltiples puntos (waypoints) en secuencia.
   */
  runMultiPointAlgorithm(
    nodeIds: string[],
    algorithm: 'dijkstra' | 'astar' | 'kruskal' | 'bfs' | 'prim',
    startTimeMinutes: number = 480,
  ): {
    path: Edge[];
    distance: number;
    time: number;
    visitedCount: number;
    segments: {
      from: string;
      to: string;
      distance: number;
      time: number;
      path: Edge[];
      fullResult?: any;
    }[];
  } {
    let totalPath: Edge[] = [];
    let totalDistance = 0;
    let totalTime = 0;
    let totalVisited = 0;
    let currentStartTime = startTimeMinutes;

    const segments: {
      from: string;
      to: string;
      distance: number;
      time: number;
      path: Edge[];
      fullResult?: any;
    }[] = [];

    // Para Kruskal/Prim, pre-calculamos el MST global una vez
    let mstEdges: Edge[] = [];
    if (algorithm === 'kruskal') {
      mstEdges = this.runKruskal().mstEdges;
    } else if (algorithm === 'prim') {
      /* istanbul ignore next */
      mstEdges = this.runPrim(nodeIds[0]).mstEdges;
    }

    for (let i = 0; i < nodeIds.length - 1; i++) {
      const start = nodeIds[i];
      const end = nodeIds[i + 1];
      let result: any;

      if (algorithm === 'dijkstra') {
        result = this.runDijkstra(start, end, currentStartTime);
        segments.push({
          from: start,
          to: end,
          distance: result.distance,
          time: result.time,
          path: result.shortestPath,
          fullResult: result,
        });
        totalPath = [...totalPath, ...result.shortestPath];
        totalDistance += result.distance;
        totalTime += result.time;
        totalVisited += result.visitedOrder.length;
        currentStartTime += result.time;
      } else if (algorithm === 'astar') {
        result = this.runAStar(start, end, currentStartTime);
        segments.push({
          from: start,
          to: end,
          distance: result.distance,
          time: result.time,
          path: result.shortestPath,
          fullResult: result,
        });
        totalPath = [...totalPath, ...result.shortestPath];
        totalDistance += result.distance;
        totalTime += result.time;
        totalVisited += result.visitedOrder.length;
        currentStartTime += result.time;
        /* istanbul ignore next */
      } else if (algorithm === 'kruskal') {
        const path = this.findPathInMST(start, end, mstEdges);
        const distance = path.reduce((acc, e) => acc + e.weight, 0);
        const time = path.reduce((acc, e) => acc + e.durationMinutes, 0);
        segments.push({
          from: start,
          to: end,
          distance,
          time,
          path,
          fullResult: { shortestPath: path, visitedOrder: [] },
        });
        totalPath = [...totalPath, ...path];
        totalDistance += distance;
        totalTime += time;
        totalVisited += this.graph.nodes.length;
        currentStartTime += time;
      } else if (algorithm === 'bfs') {
        result = this.runBFS(start, end, currentStartTime);
        segments.push({
          from: start,
          to: end,
          distance: result.distance,
          time: result.time,
          path: result.shortestPath,
          fullResult: result,
        });
        totalPath = [...totalPath, ...result.shortestPath];
        totalDistance += result.distance;
        totalTime += result.time;
        totalVisited += result.visitedOrder.length;
        currentStartTime += result.time;
        /* istanbul ignore next */
      } else if (algorithm === 'prim') {
        const path = this.findPathInMST(start, end, mstEdges);
        const distance = path.reduce((acc, e) => acc + e.weight, 0);
        const time = path.reduce((acc, e) => acc + e.durationMinutes, 0);
        segments.push({
          from: start,
          to: end,
          distance,
          time,
          path,
          fullResult: { shortestPath: path, visitedOrder: [] },
        });
        totalPath = [...totalPath, ...path];
        totalDistance += distance;
        totalTime += time;
        totalVisited += this.graph.nodes.length;
        currentStartTime += time;
      }
    }

    return {
      path: totalPath,
      distance: totalDistance,
      time: totalTime,
      visitedCount: totalVisited,
      segments,
    };
  }

  private isTransferPossibleByLand(p1: Point, p2: Point): boolean {
    const isInCanarias = (p: Point) => p.lat < 30 && p.lng < -10;
    const isInBaleares = (p: Point) => p.lat > 38 && p.lat < 41 && p.lng > 1;

    const c1 = isInCanarias(p1);
    const c2 = isInCanarias(p2);
    const b1 = isInBaleares(p1);
    const b2 = isInBaleares(p2);

    // Si uno está en Canarias y otro fuera -> AGUA
    if (c1 !== c2) return false;

    // Si uno está en Baleares y otro fuera -> AGUA
    if (b1 !== b2) return false;

    // Si ambos están en Canarias, solo si están muy cerca (misma isla, ej. Tenerife)
    if (c1 && c2) {
      return calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng) < 75;
    }

    // Si ambos están en Baleares, lo mismo
    if (b1 && b2) {
      return calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng) < 30;
    }

    return true;
  }
}

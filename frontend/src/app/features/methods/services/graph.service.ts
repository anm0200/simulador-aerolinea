import { Injectable } from '@angular/core';
import { FlightService } from '../../../core/services/flight.service';

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
  center: Point;
  radius: number; // km
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
   * Lee el archivo GeoJSON y crea un grafo basado estrictamente
   * en los extremos inicial y final de cada vuelo, sin agrupar por distancia.
   */
  async loadGraphFromRealData(clusterRadiusKm: number = 50): Promise<GraphData> {
    try {
      // Nos aseguramos de tener los datos actualizados desde la BD (PostgreSQL)
      await this.flightService.refreshData();
      const scheduledFlights = this.flightService.getScheduledFlights();
      const allAirports = this.flightService.getAirports();

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
          const d = this.calculateDistance(lat, lng, c.lat, c.lng);
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

        const weight = this.calculateDistance(
          startNode.lat,
          startNode.lng,
          endNode.lat,
          endNode.lng,
        );

        const duration = flight.durationMinutes;

        const path: Point[] = [
          { lat: origin.lat, lng: origin.lng },
          { lat: destination.lat, lng: destination.lng },
        ];

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
      // Conectamos nodos cercanos para que el jugador pueda "hacer transbordo"
      // entre vuelos distintos. De lo contrario, los vuelos son líneas aisladas.
      const MAX_TRANSFER_DIST = 500; // km

      const nodesList = this.graph.nodes;
      for (let i = 0; i < nodesList.length; i++) {
        for (let j = i + 1; j < nodesList.length; j++) {
          const n1 = nodesList[i];
          const n2 = nodesList[j];

          const dist = this.calculateDistance(n1.lat, n1.lng, n2.lat, n2.lng);

          if (dist < MAX_TRANSFER_DIST && dist > 0) {
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

  setRestrictedZones(zones: RestrictedZone[]) {
    this.restrictedZones = zones;
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
      for (const zone of this.restrictedZones) {
        const corrected = this.correctPathForZone(edge.path, zone);
        if (corrected) {
          edge.path = corrected;
          edgeAffected = true;
        }
      }

      if (edgeAffected) {
        // ACTUALIZAR PESO con una penalización masiva (x100)
        // Esto asegura que Dijkstra lo evite si hay CUALQUIER otra alternativa
        edge.weight = this.calculatePathDistance(edge.path) * 100;
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
      dist += this.calculateDistance(path[i].lat, path[i].lng, path[i + 1].lat, path[i + 1].lng);
    }
    return dist;
  }

  /**
   * Toma una trayectoria y la "dobla" para que bordee la zona si la atraviesa.
   */
  private correctPathForZone(path: Point[], zone: RestrictedZone): Point[] | null {
    let intersects = false;
    const newPath: Point[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];

      const dist1 = this.calculateDistance(p1.lat, p1.lng, zone.center.lat, zone.center.lng);
      const dist2 = this.calculateDistance(p2.lat, p2.lng, zone.center.lat, zone.center.lng);

      // Si el segmento entra en la zona (o alguno de sus puntos extremos)
      if (dist1 < zone.radius || dist2 < zone.radius) {
        intersects = true;
        const midPoint = this.getArcMidpoint(p1, p2, zone);
        newPath.push(p1);
        newPath.push(midPoint);
      } else {
        // Verificar punto medio del segmento
        const latMid = (p1.lat + p2.lat) / 2;
        const lngMid = (p1.lng + p2.lng) / 2;
        const distMid = this.calculateDistance(latMid, lngMid, zone.center.lat, zone.center.lng);

        if (distMid < zone.radius) {
          intersects = true;
          const midPoint = this.getArcMidpoint(p1, p2, zone);
          newPath.push(p1);
          newPath.push(midPoint);
        } else {
          newPath.push(p1);
        }
      }
    }

    // Evitar duplicados consecutivos
    newPath.push(path[path.length - 1]);
    const cleanPath: Point[] = [];
    for (let i = 0; i < newPath.length; i++) {
      if (
        i === 0 ||
        newPath[i].lat !== newPath[i - 1].lat ||
        newPath[i].lng !== newPath[i - 1].lng
      ) {
        cleanPath.push(newPath[i]);
      }
    }

    return intersects ? cleanPath : null;
  }

  /**
   * Encuentra un punto en el borde del círculo para desviar la ruta.
   */
  private getArcMidpoint(p1: Point, p2: Point, zone: RestrictedZone): Point {
    // Vector desde el centro del círculo hacia el punto medio de p1 y p2
    const latMid = (p1.lat + p2.lat) / 2;
    const lngMid = (p1.lng + p2.lng) / 2;

    const dLat = latMid - zone.center.lat;
    const dLng = lngMid - zone.center.lng;
    const distanceInDegrees = Math.sqrt(dLat * dLat + dLng * dLng);

    // Si el punto medio está justo en el centro (raro), desplazamos ligeramente
    if (distanceInDegrees === 0) {
      return { lat: p1.lat + 0.01, lng: p1.lng + 0.01 };
    }

    // Convertimos el radio de KM a grados aproximados (1 grado ~ 111.32 km)
    const targetDistanceDegrees = (zone.radius + 1) / 111.32;
    const ratio = targetDistanceDegrees / distanceInDegrees;

    return {
      lat: zone.center.lat + dLat * ratio,
      lng: zone.center.lng + dLng * ratio,
    };
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
          // Buscar el horario real del vuelo
          const flight = this.flightService
            .getScheduledFlights()
            .find((f) => f.id === edge.flightId);
          if (flight) {
            const [h, m] = flight.departureTime.split(':').map(Number);
            let depMinutes = h * 60 + m;

            // Si llegamos después de la salida (más conexión), esperar al día siguiente
            const earliestPossibleDeparture = current.time + MIN_CONNECTION_TIME;

            while (depMinutes < earliestPossibleDeparture) {
              depMinutes += 1440;
            }

            const waitTime = depMinutes - current.time;
            edgeCostMinutes = waitTime + edge.durationMinutes;
            arrivalAtTarget = depMinutes + edge.durationMinutes;
          } else {
            edgeCostMinutes = edge.durationMinutes + MIN_CONNECTION_TIME;
            arrivalAtTarget = current.time + edgeCostMinutes;
          }
        } else {
          // --- MEJORA DE REALISMO: PENALIZACIÓN DE TRANSBORDO ---
          // El tiempo terrestre "pesa" más (x2) y tiene un coste fijo de "molestia" (120 min)
          // Esto hace que Dijkstra prefiera esperar un vuelo antes que cruzar el país en bus
          edgeCostMinutes = edge.durationMinutes * 2 + 120;
          arrivalAtTarget = current.time + edge.durationMinutes;
        }

        if (arrivalAtTarget < arrivalTimes.get(edge.targetId)!) {
          // Guardamos el coste "percibido" para la prioridad, pero el tiempo "real" para el reloj
          arrivalTimes.set(edge.targetId, arrivalAtTarget);
          previous.set(edge.targetId, edge);
          // La cola de prioridad usa el tiempo de llegada + penalizaciones acumuladas?
          // Para Dijkstra puro de tiempo, usamos el tiempo de llegada real.
          // Pero para que elija mejor, usamos una métrica de "esfuerzo" en la cola.
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
      const dist = this.calculateDistance(node.lat, node.lng, endNode.lat, endNode.lng);
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
          const flight = this.flightService
            .getScheduledFlights()
            .find((f) => f.id === edge.flightId);
          if (flight) {
            const [h, m] = flight.departureTime.split(':').map(Number);
            let depMinutes = h * 60 + m;
            const earliestPossibleDeparture = arrivalTimes.get(currentId)! + MIN_CONNECTION_TIME;
            while (depMinutes < earliestPossibleDeparture) depMinutes += 1440;
            arrivalAtTarget = depMinutes + edge.durationMinutes;
          } else {
            arrivalAtTarget =
              arrivalTimes.get(currentId)! + edge.durationMinutes + MIN_CONNECTION_TIME;
          }
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

  // Haversine formula to get distance between two points in KM
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Ejecuta un algoritmo a través de múltiples puntos (waypoints) en secuencia.
   */
  runMultiPointAlgorithm(
    nodeIds: string[],
    algorithm: 'dijkstra' | 'astar' | 'kruskal',
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

    // Para Kruskal, pre-calculamos el MST global una vez
    let mstEdges: Edge[] = [];
    if (algorithm === 'kruskal') {
      mstEdges = this.runKruskal().mstEdges;
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
}

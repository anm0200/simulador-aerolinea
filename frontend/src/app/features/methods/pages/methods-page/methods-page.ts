import { Component, ViewChild } from '@angular/core';
import { Header } from '../../../../shared/components/header/header';
import { AlgorithmMap } from '../../components/algorithm-map/algorithm-map';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FooterComponent } from '../../../../shared/components/footer/footer';
import { FlightService } from '../../../../core/services/flight.service';

@Component({
  selector: 'app-methods-page',
  standalone: true,
  imports: [Header, AlgorithmMap, CommonModule, FormsModule, FooterComponent],
  templateUrl: './methods-page.html',
  styleUrl: './methods-page.css',
})
export class MethodsPage {
  @ViewChild(AlgorithmMap) algorithmMap!: AlgorithmMap;

  constructor(private flightService: FlightService) {}
  public restrictionsModeActive = false;
  public restrictionRadius = 100;
  public startTime: string = '08:00';
  public startDate: string = new Date().toISOString().split('T')[0];

  public rallySelectionActive = false;
  public activeMethod = 'none';
  public isGraphLoaded = false;

  clearMap() {
    this.algorithmMap?.clearSelection();
    this.clearRestrictionZones();
    this.selectedZones.clear();
    this.resetDijkstra();
    this.resetKruskal();
    this.aStarPathDetails = [];
    this.aStarDistance = 0;
    this.aStarEstimatedTime = 0;
    this.aStarVisitedCount = 0;
  }

  // Lógica de Zonas Restringidas Predefinidas
  public showZonesPopup = false;
  public predefinedZones: any[] = [];
  public selectedZones: Set<string> = new Set();

  public dijkstraDistance: number | null = null;
  public dijkstraVisitedCount: number | null = null;
  public pathDetails: any[] = [];
  public estimatedTimeHours: number | null = null;

  public kruskalTotalWeight: number | null = null;
  public kruskalEdgeCount: number | null = null;
  public kruskalPathWeight: number | null = null;
  public kruskalPathDetails: any[] = [];
  public kruskalEdgesDetails: any[] = [];

  public aStarDistance: number | null = null;
  public aStarVisitedCount: number | null = null;
  public aStarPathDetails: any[] = [];
  public aStarEstimatedTime: number | null = null;

  // BFS
  public bfsDistance: number | null = null;
  public bfsVisitedCount: number | null = null;
  public bfsPathDetails: any[] = [];
  public bfsEstimatedTime: number | null = null;

  // Prim
  public primTotalWeight: number | null = null;
  public primEdgeCount: number | null = null;
  public primPathWeight: number | null = null;
  public primPathDetails: any[] = [];

  public methodExplanations: Record<string, { title: string; logic: string; usage: string }> = {
    dijkstra: {
      title: 'Algoritmo de Dijkstra',
      logic:
        'Explora todos los caminos posibles desde el origen, expandiéndose en círculos concéntricos hasta encontrar el destino. Garantiza siempre el camino más corto.',
      usage:
        'Ideal cuando necesitas precisión matemática absoluta y no tienes una pista de hacia dónde está el objetivo.',
    },
    aStar: {
      title: 'Algoritmo A* (A-Estrella)',
      logic:
        'Es un "Dijkstra con brújula". Además de la distancia recorrida, usa una función heurística (distancia en línea recta al destino) para priorizar por dónde seguir buscando.',
      usage:
        'Mucho más rápido que Dijkstra en mapas reales. Es el estándar en navegación GPS y videojuegos.',
    },
    kruskal: {
      title: 'Algoritmo de Kruskal',
      logic:
        'No busca un camino entre dos puntos, sino que conecta TODOS los puntos del mapa con el mínimo coste total de infraestructura, evitando ciclos.',
      usage:
        'Perfecto para diseñar redes eléctricas, de fibra óptica o tuberías de suministro con el mínimo material.',
    },
    bfs: {
      title: 'Búsqueda en Anchura (BFS)',
      logic:
        'Explora nivel a nivel. En lugar de buscar la distancia más corta, busca el camino con el menor número de saltos o escalas posibles.',
      usage:
        'Ideal para pasajeros que odian las escalas o cuando todos los vuelos tienen el mismo "coste" pero quieres llegar lo antes posible en términos de paradas.',
    },
    prim: {
      title: 'Algoritmo de Prim',
      logic:
        'Similar a Kruskal, busca el Árbol de Recubrimiento Mínimo, pero lo hace de forma radial desde un punto de origen, expandiéndose a la arista más barata conectada al árbol actual.',
      usage:
        'Útil para planificar la expansión de una red desde un centro logístico (Hub) central hacia el exterior.',
    },
  };

  public totalNodes: number = 0;
  public totalEdges: number = 0;
  public currentRadius: number = 50;

  public nodeToCityMap: Map<string, string> = new Map();

  onGraphLoaded(graph: any) {
    this.isGraphLoaded = true;
    this.totalNodes = graph.nodes.length;
    this.totalEdges = graph.edges.length;

    // Cargar zonas predefinidas desde el servicio
    if (this.algorithmMap) {
      this.predefinedZones = this.algorithmMap.getPredefinedZones();
    }

    // Poblar mapa de nodos a ciudades (o etiquetas legibles)
    this.nodeToCityMap.clear();
    const allAirports = this.algorithmMap?.getAirports() || [];
    for (const node of graph.nodes) {
      const airport = allAirports.find(
        (a: any) => Math.abs(a.lat - node.lat) < 0.01 && Math.abs(a.lng - node.lng) < 0.01,
      );
      if (airport) {
        this.nodeToCityMap.set(node.id, `${airport.city} (${airport.id})`);
      } else {
        this.nodeToCityMap.set(node.id, `Punto (${node.lat.toFixed(2)}, ${node.lng.toFixed(2)})`);
      }
    }
  }

  formatDistance(d: number | null): string {
    if (d === null || d === Infinity) return '--';
    return d.toFixed(2);
  }

  formatTime(h: number | null): string {
    if (h === null || h === Infinity) return '--';
    const totalMinutes = Math.round(h * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  getCityName(nodeId: string): string {
    return this.nodeToCityMap.get(nodeId) || nodeId;
  }

  setMethod(methodKey: string) {
    this.activeMethod = methodKey;
    if (methodKey !== 'dijkstra') {
      this.resetDijkstra();
    }
    if (methodKey !== 'aStar') {
      this.resetAStar();
    }
    if (methodKey !== 'kruskal') {
      this.resetKruskal();
    }
    if (methodKey !== 'bfs') {
      this.resetBFS();
    }
    if (methodKey !== 'prim') {
      this.resetPrim();
    }
  }

  rebuildGraph() {
    this.resetDijkstra();
    this.resetKruskal();
    this.isGraphLoaded = false;
    this.algorithmMap?.loadGraph(this.currentRadius, this.startDate);
  }

  getStartTimeMinutes(): number {
    const [h, m] = this.startTime.split(':').map(Number);
    return h * 60 + m;
  }

  useCurrentTime() {
    const now = new Date();
    this.startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    this.startDate = now.toISOString().split('T')[0];
  }

  runDijkstra() {
    // Solo reseteamos los resultados visuales, NO la selección del mapa
    this.dijkstraDistance = null;
    this.dijkstraVisitedCount = null;
    this.pathDetails = [];
    this.estimatedTimeHours = null;

    this.algorithmMap?.runDijkstra(this.getStartTimeMinutes());
  }

  resetDijkstra() {
    this.dijkstraDistance = null;
    this.dijkstraVisitedCount = null;
    this.pathDetails = [];
    this.estimatedTimeHours = null;
    this.algorithmMap?.clearAnimation();
    this.algorithmMap?.clearAlgorithmResults();
  }

  runKruskal() {
    this.kruskalTotalWeight = null;
    this.kruskalEdgeCount = null;
    this.kruskalPathWeight = null;
    this.kruskalPathDetails = [];
    this.kruskalEdgesDetails = [];
    this.algorithmMap?.runKruskal();
  }

  runAStar() {
    this.aStarDistance = null;
    this.aStarVisitedCount = null;
    this.aStarPathDetails = [];
    this.aStarEstimatedTime = null;

    this.algorithmMap?.runAStar(this.getStartTimeMinutes());
  }

  resetAStar() {
    this.aStarDistance = null;
    this.aStarVisitedCount = null;
    this.aStarPathDetails = [];
    this.aStarEstimatedTime = null;
    this.algorithmMap?.clearAnimation();
    this.algorithmMap?.clearAlgorithmResults();
  }
  resetKruskal() {
    this.kruskalTotalWeight = null;
    this.kruskalEdgeCount = null;
    this.kruskalPathWeight = null;
    this.kruskalPathDetails = [];
    this.kruskalEdgesDetails = [];
    this.algorithmMap?.clearAnimation();
    this.algorithmMap?.clearAlgorithmResults();
  }

  runBFS() {
    this.bfsDistance = null;
    this.bfsVisitedCount = null;
    this.bfsPathDetails = [];
    this.bfsEstimatedTime = null;

    this.algorithmMap?.runBFS(this.getStartTimeMinutes());
  }

  resetBFS() {
    this.bfsDistance = null;
    this.bfsVisitedCount = null;
    this.bfsPathDetails = [];
    this.bfsEstimatedTime = null;
    this.algorithmMap?.clearAnimation();
    this.algorithmMap?.clearAlgorithmResults();
  }

  runPrim() {
    this.primTotalWeight = null;
    this.primEdgeCount = null;
    this.primPathWeight = null;
    this.primPathDetails = [];
    this.algorithmMap?.runPrim();
  }

  resetPrim() {
    this.primTotalWeight = null;
    this.primEdgeCount = null;
    this.primPathWeight = null;
    this.primPathDetails = [];
    this.algorithmMap?.clearAnimation();
    this.algorithmMap?.clearAlgorithmResults();
  }

  toggleRestrictionsMode() {
    this.restrictionsModeActive = !this.restrictionsModeActive;
    if (this.algorithmMap) {
      this.algorithmMap.restrictionsMode = this.restrictionsModeActive;
    }
  }

  clearRestrictionZones() {
    this.algorithmMap?.clearRestrictedZones();
  }

  syncRestrictionRadius() {
    if (this.algorithmMap) {
      this.algorithmMap.restrictionRadius = this.restrictionRadius;
    }
  }

  openZonesPopup() {
    this.showZonesPopup = true;
  }

  closeZonesPopup() {
    this.showZonesPopup = false;
  }

  toggleZoneSelection(zoneId: string) {
    if (this.selectedZones.has(zoneId)) {
      this.selectedZones.delete(zoneId);
    } else {
      this.selectedZones.add(zoneId);
    }
  }

  applyZonesSelection() {
    const zonesToApply = this.predefinedZones.filter((z) => this.selectedZones.has(z.id));
    if (this.algorithmMap) {
      this.algorithmMap.applyPredefinedZones(zonesToApply);
    }
    this.closeZonesPopup();
  }

  toggleRallySelection() {
    this.rallySelectionActive = !this.rallySelectionActive;
    if (this.algorithmMap) {
      this.algorithmMap.isRallyMode = this.rallySelectionActive;
      // Si activamos rally, deseleccionamos origen/destino normal para no confundir
      if (this.rallySelectionActive) {
        this.algorithmMap.resetSelection();
      }
    }
  }

  runRally() {
    let algo: 'dijkstra' | 'astar' | 'kruskal' | 'bfs' | 'prim' = 'dijkstra';
    if (this.activeMethod === 'aStar') algo = 'astar';
    if (this.activeMethod === 'kruskal') algo = 'kruskal';
    if (this.activeMethod === 'bfs') algo = 'bfs';
    if (this.activeMethod === 'prim') algo = 'prim';

    // Asegurarnos de que el método activo sea coherente
    if (this.activeMethod === 'none') {
      this.activeMethod = 'dijkstra';
    }

    this.algorithmMap?.runRallyAlgorithm(algo, this.getStartTimeMinutes());
  }

  clearRally() {
    this.resetDijkstra();
    this.resetAStar();
    this.resetKruskal();
    this.resetBFS();
    this.resetPrim();
    this.algorithmMap?.clearRallySelection();
  }

  getFlightTimes(flightId: string): { departure: string; arrival: string } | null {
    const flight = this.flightService.getScheduledFlights().find((f) => f.id === flightId);
    if (!flight) return null;

    // Calcular llegada aproximada
    const [h, m] = flight.departureTime.split(':').map(Number);
    let arrivalMin = h * 60 + m + flight.durationMinutes;
    const arrivalH = Math.floor(arrivalMin / 60) % 24;
    const arrivalM = arrivalMin % 60;

    return {
      departure: flight.departureTime,
      arrival: `${arrivalH.toString().padStart(2, '0')}:${arrivalM.toString().padStart(2, '0')}`,
    };
  }

  onSimulationFinished(result: {
    distance: number;
    time: number;
    visitedCount: number;
    path: any[];
  }) {
    if (this.activeMethod === 'aStar') {
      this.onAStarFinished(result);
      return;
    }
    if (this.activeMethod === 'bfs') {
      this.onBFSFinished(result);
      return;
    }

    this.dijkstraDistance = result.distance;
    this.dijkstraVisitedCount = result.visitedCount;
    this.estimatedTimeHours = result.time / 60; // Convertir a horas para formateador

    this.pathDetails = this.processPathWithWaits(result.path, this.getStartTimeMinutes());
  }

  onAStarFinished(result: { distance: number; time: number; visitedCount: number; path: any[] }) {
    this.aStarDistance = result.distance;
    this.aStarVisitedCount = result.visitedCount;
    this.aStarEstimatedTime = result.time / 60;

    this.aStarPathDetails = this.processPathWithWaits(result.path, this.getStartTimeMinutes());
  }

  onBFSFinished(result: { distance: number; time: number; visitedCount: number; path: any[] }) {
    this.bfsDistance = result.distance;
    this.bfsVisitedCount = result.visitedCount;
    this.bfsEstimatedTime = result.time / 60;

    this.bfsPathDetails = this.processPathWithWaits(result.path, this.getStartTimeMinutes());
  }

  private processPathWithWaits(path: any[], startMinutes: number): any[] {
    const details: any[] = [];
    let currentClock = startMinutes;
    const baseDate = new Date(this.startDate);

    const formatDate = (minutes: number): string => {
      const date = new Date(baseDate);
      date.setMinutes(date.getMinutes() + (minutes - startMinutes));
      const day = date.getDate().toString().padStart(2, '0');
      const months = [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Sep',
        'Oct',
        'Nov',
        'Dic',
      ];
      return `${day} ${months[date.getMonth()]}`;
    };

    for (let i = 0; i < path.length; i++) {
      const edge = path[i];
      const isFlight = edge.type === 'flight';
      let segmentTime = 0;
      let departureTimeStr = '';
      let arrivalTimeStr = '';

      if (isFlight) {
        const flightTimes = this.getFlightTimes(edge.flightId);
        if (flightTimes) {
          const [depH, depM] = flightTimes.departure.split(':').map(Number);
          let depMin = depH * 60 + depM;

          // La primera espera puede ser larga si el vuelo sale mucho después del start
          const minWait = i === 0 ? 0 : 45;
          while (depMin < currentClock + minWait) depMin += 1440;

          // ¿Hubo espera? (Incluye espera inicial)
          const waitMin = depMin - currentClock;
          if (waitMin > 0) {
            details.push({
              type: 'wait',
              label: i === 0 ? 'Espera Inicial en Aeropuerto' : 'Espera en Aeropuerto',
              sourceName: this.getCityName(edge.sourceId),
              targetName: '',
              distance: 0,
              time: waitMin / 60,
              departureTime: i === 0 ? this.startTime : '',
              arrivalTime: flightTimes.departure,
              dateLabel: formatDate(depMin),
            });
          }

          segmentTime = edge.durationMinutes / 60;
          departureTimeStr = `${flightTimes.departure} (${formatDate(depMin)})`;
          const arrivalClock = depMin + edge.durationMinutes;
          arrivalTimeStr = `${flightTimes.arrival} (${formatDate(arrivalClock)})`;

          currentClock = arrivalClock;
        }
      } else {
        segmentTime = edge.durationMinutes / 60;
        departureTimeStr = `Salida: ${formatDate(currentClock)}`;
        currentClock += edge.durationMinutes;
        arrivalTimeStr = `Llegada: ${formatDate(currentClock)}`;
      }

      details.push({
        type: edge.type,
        label: isFlight ? `Vuelo (${edge.flightId})` : 'Transbordo Terrestre',
        sourceName: this.getCityName(edge.sourceId),
        targetName: this.getCityName(edge.targetId),
        distance: edge.weight,
        time: segmentTime,
        departureTime: departureTimeStr,
        arrivalTime: arrivalTimeStr,
      });
    }
    return details;
  }

  onKruskalFinished(result: {
    totalWeight: number;
    edgeCount: number;
    mstEdges: any[];
    mstPath: any[];
    mstPathWeight: number;
  }) {
    this.kruskalTotalWeight = result.totalWeight;
    this.kruskalEdgeCount = result.edgeCount;
    this.kruskalPathWeight = result.mstPathWeight;

    if (this.activeMethod === 'prim') {
      this.primTotalWeight = result.totalWeight;
      this.primEdgeCount = result.edgeCount;
      this.primPathWeight = result.mstPathWeight;
      this.primPathDetails = this.processMSTPath(result.mstPath);
      return;
    }

    // Procesar desglose del camino MST si hay nodos seleccionados
    this.kruskalPathDetails = this.processMSTPath(result.mstPath);
  }

  private processMSTPath(mstPath: any[]): any[] {
    const details: any[] = [];
    if (mstPath && mstPath.length > 0) {
      for (const edge of mstPath) {
        const isFlight = edge.type === 'flight';
        const timeH = edge.weight / (isFlight ? 800 : 100);

        const flightTimes = isFlight ? this.getFlightTimes(edge.flightId) : null;

        details.push({
          type: edge.type,
          label: isFlight ? `Vuelo MST (${edge.flightId})` : 'Transbordo MST',
          sourceName: this.getCityName(edge.sourceId),
          targetName: this.getCityName(edge.targetId),
          distance: edge.weight,
          time: timeH,
          departureTime: flightTimes?.departure,
          arrivalTime: flightTimes?.arrival,
        });
      }
    }
    return details;
  }
}

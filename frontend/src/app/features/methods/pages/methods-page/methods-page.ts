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

  public rallySelectionActive = false;

  public activeMethod = 'none';
  public isGraphLoaded = false;

  public dijkstraDistance: number | null = null;
  public dijkstraVisitedCount: number | null = null;
  public pathDetails: any[] = [];
  public estimatedTimeHours: number | null = null;

  public kruskalTotalWeight: number | null = null;
  public kruskalEdgeCount: number | null = null;
  public kruskalPathWeight: number | null = null;
  public kruskalPathDetails: any[] = [];
  public kruskalEdgesDetails: any[] = [];

  // Pruebas para A* (similares a Dijkstra)
  public aStarDistance: number | null = null;
  public aStarVisitedCount: number | null = null;
  public aStarPathDetails: any[] = [];
  public aStarEstimatedTime: number | null = null;

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
  };

  public totalNodes: number = 0;
  public totalEdges: number = 0;
  public currentRadius: number = 50;

  public nodeToCityMap: Map<string, string> = new Map();

  onGraphLoaded(graph: any) {
    this.isGraphLoaded = true;
    this.totalNodes = graph.nodes.length;
    this.totalEdges = graph.edges.length;

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
  }

  rebuildGraph() {
    this.resetDijkstra();
    this.resetKruskal();
    this.isGraphLoaded = false;
    this.algorithmMap?.loadGraph(this.currentRadius);
  }

  runDijkstra() {
    this.dijkstraDistance = null;
    this.dijkstraVisitedCount = null;
    this.pathDetails = [];
    this.estimatedTimeHours = null;
    this.algorithmMap?.runDijkstra();
  }

  resetDijkstra() {
    this.dijkstraDistance = null;
    this.dijkstraVisitedCount = null;
    this.pathDetails = [];
    this.estimatedTimeHours = null;
    this.algorithmMap?.resetSelection();
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
    this.algorithmMap?.runAStar();
  }

  resetAStar() {
    this.aStarDistance = null;
    this.aStarVisitedCount = null;
    this.aStarPathDetails = [];
    this.aStarEstimatedTime = null;
    this.algorithmMap?.resetSelection();
  }

  resetKruskal() {
    this.kruskalTotalWeight = null;
    this.kruskalEdgeCount = null;
    this.kruskalPathWeight = null;
    this.kruskalPathDetails = [];
    this.kruskalEdgesDetails = [];
    this.algorithmMap?.resetSelection(); // Limpia también las aristas moradas
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
    let algo: 'dijkstra' | 'astar' | 'kruskal' = 'dijkstra';
    if (this.activeMethod === 'aStar') algo = 'astar';
    if (this.activeMethod === 'kruskal') algo = 'kruskal';

    // Asegurarnos de que el método activo sea coherente
    if (this.activeMethod === 'none') {
      this.activeMethod = 'dijkstra';
    }

    this.algorithmMap?.runRallyAlgorithm(algo);
  }

  clearRally() {
    this.resetDijkstra();
    this.resetAStar();
    this.resetKruskal();
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

  onSimulationFinished(result: { distance: number; visitedCount: number; path: any[] }) {
    if (this.activeMethod === 'aStar') {
      this.onAStarFinished(result);
      return;
    }

    this.dijkstraDistance = result.distance;
    this.dijkstraVisitedCount = result.visitedCount;

    // Procesar desglose de la ruta y tiempo estimado
    this.pathDetails = [];
    let totalTime = 0;

    for (const edge of result.path) {
      const isFlight = edge.type === 'flight';
      const timeH = edge.weight / (isFlight ? 800 : 100);
      totalTime += timeH;

      const flightTimes = isFlight ? this.getFlightTimes(edge.flightId) : null;

      this.pathDetails.push({
        type: edge.type,
        label: isFlight ? `Vuelo (${edge.flightId})` : 'Transbordo Terrestre',
        sourceName: this.getCityName(edge.sourceId),
        targetName: this.getCityName(edge.targetId),
        distance: edge.weight,
        time: timeH,
        departureTime: flightTimes?.departure,
        arrivalTime: flightTimes?.arrival,
      });
    }

    this.estimatedTimeHours = totalTime;
  }

  onAStarFinished(result: { distance: number; visitedCount: number; path: any[] }) {
    this.aStarDistance = result.distance;
    this.aStarVisitedCount = result.visitedCount;
    this.aStarPathDetails = [];
    let totalTime = 0;

    for (const edge of result.path) {
      const isFlight = edge.type === 'flight';
      const timeH = edge.weight / (isFlight ? 800 : 100);
      totalTime += timeH;

      const flightTimes = isFlight ? this.getFlightTimes(edge.flightId) : null;

      this.aStarPathDetails.push({
        type: edge.type,
        label: isFlight ? `Vuelo (${edge.flightId})` : 'Transbordo Terrestre',
        sourceName: this.getCityName(edge.sourceId),
        targetName: this.getCityName(edge.targetId),
        distance: edge.weight,
        time: timeH,
        departureTime: flightTimes?.departure,
        arrivalTime: flightTimes?.arrival,
      });
    }
    this.aStarEstimatedTime = totalTime;
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

    // Procesar desglose del camino MST si hay nodos seleccionados
    this.kruskalPathDetails = [];
    if (result.mstPath && result.mstPath.length > 0) {
      for (const edge of result.mstPath) {
        const isFlight = edge.type === 'flight';
        const timeH = edge.weight / (isFlight ? 800 : 100);

        const flightTimes = isFlight ? this.getFlightTimes(edge.flightId) : null;

        this.kruskalPathDetails.push({
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
  }
}

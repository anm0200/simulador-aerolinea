import {
  Component,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GraphService, GraphData, Node, Edge, RestrictedZone } from '../../services/graph.service';

@Component({
  selector: 'app-algorithm-map',
  standalone: true,
  templateUrl: './algorithm-map.html',
  styleUrl: './algorithm-map.css',
})
export class AlgorithmMap implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true })
  private mapContainerRef!: ElementRef<HTMLDivElement>;

  @Output() simulationFinished = new EventEmitter<{
    distance: number;
    time: number;
    visitedCount: number;
    path: Edge[];
  }>();
  @Output() kruskalFinished = new EventEmitter<{
    totalWeight: number;
    edgeCount: number;
    mstEdges: Edge[];
    mstPath: Edge[];
    mstPathWeight: number;
  }>();
  @Output() graphLoaded = new EventEmitter<GraphData>();

  private map: any;
  private L: any;
  private isBrowser: boolean;

  private graphData: GraphData | null = null;
  private nodeMarkers: Map<string, any> = new Map();
  private edgeLines: any[] = [];

  private selectedStartNode: string | null = null;
  private selectedEndNode: string | null = null;

  // Animación Dijkstra
  private animationTimeouts: any[] = [];
  private explorationLayers: any[] = [];
  private pathLayer: any = null;
  private restrictedZoneLayers: Map<string, any> = new Map();

  private _restrictionsMode = false;
  public get restrictionsMode() {
    return this._restrictionsMode;
  }
  public set restrictionsMode(val: boolean) {
    this._restrictionsMode = val;
    this.updateMapCursor();
  }
  public restrictionRadius = 100; // km
  private zones: RestrictedZone[] = [];

  public isRallyMode = false;
  private rallyPoints: string[] = [];
  private rallyMarkerLayers: any[] = [];

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    @Inject(GraphService) private graphService: GraphService,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;
    this.L = await import('leaflet');
    this.initMap();
    await this.loadGraph();
  }

  ngOnDestroy(): void {
    this.clearAnimation();
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = this.L.map(this.mapContainerRef.nativeElement, {
      center: [40.0, -3.5],
      zoom: 6,
      zoomControl: true,
    });

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(this.map);

    this.map.on('click', (e: any) => this.onMapClick(e));
  }

  public getAirports() {
    return this.graphService.getAirports();
  }

  public getPredefinedZones(): RestrictedZone[] {
    return this.graphService.getPredefinedZones();
  }

  public applyPredefinedZones(zones: RestrictedZone[]): void {
    this.zones = zones;
    this.graphService.setRestrictedZones(this.zones);
    this.renderRestrictedZones();
    this.renderGraph();
  }

  public clearSelection(): void {
    this.selectedStartNode = null;
    this.selectedEndNode = null;
    this.rallyPoints = [];
    this.rallyMarkerLayers.forEach((l) => this.map.removeLayer(l));
    this.rallyMarkerLayers = [];
    this.clearAlgorithmResults();
    this.renderGraph(); // Re-render para quitar los puntos destacados
  }

  public async loadGraph(radiusKm: number = 50, targetDate?: string): Promise<void> {
    if (this.map) {
      this.clearAlgorithmResults();
      for (const line of this.edgeLines) this.map.removeLayer(line);
      this.nodeMarkers.forEach((marker) => this.map.removeLayer(marker));
      this.nodeMarkers.clear();
      this.edgeLines = [];
    }

    this.graphData = await this.graphService.loadGraphFromRealData(radiusKm, targetDate);
    this.graphLoaded.emit(this.graphData);
    this.renderGraph();
  }

  private renderGraph(): void {
    if (!this.graphData || !this.map || !this.L) return;

    const bounds = this.L.latLngBounds([]);

    // --- FIJO: Limpiar capas de aristas anteriores antes de re-renderizar ---
    for (const line of this.edgeLines) {
      if (this.map.hasLayer(line)) this.map.removeLayer(line);
    }
    this.edgeLines = [];

    // Dibujar aristas (Rutas de Vuelo Base)
    // Para no saturar el mapa, podemos dibujar solo en un tono muy sutil
    const renderedEdges = new Set<string>();

    for (const edge of this.graphData.edges) {
      // Evitar pintar A->B y B->A dos veces si comparten trazo
      const edgeKey = [edge.sourceId, edge.targetId].sort().join('-');
      if (renderedEdges.has(edgeKey)) continue;
      renderedEdges.add(edgeKey);

      if (edge.path) {
        const latlngs = edge.path.map((p: any) => [p.lat, p.lng]);

        let polyline: any;
        if (edge.type === 'flight') {
          // Vuelo real (Gris sólido)
          polyline = this.L.polyline(latlngs, {
            color: '#64748b',
            weight: 4,
            opacity: 0.6,
          }).addTo(this.map);
        } else {
          // Transbordo (Gris claro punteado)
          polyline = this.L.polyline(latlngs, {
            color: '#94a3b8',
            weight: 2,
            opacity: 0.3,
            dashArray: '4, 6',
          }).addTo(this.map);
        }

        this.edgeLines.push(polyline);
      }
    }

    // Dibujar nodos (Puntos de inicio y fin)
    for (const node of this.graphData.nodes) {
      bounds.extend([node.lat, node.lng]);

      const marker = this.L.circleMarker([node.lat, node.lng], {
        radius: 5,
        fillColor: '#3b82f6', // blue-500
        color: '#1e3a8a',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(this.map);

      const tooltipContent = `
        <div style="font-family: inherit; padding: 4px;">
          <strong style="color: #1e3a8a; font-size: 1.1rem;">${(node as any).cityName || 'Ciudad'} (${node.id})</strong><br/>
          <span style="color: #64748b; font-size: 0.85rem;">${(node as any).airportName || 'Aeropuerto'}</span><br/>
          <div style="margin-top: 4px; border-top: 1px solid #e2e8f0; padding-top: 4px; font-size: 0.75rem; color: #94a3b8;">
            Coord: ${node.lat.toFixed(2)}, ${node.lng.toFixed(2)}
          </div>
        </div>
      `;
      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        className: 'custom-tooltip',
        offset: [0, -10],
      });

      marker.on('click', () => this.onNodeClick(node.id));

      this.nodeMarkers.set(node.id, marker);
    }

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }

    this.renderRestrictedZones();
  }

  private onMapClick(e: any): void {
    if (this._restrictionsMode) {
      const zoneId = `zone_${Date.now()}`;
      const newZone: RestrictedZone = {
        id: zoneId,
        name: 'Zona Manual',
        type: 'CIRCLE',
        center: { lat: e.latlng.lat, lng: e.latlng.lng },
        radius: this.restrictionRadius,
      };
      this.addRestrictedZone(newZone);
    }
  }

  public addRestrictedZone(zone: RestrictedZone): void {
    this.zones.push(zone);
    this.graphService.setRestrictedZones(this.zones);
    this.renderRestrictedZones();
    // Forzamos un re-render suave del grafo para mostrar rutas corregidas
    this.renderGraph();
  }

  public clearRestrictedZones(): void {
    this.zones = [];
    this.graphService.clearRestrictedZones();
    this.clearAlgorithmResults(); // Limpiar también posibles rutas previas de Dijkstra
    this.renderRestrictedZones();
    this.renderGraph();
  }

  private renderRestrictedZones(): void {
    if (!this.map || !this.L) return;

    // Limpiar capas anteriores
    this.restrictedZoneLayers.forEach((layer) => this.map.removeLayer(layer));
    this.restrictedZoneLayers.clear();

    // Sincronizar con el servicio para mostrar también las de la DB y predefinidas
    this.zones = this.graphService.getRestrictedZones();

    for (const zone of this.zones) {
      let layer: any;

      if (zone.type === 'CIRCLE' && zone.center && zone.radius) {
        layer = this.L.circle([zone.center.lat, zone.center.lng], {
          radius: zone.radius * 1000,
          color: '#ef4444',
          fillColor: '#f87171',
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(this.map);
      } else if (zone.type === 'POLYGON' && zone.points) {
        const latlngs = zone.points.map((p: any) => [p.lat, p.lng]);
        layer = this.L.polygon(latlngs, {
          color: '#ef4444',
          fillColor: '#f87171',
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(this.map);
      }

      if (layer) {
        layer.bindTooltip(
          `${zone.name || 'Zona'} ${zone.upperLimit ? '(' + zone.upperLimit + ')' : ''}`,
        );
        this.restrictedZoneLayers.set(zone.id, layer);
      }
    }
  }

  private updateMapCursor() {
    if (!this.mapContainerRef || !this.isBrowser) return;
    const el = this.mapContainerRef.nativeElement;
    if (this._restrictionsMode) {
      el.classList.add('restrictions-cursor');
    } else {
      el.classList.remove('restrictions-cursor');
    }
  }

  private onNodeClick(nodeId: string): void {
    if (this.animationTimeouts.length > 0) return; // Si está animando, bloquear

    // --- NUEVO: SI ESTAMOS EN MODO RESTRICCIONES, CREAR ZONA EN EL NODO ---
    if (this._restrictionsMode) {
      const node = this.graphData?.nodes.find((n) => n.id === nodeId);
      if (node) {
        const zoneId = `zone_node_${Date.now()}`;
        this.addRestrictedZone({
          id: zoneId,
          name: 'Zona Manual (Nodo)',
          type: 'CIRCLE',
          center: { lat: node.lat, lng: node.lng },
          radius: this.restrictionRadius,
        });
        return;
      }
    }

    // --- NUEVO: SI ESTAMOS EN MODO RALLY (WAYPOINTS), AÑADIR PUNTO ---
    if (this.isRallyMode) {
      if (!this.rallyPoints.includes(nodeId)) {
        this.rallyPoints.push(nodeId);
        this.renderRallyPoints();
      } else {
        // Si ya está, lo quitamos
        this.rallyPoints = this.rallyPoints.filter((id) => id !== nodeId);
        this.renderRallyPoints();
      }
      return;
    }

    const marker = this.nodeMarkers.get(nodeId);

    // Si ya está seleccionado, lo desseleccionamos
    if (this.selectedStartNode === nodeId) {
      this.selectedStartNode = null;
      marker.setStyle({
        fillColor: '#3b82f6',
        radius: 5,
        color: '#1e3a8a',
        weight: 1,
      }); // Reset completo
      return;
    }

    if (this.selectedEndNode === nodeId) {
      this.selectedEndNode = null;
      marker.setStyle({
        fillColor: '#3b82f6',
        radius: 5,
        color: '#1e3a8a',
        weight: 1,
      }); // Reset completo
      return;
    }

    // Selección nueva
    if (!this.selectedStartNode) {
      this.selectedStartNode = nodeId;
      marker.setStyle({ fillColor: '#22c55e', radius: 8 }); // Origen en Verde
    } else if (!this.selectedEndNode) {
      this.selectedEndNode = nodeId;
      marker.setStyle({ fillColor: '#ef4444', radius: 8 }); // Destino en Rojo
    } else {
      // Si ya hay 2, reseteamos el origen y ponemos el nuevo como origen
      const oldStartMarker = this.nodeMarkers.get(this.selectedStartNode);
      if (oldStartMarker) {
        oldStartMarker.setStyle({
          fillColor: '#3b82f6',
          radius: 5,
          color: '#1e3a8a',
          weight: 1,
        });
      }

      this.selectedStartNode = nodeId;
      marker.setStyle({ fillColor: '#22c55e', radius: 8 });

      // Reseteamos rutas anteriores al hacer nueva selección completa
      this.clearAlgorithmResults();
    }
  }

  public runDijkstra(startTimeMinutes: number = 480): void {
    if (!this.selectedStartNode || !this.selectedEndNode) {
      console.warn('Selecciona origen y destino primero');
      return;
    }

    this.clearAnimation();
    this.clearAlgorithmResults();

    const result = this.graphService.runDijkstra(
      this.selectedStartNode,
      this.selectedEndNode,
      startTimeMinutes,
    );

    if (result.distance === Infinity) {
      alert('No hay ruta posible entre estos puntos en los datos actuales.');
      return;
    }

    this.animateExploration(result, '#f59e0b', '#fcd34d'); // Colores de Dijkstra (Naranja/Amarillo)
  }

  public runAStar(startTimeMinutes: number = 480): void {
    if (!this.selectedStartNode || !this.selectedEndNode) {
      console.warn('Selecciona origen y destino primero');
      return;
    }

    this.clearAnimation();
    this.clearAlgorithmResults();

    const result = this.graphService.runAStar(
      this.selectedStartNode,
      this.selectedEndNode,
      startTimeMinutes,
    );

    if (result.distance === Infinity) {
      alert('No hay ruta posible entre estos puntos en los datos actuales.');
      return;
    }

    this.animateExploration(result, '#06b6d4', '#67e8f9'); // Colores de A* (Cian)
  }

  public runKruskal(): void {
    if (!this.graphData || this.graphData.nodes.length === 0) return;

    this.clearAnimation();
    this.clearAlgorithmResults();

    const result = this.graphService.runKruskal();
    this.animateKruskal(result);
  }

  public runPrim(): void {
    if (!this.graphData || this.graphData.nodes.length === 0) return;

    this.clearAnimation();
    this.clearAlgorithmResults();

    const result = this.graphService.runPrim(this.selectedStartNode || undefined);
    this.animateKruskal(result); // Reutilizamos la animación de MST
  }

  public runBFS(startTimeMinutes: number = 480): void {
    if (!this.selectedStartNode || !this.selectedEndNode) {
      console.warn('Selecciona origen y destino primero');
      return;
    }

    this.clearAnimation();
    this.clearAlgorithmResults();

    const result = this.graphService.runBFS(
      this.selectedStartNode,
      this.selectedEndNode,
      startTimeMinutes,
    );

    if (result.distance === Infinity) {
      alert('No hay ruta posible entre estos puntos en los datos actuales.');
      return;
    }

    this.animateExploration(result, '#f59e0b', '#fcd34d'); // Colores de exploración estandarizados (Amarillo/Naranja)
  }

  private animateKruskal(result: any, onComplete?: () => void): void {
    const { mstEdges, totalWeight } = result;
    const ANIMATION_SPEED_MS = 20; // Más rápido porque hay muchas aristas

    // Animamos las aristas que forman parte del MST final
    for (let i = 0; i < mstEdges.length; i++) {
      const edge = mstEdges[i];

      const timeout = setTimeout(() => {
        if (edge.path) {
          const latlngs = edge.path.map((p: any) => [p.lat, p.lng]);

          let color = '#8b5cf6'; // violet-500 para vuelos en MST
          let dashArray = '';

          if (edge.type === 'transfer') {
            color = '#c4b5fd'; // violet aclarado para transbordos MST
            dashArray = '5, 5';
          }

          const expLayer = this.L.polyline(latlngs, {
            color: '#fcd34d', // Amarillo de exploración
            weight: 3,
            opacity: 0.6,
            dashArray: '5, 5',
          }).addTo(this.map);

          this.explorationLayers.push(expLayer);

          // Colorear nodos en naranja durante la "investigación"
          const sourceMarker = this.nodeMarkers.get(edge.sourceId);
          const targetMarker = this.nodeMarkers.get(edge.targetId);
          if (sourceMarker) sourceMarker.setStyle({ fillColor: '#f59e0b' });
          if (targetMarker) targetMarker.setStyle({ fillColor: '#f59e0b' });
        }
      }, i * ANIMATION_SPEED_MS);
      this.animationTimeouts.push(timeout);
    }

    // Al finalizar
    const finalTimeout = setTimeout(() => {
      let mstPath: Edge[] = [];
      let mstPathWeight = 0;

      // --- Limpiar rastro de exploración ---
      for (const layer of this.explorationLayers) {
        this.map.removeLayer(layer);
      }
      this.explorationLayers = [];

      // Dibujar MST final en sólido (Azul/Cian profesional)
      for (const edge of mstEdges) {
        if (edge.path) {
          const latlngs = edge.path.map((p: any) => [p.lat, p.lng]);
          this.L.polyline(latlngs, {
            color: edge.type === 'flight' ? '#2563eb' : '#60a5fa',
            weight: 4,
            opacity: 0.8,
          }).addTo(this.map);
        }
      }

      // Si el usuario seleccionó un origen y destino, resaltamos el camino final
      if (this.selectedStartNode && this.selectedEndNode) {
        mstPath = this.graphService.findPathInMST(
          this.selectedStartNode,
          this.selectedEndNode,
          mstEdges,
        );
        mstPathWeight = mstPath.reduce((acc, edge) => acc + edge.weight, 0);

        // Dibujar camino resaltado en verde
        this.drawShortestPath(mstPath);
      }

      this.kruskalFinished.emit({
        totalWeight,
        edgeCount: mstEdges.length,
        mstEdges,
        mstPath,
        mstPathWeight,
      });

      if (onComplete) onComplete();
    }, mstEdges.length * ANIMATION_SPEED_MS);

    this.animationTimeouts.push(finalTimeout);
  }

  private animateExploration(
    result: any,
    nodeColor: string,
    edgeColor: string,
    onComplete?: () => void,
    additive = false,
  ): void {
    const { visitedOrder, shortestPath, pathMap, distance, time } = result;
    const ANIMATION_SPEED_MS = 20; // Un poco más rápido para rallys

    // Animamos los nodos visitados
    for (let i = 0; i < visitedOrder.length; i++) {
      const nodeId = visitedOrder[i];
      // Ignorar origen y destino para que no pierdan su color
      if (nodeId === this.selectedStartNode || nodeId === this.selectedEndNode) continue;

      const timeout = setTimeout(() => {
        const marker = this.nodeMarkers.get(nodeId);
        if (marker) {
          marker.setStyle({ fillColor: nodeColor });
        }

        // Dibujamos la arista por la que llegamos a este nodo en la exploración
        const edgeToReach = pathMap.get(nodeId);
        if (edgeToReach && edgeToReach.path) {
          const latlngs = edgeToReach.path.map((p: any) => [p.lat, p.lng]);
          const expLayer = this.L.polyline(latlngs, {
            color: edgeColor,
            weight: 3,
            opacity: 0.6,
            dashArray: '5, 5',
          }).addTo(this.map);
          this.explorationLayers.push(expLayer);
        }
      }, i * ANIMATION_SPEED_MS);
      this.animationTimeouts.push(timeout);
    }

    // Al finalizar la exploración, dibujamos la ruta final
    const finalTimeout = setTimeout(() => {
      // --- NUEVO: Limpiar rastro de exploración (línea punteada) ---
      for (const layer of this.explorationLayers) {
        this.map.removeLayer(layer);
      }
      this.explorationLayers = [];

      // --- NUEVO: Resetear colores de nodos explorados a su estado original ---
      visitedOrder.forEach((id: string) => {
        // No resetear si es origen, destino o uno de los puntos principales del rally
        if (
          id !== this.selectedStartNode &&
          id !== this.selectedEndNode &&
          !this.rallyPoints.includes(id)
        ) {
          const marker = this.nodeMarkers.get(id);
          if (marker) {
            marker.setStyle({
              fillColor: '#3b82f6',
              radius: 5,
              color: '#1e3a8a',
            });
          }
        }
      });

      this.drawShortestPath(shortestPath, additive);
      this.simulationFinished.emit({
        distance,
        time,
        visitedCount: visitedOrder.length,
        path: shortestPath,
      });
      if (onComplete) onComplete();
    }, visitedOrder.length * ANIMATION_SPEED_MS);

    this.animationTimeouts.push(finalTimeout);
  }

  private drawShortestPath(shortestPath: Edge[], additive = false): void {
    if (!additive && this.pathLayer) {
      this.map.removeLayer(this.pathLayer);
      this.pathLayer = null;
    }
    const layers: any[] = [];

    // Iterar sobre cada arista del camino mínimo para aplicarle su estilo
    for (const edge of shortestPath) {
      if (edge.path) {
        const latlngs = edge.path.map((p: any) => [p.lat, p.lng]);

        let polyline: any;
        if (edge.type === 'flight') {
          // Vuelo: Trazo continuo verde
          polyline = this.L.polyline(latlngs, {
            color: '#10b981', // emerald-500
            weight: 5,
            opacity: 0.9,
          });
        } else {
          // Transbordo: Trazo punteado/con guiones verde
          polyline = this.L.polyline(latlngs, {
            color: '#10b981',
            weight: 5,
            opacity: 0.9,
            dashArray: '8, 10', // Punteado para diferenciarlos
          });
        }
        layers.push(polyline);
      }
    }

    if (layers.length > 0) {
      // Si es aditivo, añadimos al FeatureGroup existente si existe
      if (additive && this.pathLayer) {
        layers.forEach((l) => this.pathLayer.addLayer(l));
      } else {
        // Si no es aditivo o no existe, creamos uno nuevo
        this.pathLayer = this.L.featureGroup(layers).addTo(this.map);
      }

      // Animamos el zoom hacia el segmento actual (o toda la ruta si no es aditivo)
      this.map.fitBounds(this.pathLayer.getBounds(), { padding: [50, 50], animate: true });
    }
  }

  public clearRallySelection(): void {
    this.rallyPoints = [];
    this.renderRallyPoints();
  }

  private renderRallyPoints(): void {
    if (!this.map || !this.L) return;

    // Limpiar capas anteriores
    for (const layer of this.rallyMarkerLayers) {
      this.map.removeLayer(layer);
    }
    this.rallyMarkerLayers = [];

    // Dibujar cada punto con su índice
    this.rallyPoints.forEach((nodeId, index) => {
      const node = this.graphData?.nodes.find((n) => n.id === nodeId);
      if (node) {
        const icon = this.L.divIcon({
          html: `<div class="rally-point-marker">${index + 1}</div>`,
          className: 'custom-div-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = this.L.marker([node.lat, node.lng], { icon }).addTo(this.map);
        this.rallyMarkerLayers.push(marker);
      }
    });
  }

  public async runRally(startTimeMinutes: number = 480): Promise<void> {
    await this.runRallyAlgorithm('dijkstra', startTimeMinutes);
  }

  public async runRallyAlgorithm(
    algorithm: 'dijkstra' | 'astar' | 'kruskal' | 'bfs' | 'prim',
    startTimeMinutes: number = 480,
  ): Promise<void> {
    if (this.rallyPoints.length < 2) {
      alert('Selecciona al menos 2 puntos para el rally');
      return;
    }

    this.clearAnimation();
    this.clearAlgorithmResults();

    const result = this.graphService.runMultiPointAlgorithm(
      this.rallyPoints,
      algorithm,
      startTimeMinutes,
    );

    // Al empezar un rally, limpiamos todo (incluyendo el pathLayer previo si existe)
    if (this.pathLayer) {
      this.map.removeLayer(this.pathLayer);
      this.pathLayer = null;
    }

    // Animar secuencialmente cada segmento
    await this.animateRallySequentially(result.segments, algorithm);

    // Al finalizar, un fitBounds total si hay ruta
    if (this.pathLayer) {
      this.map.fitBounds(this.pathLayer.getBounds(), { padding: [50, 50], animate: true });
    }

    // Al final del todo, notificamos a la interfaz
    this.simulationFinished.emit({
      distance: result.distance,
      time: result.time,
      visitedCount: result.visitedCount,
      path: result.path,
    });
  }

  private async animateRallySequentially(segments: any[], algorithm: string): Promise<void> {
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const res = segment.fullResult;

      if (algorithm === 'kruskal' || algorithm === 'prim') {
        await new Promise<void>((resolve) => {
          this.animateKruskal(res, resolve);
        });
      } else if (!res.visitedOrder || res.visitedOrder.length === 0) {
        // Fallback para segmentos sin exploración
        this.drawShortestPath(segment.path, true); // Aditivo
        await new Promise((resolve) => setTimeout(resolve, 800));
      } else {
        // Para Dijkstra/A*/BFS, usamos los mismos colores que en sus ejecuciones individuales
        let nodeCol = '#f59e0b'; // Naranja Dijkstra
        let edgeCol = '#fcd34d'; // Amarillo Dijkstra

        if (algorithm === 'astar') {
          nodeCol = '#06b6d4'; // Cian A*
          edgeCol = '#67e8f9'; // A* claro
        } else if (algorithm === 'bfs') {
          nodeCol = '#8b5cf6'; // Púrpura BFS
          edgeCol = '#a78bfa'; // BFS claro
        }

        await new Promise<void>((resolve) => {
          this.animateExploration(
            res,
            nodeCol,
            edgeCol,
            () => {
              resolve();
            },
            true,
          ); // Additive = true
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  public resetSelection(): void {
    this.clearAnimation();
    this.clearAlgorithmResults();

    if (this.selectedStartNode) {
      const marker = this.nodeMarkers.get(this.selectedStartNode);
      if (marker) {
        marker.setStyle({
          fillColor: '#3b82f6',
          radius: 5,
          color: '#1e3a8a',
          weight: 1,
        });
      }
      this.selectedStartNode = null;
    }

    if (this.selectedEndNode) {
      const marker = this.nodeMarkers.get(this.selectedEndNode);
      if (marker) {
        marker.setStyle({
          fillColor: '#3b82f6',
          radius: 5,
          color: '#1e3a8a',
          weight: 1,
        });
      }
      this.selectedEndNode = null;
    }
  }

  public clearAnimation(): void {
    for (const timeout of this.animationTimeouts) {
      clearTimeout(timeout);
    }
    this.animationTimeouts = [];
  }

  public clearAlgorithmResults(): void {
    // Resetear colores explorados
    this.nodeMarkers.forEach((marker, id) => {
      if (id !== this.selectedStartNode && id !== this.selectedEndNode) {
        marker.setStyle({
          fillColor: '#3b82f6',
          radius: 5,
          color: '#1e3a8a',
          weight: 1,
        });
      }
    });

    // Limpiar lineas exploradas
    for (const layer of this.explorationLayers) {
      this.map?.removeLayer(layer);
    }
    this.explorationLayers = [];

    // Limpiar ruta final
    if (this.pathLayer) {
      this.map?.removeLayer(this.pathLayer);
      this.pathLayer = null;
    }
  }
}

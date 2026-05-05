# Especificación Técnica: Motor de Logística Temporal (Temporal Logistics Engine)

Este documento describe la arquitectura lógica, las funciones de coste y los algoritmos de optimización de rutas implementados en el Simulador de Aerolíneas. El motor ha evolucionado de un modelo geométrico estático a un sistema dinámico consciente del tiempo (Time-Aware System).

---

## 1. Modelo de Datos y Grafo Temporal

El sistema modela la red aérea como un **Grafo Dirigido Ponderado en el Tiempo**. 

### 1.1 Definición de Nodos ($V$)
Cada nodo $v \in V$ representa un punto de infraestructura aeroportuaria, definido por:
*   **Identidad**: Código IATA (ej. MAD, LIS).
*   **Geolocalización**: Coordenadas WGS84 para cálculos de distancia Haversine.
*   **Metadatos**: Ciudad y nombre oficial para la resolución de Tooltips en UI.

### 1.2 Definición de Aristas ($E$)
Las aristas representan conexiones entre nodos, clasificadas en:
1.  **Vuelos (`flight`)**: Conexiones basadas en horarios fijos con una duración $d$ predefinida.
2.  **Transbordos (`transfer`)**: Conexiones terrestres dinámicas generadas para garantizar la conectividad de la red (véase sección 3).

---

## 2. Lógica de "Natural Routing" y Función de Coste

Para evitar itinerarios "matemáticamente correctos pero humanamente absurdos", el motor utiliza una **Función de Coste Percibido ($C_p$)** en lugar de simplemente el tiempo cronológico.

### 2.1 Ecuación de Coste para Vuelos
$$C_{flight} = T_{espera} + T_{vuelo} + T_{conexión}$$
*   **$T_{conexión}$**: Constante de seguridad de **45 minutos**. Representa el tiempo mínimo operativo para desembarque y tránsito.

### 2.2 Ecuación de Coste para Transbordos Terrestres (Penalización de Desconfort)
$$C_{transfer} = (T_{tránsito} \times 2) + 120 \text{ min}$$
*   **Factor de Peso ($x2$)**: El tiempo en transporte terrestre se penaliza doblemente para reflejar la preferencia del usuario por el aire.
*   **Hassle Penalty ($+120$ min)**: Penalización fija por la logística de salir de la zona estéril del aeropuerto, traslados a terminales de bus/tren y tiempos de espera de transporte público.

---

## 3. Algoritmos de Optimización

### 3.1 Dijkstra Temporal (Earliest Arrival Path)
Implementación adaptada para la propagación de estados temporales.
*   **Lógica**: En cada nodo, el algoritmo busca la arista que minimice la hora de llegada al destino final.
*   **Propagación de Fecha**: Si la hora de llegada a un nodo $v$ es superior a la hora de salida del próximo vuelo $e$, el algoritmo suma **1440 minutos (24h)** al coste, simulando la espera al vuelo del día siguiente.
*   **Selección de Ruta**: Utiliza un `effortScore` en la cola de prioridad que pondera las penalizaciones de la sección 2.

### 3.2 A-Star ($A^*$) con Heurística Temporal
Utiliza una estimación informada para reducir el espacio de búsqueda.
*   **Función Heurística ($h$)**: $dist(v, dest) / 900 \text{ km/h}$. Se estima el tiempo mínimo posible asumiendo vuelo directo a velocidad de crucero.
*   **Criterio de Selección**: $f(n) = g(n) + h(n)$, donde $g(n)$ es el tiempo real acumulado más las penalizaciones por desconfort.

### 3.3 Kruskal MST (Minimum Spanning Tree) Temporal
Diseña la infraestructura mínima necesaria para conectar todos los puntos de la red.
*   **Métrica de Ponderación**: Se ordenan las aristas por su **duración nominal**.
*   **Filtro de Eficiencia**: Se aplican los factores de desconfort para asegurar que el MST priorice tramos aéreos rápidos sobre conexiones terrestres lentas, incluso si estas últimas son geográficamente más cortas.

---

## 4. Gestión de Itinerarios Complejos (Rally Mode)

El sistema soporta navegación multi-punto secuencial mediante la técnica de **Segmentación Cronológica**:
1.  El itinerario se divide en $n-1$ segmentos independientes.
2.  El estado temporal final del segmento $i$ (hora de llegada) se inyecta como estado inicial del segmento $i+1$.
3.  **Visualización**: El desglose muestra los periodos de **"Espera en Aeropuerto"**, calculados como la diferencia entre la llegada de un tramo y la salida programada del siguiente (incluyendo el margen de 45 min).

---

## 5. Visualización y UX
*   **Tooltips**: Resolución dinámica de nombres de ciudades y aeropuertos para una orientación geográfica intuitiva.
*   **Indicadores Multidía**: Notación `(+1d)` en la interfaz para vuelos que aterrizan o conectan en jornadas posteriores a la de salida.

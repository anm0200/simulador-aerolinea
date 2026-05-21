/**
 * Convierte coordenadas en formato DMS (Grados, Minutos, Segundos) a Grados Decimales.
 * Formato esperado: "351700N" o "0025500W"
 */
export function dmsToDecimal(dms: string): number {
  const match = dms.trim().match(/(\d{2,3})(\d{2})(\d{2})([NSEW])/);
  if (!match) {
    console.warn(`Formato DMS no reconocido: ${dms}`);
    return 0;
  }
  
  const [_, d, m, s, dir] = match;
  let dec = parseInt(d) + parseInt(m) / 60 + parseInt(s) / 3600;
  
  if (dir === 'S' || dir === 'W') {
    dec = -dec;
  }
  
  return dec;
}

/**
 * Comprueba si un punto está dentro de un polígono (Ray Casting Algorithm)
 */
export function isPointInPolygon(point: { lat: number, lng: number }, polygon: { lat: number, lng: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    
    const intersect = ((yi > point.lng) !== (yj > point.lng))
        && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function doesSegmentIntersectPolygon(p1: { lat: number, lng: number }, p2: { lat: number, lng: number }, polygon: { lat: number, lng: number }[]): boolean {
  // 1. Comprobar varios puntos a lo largo del segmento (muestreo)
  // Esto ayuda a detectar si el segmento pasa por dentro de un polígono pequeño
  const samples = 5;
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    const p = { lat: p1.lat + (p2.lat - p1.lat) * f, lng: p1.lng + (p2.lng - p1.lng) * f };
    if (isPointInPolygon(p, polygon)) return true;
  }

  // 2. Comprobar si el segmento intersecta con alguno de los bordes del polígono
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (doSegmentsIntersect(p1, p2, polygon[i], polygon[j])) return true;
  }
  
  return false;
}

function doSegmentsIntersect(a: any, b: any, c: any, d: any): boolean {
  const ccw = (p: any, q: any, r: any) => {
    const val = (q.lat - p.lat) * (r.lng - q.lng) - (q.lng - p.lng) * (r.lat - q.lat);
    if (Math.abs(val) < 1e-9) return 0; // Colineal
    return (val > 0) ? 1 : 2; // Horario o Antihorario
  };

  const o1 = ccw(a, b, c);
  const o2 = ccw(a, b, d);
  const o3 = ccw(c, d, a);
  const o4 = ccw(c, d, b);

  if (o1 !== o2 && o3 !== o4) return true;

  // Casos especiales para segmentos colineales (no críticos para aviación usualmente)
  return false;
}

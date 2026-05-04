export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  type: 'FIX' | 'VOR' | 'NDB';
  city?: string;
}

export interface Airway {
  from: string;
  to: string;
  id: string; // e.g. UN851, UM733
}

export const NAVIGATION_WAYPOINTS: Waypoint[] = [
  // España
  { id: 'ZAMPO', lat: 40.4167, lng: -3.7033, type: 'FIX', city: 'Madrid' },
  { id: 'PUMAL', lat: 41.3851, lng: 2.1734, type: 'FIX', city: 'Barcelona' },
  { id: 'VLC', lat: 39.4699, lng: -0.3763, type: 'VOR', city: 'Valencia' },
  { id: 'AGP', lat: 36.7213, lng: -4.4214, type: 'VOR', city: 'Málaga' },
  { id: 'NANDO', lat: 43.3614, lng: -8.4122, type: 'FIX', city: 'A Coruña' },
  { id: 'PNA', lat: 42.8125, lng: -1.6458, type: 'FIX', city: 'Pamplona' },

  // Francia (Corredor Oeste/Centro)
  { id: 'BIQ', lat: 43.4832, lng: -1.5333, type: 'FIX', city: 'Biarritz' },
  { id: 'BOD', lat: 44.8378, lng: -0.5792, type: 'VOR', city: 'Burdeos' },
  { id: 'NTE', lat: 47.2184, lng: -1.5536, type: 'VOR', city: 'Nantes' },
  { id: 'LGL', lat: 48.8566, lng: 2.3522, type: 'VOR', city: 'Paris' },
  { id: 'MTL', lat: 43.2965, lng: 5.3698, type: 'VOR', city: 'Marseille' },
  { id: 'GVA', lat: 46.2044, lng: 6.1432, type: 'VOR', city: 'Ginebra' },

  // Reino Unido / Benelux
  { id: 'BNN', lat: 51.5074, lng: -0.1278, type: 'VOR', city: 'Londres' },
  { id: 'AMS', lat: 52.3676, lng: 4.9041, type: 'VOR', city: 'Amsterdam' },
  { id: 'BRU', lat: 50.8503, lng: 4.3517, type: 'VOR', city: 'Bruselas' },

  // Alemania / Centroeuropa
  { id: 'FRA', lat: 50.1109, lng: 8.6821, type: 'VOR', city: 'Frankfurt' },
  { id: 'MUC', lat: 48.1351, lng: 11.582, type: 'VOR', city: 'Munich' },
  { id: 'VIE', lat: 48.2082, lng: 16.3738, type: 'VOR', city: 'Viena' },
  { id: 'ZRH', lat: 47.3769, lng: 8.5417, type: 'VOR', city: 'Zurich' },

  // Italia
  { id: 'OST', lat: 41.8919, lng: 12.5113, type: 'VOR', city: 'Roma' },
  { id: 'LIN', lat: 45.4642, lng: 9.19, type: 'VOR', city: 'Milán' },

  // Grecia / Este
  { id: 'ATH_FIX', lat: 37.9838, lng: 23.7275, type: 'FIX', city: 'Atenas' },
  { id: 'SOF_FIX', lat: 42.6977, lng: 23.3219, type: 'FIX', city: 'Sofía' },
  { id: 'BUD_FIX', lat: 47.4979, lng: 19.0402, type: 'FIX', city: 'Budapest' },
];

export const AIRWAY_CONNECTIONS: Airway[] = [
  // Red España
  { from: 'ZAMPO', to: 'PUMAL', id: 'UM190' },
  { from: 'ZAMPO', to: 'VLC', id: 'UN851' },
  { from: 'ZAMPO', to: 'AGP', id: 'UN865' },
  { from: 'VLC', to: 'PNA', id: 'UN857' },
  { from: 'PNA', to: 'BIQ', id: 'UN861' },
  { from: 'PUMAL', to: 'VLC', id: 'UN855' },
  { from: 'PUMAL', to: 'MTL', id: 'UM733' },
  { from: 'PUMAL', to: 'PNA', id: 'UM192' },

  // Conexiones Internacionales (Corredor Oeste)
  { from: 'BIQ', to: 'BOD', id: 'UN863' },
  { from: 'BOD', to: 'NTE', id: 'UN865' },
  { from: 'NTE', to: 'LGL', id: 'UN867' },
  { from: 'BOD', to: 'LGL', id: 'UM135' },

  // Conexiones Internacionales (Corredor Este)
  { from: 'MTL', to: 'LIN', id: 'UM603' },
  { from: 'LIN', to: 'OST', id: 'UM729' },
  { from: 'MTL', to: 'GVA', id: 'UN853' },
  { from: 'GVA', to: 'LGL', id: 'UN869' },
  { from: 'LGL', to: 'BNN', id: 'UN859' },
  { from: 'LGL', to: 'BRU', id: 'UM170' },
  { from: 'BRU', to: 'AMS', id: 'UN872' },
  { from: 'AMS', to: 'FRA', id: 'UM150' },
  { from: 'FRA', to: 'MUC', id: 'UM730' },
  { from: 'MUC', to: 'VIE', id: 'UM858' },
  { from: 'VIE', to: 'BUD_FIX', id: 'UM985' },
  { from: 'BUD_FIX', to: 'SOF_FIX', id: 'UN130' },
  { from: 'SOF_FIX', to: 'ATH_FIX', id: 'UN128' },
  { from: 'OST', to: 'ATH_FIX', id: 'UM731' },
  { from: 'ZRH', to: 'FRA', id: 'UN850' },
  { from: 'ZRH', to: 'MUC', id: 'UN851' },
  { from: 'GVA', to: 'ZRH', id: 'UN852' },
];

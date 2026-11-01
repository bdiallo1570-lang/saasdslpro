// Géographie simplifiée de la route maritime Guangzhou → Conakry. Les tracés sont des contours
// grossiers (longitude, latitude) projetés à plat : ils ne servent qu'à dessiner une carte en
// pointillés, pas à naviguer. Cadre : longitudes -30 → 125, latitudes 40 → -40.
type LonLat = readonly [number, number];

const K = 1000 / 155;
export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = Math.round(80 * K);

export function project([lon, lat]: LonLat): [number, number] {
  return [+((lon + 30) * K).toFixed(1), +((40 - lat) * K).toFixed(1)];
}

function polygon(points: LonLat[]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${project(p).join(',')}`).join('') + 'Z';
}

const AFRICA: LonLat[] = [
  [-17, 21], [-16, 15], [-17, 14.7], [-13.7, 9.5], [-11, 7], [-7.5, 4.5], [-2, 5], [2, 6.3], [5, 4.5],
  [8.7, 4.4], [9.5, 2], [9, -1], [12, -5], [12.5, -9], [13.5, -12], [11.8, -17], [14.5, -23], [16.5, -28.6],
  [18.4, -34.3], [20, -34.8], [25.6, -34], [28, -32.7], [31, -29.5], [32.9, -26], [35.5, -24], [35.3, -21],
  [40.6, -15], [40.5, -10.5], [39.3, -6.8], [41, -1.7], [44, 1.5], [48, 5], [51.3, 11.8], [43.4, 11.6],
  [43, 13], [39, 16], [37.2, 19.6], [35.5, 24], [32.5, 30], [29.5, 31], [25, 31.6], [20, 30.9], [19, 30.3],
  [15.5, 32.3], [11, 33.3], [10.5, 37], [9.7, 37.3], [3, 36.8], [-2, 35.1], [-5.9, 35.8], [-9.7, 30.6],
  [-13, 27.6],
];

const MADAGASCAR: LonLat[] = [[44, -25], [47, -25], [50, -15.5], [49.4, -12], [47, -14], [44, -17], [43.3, -22]];

const ASIA: LonLat[] = [
  [26, 40], [26.2, 38], [27.3, 37], [29, 36.5], [32, 36.1], [36, 36.5], [35.5, 33], [34.2, 31.3], [34.9, 29.5],
  [38.5, 24], [42.5, 16], [43.3, 12.7], [45, 13], [52, 15.6], [55.5, 17.7], [57.8, 19], [59.8, 22.5],
  [56.4, 26.4], [51.6, 24.2], [50.8, 26.5], [48, 29.9], [52, 27.8], [57, 25.7], [61.5, 25.2], [66.6, 25.4],
  [68, 23.7], [70, 22.5], [72.6, 21.4], [72.9, 19], [74.5, 14.6], [76.3, 9.6], [77.5, 8.1], [78.2, 9],
  [80.3, 13.3], [80.1, 15.5], [82.2, 16.7], [86.5, 20], [87, 21.5], [89, 22], [91.8, 22.3], [92.4, 20.7],
  [94.3, 16], [97.6, 16.5], [98.5, 13.1], [98.5, 9], [98.3, 7.8], [100.3, 5.5], [101.3, 2.8], [103.5, 1.3],
  [104.2, 1.4], [103.4, 4], [102.5, 6.1], [100.4, 7.3], [99.2, 9.2], [99.9, 12.6], [100.9, 13.4],
  [102.6, 12.2], [105, 8.6], [106.6, 9.5], [109.2, 11.6], [109.3, 13.4], [108.3, 16], [106.7, 17.4],
  [105.7, 19], [107.4, 21.6], [111, 21.5], [113.3, 22.5], [116.5, 22.9], [119.5, 25.5], [121.5, 28.4],
  [122, 30.8], [121, 32.4], [119.6, 34.5], [120.6, 36.2], [122.5, 37], [121.5, 37.5], [119, 37.2],
  [118, 38.5], [118.5, 40],
];

const ISLANDS: LonLat[][] = [
  [[79.8, 8], [80, 6], [81.8, 7.5], [81, 9.8]], // Sri Lanka
  [[95.3, 5.6], [97.5, 5.2], [100.5, 2], [104.5, -1], [106, -3], [106, -5.9], [104.5, -5.8], [101.5, -3], [98.6, 1.7]], // Sumatra
  [[109, 1.5], [109.6, -1.5], [110.2, -3], [114.5, -4], [116.5, -3.5], [117.9, 1], [119, 5], [117, 7], [115.4, 5], [113, 3.2], [111, 1.7]], // Bornéo
  [[105.2, -6.8], [108, -7.7], [114.5, -8.7], [114.4, -7.8], [110.8, -6.4], [106, -5.9]], // Java
  [[120.1, 23], [121, 21.9], [121.9, 24.6], [121.5, 25.3]], // Taïwan
  [[120, 18.5], [122.2, 18.5], [122.5, 14], [124, 12.5], [125.5, 9.8], [126.5, 7], [125.5, 6], [122, 7], [122.8, 10.8], [120.6, 14.5]], // Philippines
  [[-9, 40], [-9.5, 38.8], [-8.9, 37], [-6, 36.3], [-5.3, 36.1], [-2, 36.7], [0, 38.8], [0, 40]], // Péninsule ibérique
  [[15.6, 40], [16, 38], [15.6, 38], [17, 39], [18.4, 40]], // Sud de l'Italie
  [[20, 40], [21, 38], [22.5, 36.4], [23.2, 38], [24, 40]], // Grèce
];

export const LAND_PATHS = [AFRICA, MADAGASCAR, ASIA, ...ISLANDS].map(polygon);

// Escales et passages notables, dans l'ordre du voyage. `at` = position le long de la route
// (0 → 1), mesurée sur le tracé au premier rendu.
export const WAYPOINTS: { id: string; label: string; detail: string; lonLat: LonLat }[] = [
  { id: 'gz', label: 'Port de Nansha', detail: 'Guangzhou · chargement du conteneur', lonLat: [113.6, 22.6] },
  { id: 'sg', label: 'Détroit de Malacca', detail: 'Singapour', lonLat: [103.6, 1.1] },
  { id: 'lk', label: 'Océan Indien', detail: 'Au large du Sri Lanka', lonLat: [80.5, 4.5] },
  { id: 'cape', label: 'Cap de Bonne-Espérance', detail: 'Pointe de l’Afrique du Sud', lonLat: [18.5, -36] },
  { id: 'gulf', label: 'Golfe de Guinée', detail: 'Remontée de la côte ouest', lonLat: [0, -2] },
  { id: 'cky', label: 'Port autonome de Conakry', detail: 'Déchargement · dédouanement', lonLat: [-13.9, 9.4] },
];

// Route en mer (lissée en courbes) : mer de Chine → Malacca → océan Indien → au sud de
// Madagascar → Cap → remontée de la côte ouest-africaine → Conakry.
const ROUTE: LonLat[] = [
  [113.6, 22.6], [114.5, 19], [111.5, 12], [107.5, 6], [104.6, 1.6], [103.6, 1.1], [100, 3.8], [96.5, 6],
  [88, 5.2], [80.5, 4.5], [70, 0], [58, -12], [48, -27.5], [35, -35.5], [25, -37], [18.5, -36], [12.5, -30],
  [9, -20], [7, -10], [3, -3.5], [0, -2], [-6, 2.5], [-11, 5.5], [-14.3, 7.8], [-13.9, 9.4],
];

// Courbe de Catmull-Rom convertie en segments de Bézier : passe exactement par chaque point.
export const ROUTE_PATH = (() => {
  const p = ROUTE.map(project);
  let d = `M${p[0].join(',')}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6].map((v) => v.toFixed(1));
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6].map((v) => v.toFixed(1));
    d += `C${c1.join(',')} ${c2.join(',')} ${p2.join(',')}`;
  }
  return d;
})();

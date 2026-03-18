import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default marker icons for bundled apps
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Well-known Indian cities with coordinates
const CITY_COORDS = {
  'hyderabad': [17.3850, 78.4867], 'secunderabad': [17.4399, 78.4983],
  'chennai': [13.0827, 80.2707], 'madras': [13.0827, 80.2707],
  'mumbai': [19.0760, 72.8777], 'bombay': [19.0760, 72.8777],
  'delhi': [28.7041, 77.1025], 'new delhi': [28.6139, 77.2090],
  'bangalore': [12.9716, 77.5946], 'bengaluru': [12.9716, 77.5946],
  'kolkata': [22.5726, 88.3639], 'calcutta': [22.5726, 88.3639],
  'pune': [18.5204, 73.8567], 'ahmedabad': [23.0225, 72.5714],
  'jaipur': [26.9124, 75.7873], 'lucknow': [26.8467, 80.9462],
  'vijayawada': [16.5062, 80.6480], 'machilipatnam': [16.1875, 81.1389],
  'rajahmundry': [17.0005, 81.8040], 'rajamahendravaram': [17.0005, 81.8040],
  'visakhapatnam': [17.6868, 83.2185], 'vizag': [17.6868, 83.2185],
  'tirupati': [13.6288, 79.4192], 'guntur': [16.3067, 80.4365],
  'nellore': [14.4426, 79.9865], 'kakinada': [16.9891, 82.2475],
  'warangal': [17.9784, 79.5941], 'kurnool': [15.8281, 78.0373],
  'eluru': [16.7107, 81.0952], 'ongole': [15.5057, 80.0499],
  'srikakulam': [18.2949, 83.8938], 'anantapur': [14.6819, 77.6006],
  'kadapa': [14.4674, 78.8241], 'tenali': [16.2381, 80.6400],
  'mangalore': [12.9141, 74.8560], 'mysore': [12.2958, 76.6394],
  'coimbatore': [11.0168, 76.9558], 'madurai': [9.9252, 78.1198],
  'trichy': [10.7905, 78.7047], 'tiruchirappalli': [10.7905, 78.7047],
  'salem': [11.6643, 78.1460], 'thiruvananthapuram': [8.5241, 76.9366],
  'kochi': [9.9312, 76.2673], 'ernakulam': [9.9816, 76.2999],
  'nagpur': [21.1458, 79.0882], 'indore': [22.7196, 75.8577],
  'bhopal': [23.2599, 77.4126], 'patna': [25.6093, 85.1376],
  'ranchi': [23.3441, 85.3096], 'bhubaneswar': [20.2961, 85.8245],
  'cuttack': [20.4625, 85.8828], 'guwahati': [26.1445, 91.7362],
  'chandigarh': [30.7333, 76.7794], 'amritsar': [31.6340, 74.8723],
  'surat': [21.1702, 72.8311], 'vadodara': [22.3072, 73.1812],
  'rajkot': [22.3039, 70.8022], 'varanasi': [25.3176, 82.9739],
  'agra': [27.1767, 78.0081], 'kanpur': [26.4499, 80.3319],
  'prayagraj': [25.4358, 81.8463], 'allahabad': [25.4358, 81.8463],
  'dehradun': [30.3165, 78.0322], 'shimla': [31.1048, 77.1734],
  'srinagar': [34.0837, 74.7973], 'jammu': [32.7266, 74.8570],
  'thirupathi': [13.6288, 79.4192], 'amaravati': [16.5131, 80.5158],
  'nalgonda': [17.0583, 79.2671], 'nizamabad': [18.6725, 78.0940],
  'karimnagar': [18.4386, 79.1288], 'khammam': [17.2473, 80.1514],
  'amalapuram': [16.5790, 82.0064], 'bhimavaram': [16.5449, 81.5212],
  'tadepalligudem': [16.8145, 81.5269], 'tanuku': [16.7562, 81.6857],
  'narasapur': [16.4346, 81.6966], 'palakollu': [16.5339, 81.7302],
};

function findCoords(place) {
  if (!place) return null;
  const normalized = place.toLowerCase().trim();
  // Exact match
  if (CITY_COORDS[normalized]) return CITY_COORDS[normalized];
  // Partial match
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(city) || city.includes(normalized)) return coords;
  }
  return null;
}

export default function MigrationMap() {
  const { members } = useFamily();
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Build place data
  const placeData = useMemo(() => {
    const places = {};

    members.forEach(m => {
      if (m.pob) {
        const key = m.pob.toLowerCase().trim();
        if (!places[key]) {
          places[key] = { name: m.pob, coords: findCoords(m.pob), members: [], type: 'birth' };
        }
        places[key].members.push(m);
      }

      // Additional locations from locations array
      (m.locations || []).forEach(loc => {
        const key = loc.place.toLowerCase().trim();
        if (!places[key]) {
          const coords = (loc.lat && loc.lng) ? [loc.lat, loc.lng] : findCoords(loc.place);
          places[key] = { name: loc.place, coords, members: [], type: loc.type || 'residence' };
        }
        if (!places[key].members.some(x => x.id === m.id)) {
          places[key].members.push(m);
        }
      });
    });

    return Object.values(places);
  }, [members]);

  const mappablePlaces = placeData.filter(p => p.coords);
  const unmappablePlaces = placeData.filter(p => !p.coords);

  // Migration lines: connect places for members with multiple locations
  const migrationLines = useMemo(() => {
    const lines = [];
    members.forEach(m => {
      const locs = [];
      if (m.pob) {
        const coords = findCoords(m.pob);
        if (coords) locs.push(coords);
      }
      (m.locations || []).forEach(loc => {
        const coords = (loc.lat && loc.lng) ? [loc.lat, loc.lng] : findCoords(loc.place);
        if (coords) locs.push(coords);
      });
      if (locs.length >= 2) {
        lines.push({ positions: locs, name: `${m.firstName} ${m.lastName || ''}` });
      }
    });
    return lines;
  }, [members]);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Migration Map <span className="font-telugu text-lg text-saffron-400">వలస పటం</span></h1>
          <p className="text-stone-500 text-sm mt-1">
            {mappablePlaces.length} places mapped, {unmappablePlaces.length} without coordinates
          </p>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100%-60px)]">
        {/* Map */}
        <div className="flex-1 rounded-xl overflow-hidden border border-stone-200 shadow-sm">
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            className="w-full h-full"
            style={{ height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mappablePlaces.map((place, i) => (
              <Marker key={i} position={place.coords}>
                <Popup>
                  <div className="min-w-[150px]">
                    <p className="font-bold text-sm">{place.name}</p>
                    <p className="text-xs text-gray-500">{place.members.length} member(s)</p>
                    <div className="mt-1 space-y-0.5">
                      {place.members.map(m => (
                        <p key={m.id} className="text-xs">
                          {m.firstName} {m.lastName || ''} {m.isDeceased ? '✦' : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {migrationLines.map((line, i) => (
              <Polyline
                key={i}
                positions={line.positions}
                pathOptions={{ color: '#f59e0b', weight: 2, opacity: 0.6, dashArray: '8,4' }}
              />
            ))}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-100">
            <h3 className="font-semibold text-stone-700 text-sm">Places ({placeData.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {placeData.sort((a, b) => b.members.length - a.members.length).map((place, i) => (
              <button
                key={i}
                onClick={() => setSelectedPlace(place)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                  selectedPlace === place ? 'bg-saffron-50 border border-saffron-200' : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-700 truncate">{place.name}</span>
                  <span className="badge bg-stone-100 text-stone-500 ml-2 flex-shrink-0">{place.members.length}</span>
                </div>
                {!place.coords && <p className="text-[10px] text-amber-500 mt-0.5">No coordinates</p>}
                {selectedPlace === place && (
                  <div className="mt-2 space-y-1">
                    {place.members.map(m => (
                      <Link
                        key={m.id}
                        to={`/members/${m.id}`}
                        className="block text-xs text-saffron-600 hover:text-saffron-700"
                        onClick={e => e.stopPropagation()}
                      >
                        {m.firstName} {m.lastName || ''} {m.isDeceased ? '✦' : ''}
                      </Link>
                    ))}
                  </div>
                )}
              </button>
            ))}

            {placeData.length === 0 && (
              <div className="text-center py-8">
                <p className="text-stone-400 text-sm">No places recorded yet</p>
                <p className="text-stone-300 text-xs mt-1">Add place of birth to members to see them on the map</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

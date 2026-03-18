/**
 * Kundali Grid — South Indian style Rashi chart
 * Auto-generated from existing Raasi data. Zero extra input needed.
 *
 * South Indian chart layout (fixed house positions):
 *  ┌─────┬─────┬─────┬─────┐
 *  │ Mee │ Mes │ Vri │ Mit │
 *  ├─────┼─────┴─────┼─────┤
 *  │ Kum │           │ Kar │
 *  ├─────┤           ├─────┤
 *  │ Mak │           │ Sim │
 *  ├─────┼─────┬─────┼─────┤
 *  │ Dha │ Vrs │ Tul │ Kan │
 *  └─────┴─────┴─────┴─────┘
 */

import { RAASI_LIST } from '../data/vedic';

// South Indian chart: fixed positions for each Raasi
const GRID_POSITIONS = [
  { raasi: 'Meena', row: 0, col: 0 },
  { raasi: 'Mesha', row: 0, col: 1 },
  { raasi: 'Vrishabha', row: 0, col: 2 },
  { raasi: 'Mithuna', row: 0, col: 3 },
  { raasi: 'Kumbha', row: 1, col: 0 },
  { raasi: 'Karka', row: 1, col: 3 },
  { raasi: 'Makara', row: 2, col: 0 },
  { raasi: 'Simha', row: 2, col: 3 },
  { raasi: 'Dhanus', row: 3, col: 0 },
  { raasi: 'Vrischika', row: 3, col: 1 },
  { raasi: 'Tula', row: 3, col: 2 },
  { raasi: 'Kanya', row: 3, col: 3 },
];

// Short labels for the grid
const RAASI_SHORT = {
  'Mesha': 'Mes', 'Vrishabha': 'Vri', 'Mithuna': 'Mit', 'Karka': 'Kar',
  'Simha': 'Sim', 'Kanya': 'Kan', 'Tula': 'Tul', 'Vrischika': 'Vrs',
  'Dhanus': 'Dha', 'Makara': 'Mak', 'Kumbha': 'Kum', 'Meena': 'Mee',
};

export default function KundaliGrid({ raasi, nakshatram, pada, size = 'normal' }) {
  if (!raasi) return null;

  const cellSize = size === 'small' ? 48 : 72;
  const fontSize = size === 'small' ? '8px' : '10px';
  const labelSize = size === 'small' ? '6px' : '8px';

  const raasiInfo = RAASI_LIST.find(r => r.name === raasi);

  return (
    <div>
      <div
        className="inline-grid border border-saffron-300 rounded-lg overflow-hidden bg-saffron-50"
        style={{
          gridTemplateColumns: `repeat(4, ${cellSize}px)`,
          gridTemplateRows: `repeat(4, ${cellSize}px)`,
        }}
      >
        {GRID_POSITIONS.map(pos => {
          const isActive = pos.raasi === raasi;
          const short = RAASI_SHORT[pos.raasi] || pos.raasi.substring(0, 3);
          const info = RAASI_LIST.find(r => r.name === pos.raasi);

          return (
            <div
              key={pos.raasi}
              className={`border border-saffron-200 flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'bg-saffron-500 text-white shadow-inner'
                  : 'bg-white/80 text-stone-500 hover:bg-saffron-50'
              }`}
              style={{
                gridRow: pos.row + 1,
                gridColumn: pos.col + 1,
              }}
              title={`${pos.raasi} (${info?.english || ''})`}
            >
              <span className="font-bold" style={{ fontSize }}>{short}</span>
              {isActive && nakshatram && (
                <span className="mt-0.5 opacity-80" style={{ fontSize: labelSize }}>
                  {nakshatram.substring(0, 4)}{pada ? `-${pada}` : ''}
                </span>
              )}
              {!isActive && (
                <span className="opacity-40" style={{ fontSize: labelSize }}>
                  {info?.english?.substring(0, 3) || ''}
                </span>
              )}
            </div>
          );
        })}

        {/* Center area (2x2 empty space) */}
        <div
          className="border border-saffron-200 bg-gradient-to-br from-saffron-100 to-saffron-50 flex flex-col items-center justify-center"
          style={{
            gridRow: '2 / 4',
            gridColumn: '2 / 4',
          }}
        >
          <span className="text-saffron-700 font-display font-bold" style={{ fontSize: size === 'small' ? '11px' : '14px' }}>
            राशि
          </span>
          <span className="text-saffron-500" style={{ fontSize: size === 'small' ? '8px' : '10px' }}>
            {raasi}
          </span>
          {raasiInfo && (
            <span className="text-saffron-400" style={{ fontSize: size === 'small' ? '7px' : '9px' }}>
              {raasiInfo.english}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

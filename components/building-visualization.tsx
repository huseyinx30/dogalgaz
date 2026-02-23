'use client';

interface BuildingVisualizationProps {
  floorCount: number;
  apartmentsByFloor: number[];
  apartmentsPerFloor?: number;
  shopCount?: number;
  className?: string;
}

/**
 * Bina görseli - sıcak ve okunaklı tasarım
 */
export function BuildingVisualization({
  floorCount,
  apartmentsByFloor,
  apartmentsPerFloor,
  shopCount = 0,
  className = '',
}: BuildingVisualizationProps) {
  const floors = Math.max(1, floorCount);
  const shops = shopCount ?? 0;

  const aptsPerFloorArray: number[] = [];
  for (let i = 0; i < floors; i++) {
    if (apartmentsByFloor && apartmentsByFloor[i] !== undefined && apartmentsByFloor[i] >= 0) {
      aptsPerFloorArray.push(apartmentsByFloor[i]);
    } else if (apartmentsPerFloor != null && apartmentsPerFloor >= 0) {
      aptsPerFloorArray.push(apartmentsPerFloor);
    } else {
      aptsPerFloorArray.push(1);
    }
  }

  const buildingWidth = 250;
  const floorHeight = 50; // Etiket hizası için (bina satırı + gap ile uyumlu)
  const totalFloors = floors + 1; // Katlar + Zemin (her zaman görselde)

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
        {/* Kat etiketleri - çatı+padding hizası için boşluk + 4.Kat...1.Kat, Zemin */}
        <div
          className="flex flex-col pb-2 text-xs font-medium"
          style={{ minHeight: 50 + totalFloors * floorHeight, color: '#78716c' }}
        >
          <div style={{ height: 50 }} />
          {Array.from({ length: floors }).map((_, i) => (
            <div key={i} className="flex items-center shrink-0" style={{ height: floorHeight }}>
              {floors - i}. Kat
            </div>
          ))}
          <div className="flex items-center shrink-0" style={{ height: floorHeight }}>
            Zemin
          </div>
        </div>

        {/* Bina */}
        <div
          className="overflow-visible"
          style={{ width: buildingWidth }}
        >
          {/* Üçgen çatı */}
          <div className="flex justify-center" style={{ marginBottom: -1 }}>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${buildingWidth / 2}px solid transparent`,
                borderRight: `${buildingWidth / 2}px solid transparent`,
                borderBottom: '40px solid #78716c',
              }}
            />
          </div>

          {/* Cephe */}
          <div className="rounded-b-lg overflow-hidden border border-stone-300 bg-stone-100">
            <div className="p-2.5 flex flex-col gap-2">
              {/* Katlar üstten alta: 4.Kat, 3.Kat, 2.Kat, 1.Kat */}
              {Array.from({ length: floors }).map((_, i) => {
                const floorIndex = floors - 1 - i; // i=0 -> en üst kat (4), i=3 -> 1.Kat
                const aptCount = Math.max(1, aptsPerFloorArray[floorIndex] ?? 1);
                return (
                  <div
                    key={`floor-${floorIndex}`}
                    className="flex gap-2"
                    style={{ minHeight: floorHeight - 8 }}
                  >
                    {Array.from({ length: aptCount }).map((_, j) => (
                      <div
                        key={`apt-${floorIndex}-${j}`}
                        className="flex-1 flex items-center justify-center min-w-0 rounded border border-stone-400 bg-sky-200"
                        title={`${floorIndex + 1}. Kat - Daire ${j + 1}`}
                      >
                        <span className="text-sky-900 font-semibold text-sm">{j + 1}</span>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Zemin kat - dükkanlar bu katta, her zaman en altta */}
              <div
                className="flex gap-2 pt-2 border-t-2 border-stone-400"
                style={{ minHeight: floorHeight - 8 }}
              >
                {shops > 0 ? (
                  Array.from({ length: shops }).map((_, i) => (
                    <div
                      key={`shop-${i}`}
                      className="flex-1 flex items-center justify-center min-w-0 rounded border border-stone-500 bg-amber-200"
                      title={`Zemin - Dükkan ${i + 1}`}
                    >
                      <span className="text-amber-900 font-semibold text-xs">Dk</span>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center min-h-[36px] text-stone-400 text-xs italic">
                    Dükkan yok
                  </div>
                )}
              </div>
            </div>

            {/* Taban */}
            <div className="h-3 bg-stone-500" />
          </div>
        </div>
      </div>

      {/* Açıklama */}
      <div className="flex gap-6 mt-4 text-sm text-stone-600">
        <span className="flex items-center gap-2">
          <span className="w-5 h-5 rounded border border-stone-400 bg-sky-200" />
          Daire
        </span>
        {shops > 0 && (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded border border-stone-500 bg-amber-200" />
            Dükkan
          </span>
        )}
      </div>
    </div>
  );
}

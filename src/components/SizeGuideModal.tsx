import React, { useState, useEffect } from 'react';
import { X, Ruler } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

export const SizeGuideModal: React.FC = () => {
  const { isSizeGuideOpen, setIsSizeGuideOpen, gender, theme } = useStore();
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');
  const isAlabaster = theme === 'alabaster';

  useModalBackHandler(isSizeGuideOpen, () => setIsSizeGuideOpen(false), 'size-guide-modal');

  useEffect(() => {
    if (!isSizeGuideOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSizeGuideOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSizeGuideOpen, setIsSizeGuideOpen]);

  if (!isSizeGuideOpen) return null;

  const menSizes = [
    { size: '46 (S)', chestCm: '92 - 96', waistCm: '78 - 82', hipCm: '94 - 98', chestIn: '36 - 38', waistIn: '30 - 32', hipIn: '37 - 38.5' },
    { size: '48 (M)', chestCm: '96 - 100', waistCm: '82 - 86', hipCm: '98 - 102', chestIn: '38 - 40', waistIn: '32 - 34', hipIn: '38.5 - 40' },
    { size: '50 (L)', chestCm: '100 - 104', waistCm: '86 - 90', hipCm: '102 - 106', chestIn: '40 - 42', waistIn: '34 - 36', hipIn: '40 - 42' },
    { size: '52 (XL)', chestCm: '104 - 108', waistCm: '90 - 94', hipCm: '106 - 110', chestIn: '42 - 44', waistIn: '36 - 38', hipIn: '42 - 44' },
    { size: '54 (XXL)', chestCm: '108 - 114', waistCm: '94 - 100', hipCm: '110 - 116', chestIn: '44 - 46', waistIn: '38 - 40', hipIn: '44 - 46' },
    { size: '56 (XXXL)', chestCm: '114 - 120', waistCm: '100 - 106', hipCm: '116 - 122', chestIn: '46 - 48', waistIn: '40 - 42', hipIn: '46 - 48' },
    { size: '58 (XXXXL)', chestCm: '120 - 128', waistCm: '106 - 114', hipCm: '122 - 130', chestIn: '48 - 51', waistIn: '42 - 45', hipIn: '48 - 51' },
  ];

  const womenSizes = [
    { size: '34 (XS)', bustCm: '80 - 84', waistCm: '62 - 66', hipCm: '88 - 92', bustIn: '31.5 - 33', waistIn: '24.5 - 26', hipIn: '34.5 - 36' },
    { size: '36 (S)', bustCm: '84 - 88', waistCm: '66 - 70', hipCm: '92 - 96', bustIn: '33 - 34.5', waistIn: '26 - 27.5', hipIn: '36 - 38' },
    { size: '38 (M)', bustCm: '88 - 92', waistCm: '70 - 74', hipCm: '96 - 100', bustIn: '34.5 - 36', waistIn: '27.5 - 29', hipIn: '38 - 39.5' },
    { size: '40 (L)', bustCm: '92 - 96', waistCm: '74 - 78', hipCm: '100 - 104', bustIn: '36 - 38', waistIn: '29 - 31', hipIn: '39.5 - 41' },
    { size: '42 (XL)', bustCm: '96 - 102', waistCm: '78 - 84', hipCm: '104 - 110', bustIn: '38 - 40', waistIn: '31 - 33', hipIn: '41 - 43.5' },
    { size: '44 (XXL)', bustCm: '102 - 108', waistCm: '84 - 90', hipCm: '110 - 116', bustIn: '40 - 42.5', waistIn: '33 - 35.5', hipIn: '43.5 - 46' },
    { size: '46 (XXXL)', bustCm: '108 - 116', waistCm: '90 - 98', hipCm: '116 - 124', bustIn: '42.5 - 45.5', waistIn: '35.5 - 38.5', hipIn: '46 - 49' },
    { size: '48 (XXXXL)', bustCm: '116 - 124', waistCm: '98 - 106', hipCm: '124 - 132', bustIn: '45.5 - 49', waistIn: '38.5 - 42', hipIn: '49 - 52' },
  ];

  const rows = gender === 'men' ? menSizes : womenSizes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsSizeGuideOpen(false)}
      />

      <div
        className={`relative w-full max-w-2xl border rounded-2xl p-6 sm:p-8 z-10 shadow-2xl animate-fade-in transition-colors duration-200 ${
          isAlabaster
            ? 'bg-[#faf9f5] border-stone-300/80 text-stone-900 shadow-stone-300/20'
            : 'bg-[#121215] border-white/10 text-stone-200 shadow-black/80'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-4 border-b ${
            isAlabaster ? 'border-stone-200' : 'border-white/10'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Ruler className={`w-5 h-5 ${isAlabaster ? 'text-stone-800' : 'text-stone-300'}`} />
            <h3 className={`font-serif text-xl tracking-[0.05em] ${isAlabaster ? 'text-stone-950 font-normal' : 'text-white'}`}>
              {gender === 'men' ? "Men's Sartorial Size Chart" : "Women's Atelier Size Chart"}
            </h3>
          </div>
          <button
            onClick={() => setIsSizeGuideOpen(false)}
            className={`p-1.5 rounded-lg transition-colors ${
              isAlabaster
                ? 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
            aria-label="Close size guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unit Toggle */}
        <div className="flex items-center justify-between py-4">
          <span className={`text-xs tracking-[0.1em] uppercase ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
            Measurements
          </span>
          <div className={`flex p-0.5 rounded-lg border ${isAlabaster ? 'bg-stone-200/60 border-stone-300' : 'bg-white/5 border-white/10'}`}>
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 text-xs rounded-md uppercase font-medium transition-colors ${
                unit === 'cm'
                  ? isAlabaster
                    ? 'drawer-tab-active bg-stone-900 text-white shadow-sm'
                    : 'bg-white text-black'
                  : isAlabaster
                  ? 'text-stone-600 hover:text-stone-900'
                  : 'text-stone-400 hover:text-white'
              }`}
              style={unit === 'cm' && isAlabaster ? { color: '#ffffff', backgroundColor: '#1c1917' } : undefined}
            >
              Centimeters (cm)
            </button>
            <button
              onClick={() => setUnit('in')}
              className={`px-3 py-1 text-xs rounded-md uppercase font-medium transition-colors ${
                unit === 'in'
                  ? isAlabaster
                    ? 'drawer-tab-active bg-stone-900 text-white shadow-sm'
                    : 'bg-white text-black'
                  : isAlabaster
                  ? 'text-stone-600 hover:text-stone-900'
                  : 'text-stone-400 hover:text-white'
              }`}
              style={unit === 'in' && isAlabaster ? { color: '#ffffff', backgroundColor: '#1c1917' } : undefined}
            >
              Inches (in)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto my-4">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className={`border-b uppercase tracking-[0.15em] ${
                isAlabaster ? 'border-stone-200 text-stone-600' : 'border-white/10 text-stone-400'
              }`}>
                <th className="py-3 px-3">Atelier Size</th>
                <th className="py-3 px-3">{gender === 'men' ? 'Chest' : 'Bust'}</th>
                <th className="py-3 px-3">Waist</th>
                <th className="py-3 px-3">Hips</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isAlabaster ? 'divide-stone-200' : 'divide-white/5'}`}>
              {rows.map((row) => (
                <tr key={row.size} className={`transition-colors ${isAlabaster ? 'hover:bg-stone-100/70' : 'hover:bg-white/[0.02]'}`}>
                  <td className={`py-3 px-3 font-medium ${isAlabaster ? 'text-stone-900' : 'text-white'}`}>{row.size}</td>
                  <td className={`py-3 px-3 ${isAlabaster ? 'text-stone-700' : 'text-stone-300'}`}>
                    {gender === 'men'
                      ? unit === 'cm'
                        ? (row as any).chestCm
                        : (row as any).chestIn
                      : unit === 'cm'
                      ? (row as any).bustCm
                      : (row as any).bustIn}
                  </td>
                  <td className={`py-3 px-3 ${isAlabaster ? 'text-stone-700' : 'text-stone-300'}`}>
                    {unit === 'cm' ? row.waistCm : row.waistIn}
                  </td>
                  <td className={`py-3 px-3 ${isAlabaster ? 'text-stone-700' : 'text-stone-300'}`}>
                    {unit === 'cm' ? row.hipCm : row.hipIn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measuring Tip */}
        <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
          isAlabaster
            ? 'bg-stone-100/80 border-stone-200 text-stone-700'
            : 'bg-white/[0.03] border-white/5 text-stone-400'
        }`}>
          <span className={`font-medium block mb-1 uppercase tracking-[0.1em] ${
            isAlabaster ? 'text-stone-900' : 'text-stone-300'
          }`}>
            Atelier Fitting Concierge:
          </span>
          All garments are crafted true to European sartorial standards. For an oversized or relaxed silhouette, we recommend selecting one size above your usual measurement.
        </div>
      </div>
    </div>
  );
};

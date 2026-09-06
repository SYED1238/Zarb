import React, { useState } from 'react';
import { X, Ruler } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

export const SizeGuideModal: React.FC = () => {
  const { isSizeGuideOpen, setIsSizeGuideOpen, gender } = useStore();
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');

  useModalBackHandler(isSizeGuideOpen, () => setIsSizeGuideOpen(false), 'size-guide-modal');

  if (!isSizeGuideOpen) return null;

  const menSizes = [
    { size: '46 (S)', chestCm: '92 - 96', waistCm: '78 - 82', hipCm: '94 - 98', chestIn: '36 - 38', waistIn: '30 - 32', hipIn: '37 - 38.5' },
    { size: '48 (M)', chestCm: '96 - 100', waistCm: '82 - 86', hipCm: '98 - 102', chestIn: '38 - 40', waistIn: '32 - 34', hipIn: '38.5 - 40' },
    { size: '50 (L)', chestCm: '100 - 104', waistCm: '86 - 90', hipCm: '102 - 106', chestIn: '40 - 42', waistIn: '34 - 36', hipIn: '40 - 42' },
    { size: '52 (XL)', chestCm: '104 - 108', waistCm: '90 - 94', hipCm: '106 - 110', chestIn: '42 - 44', waistIn: '36 - 38', hipIn: '42 - 44' },
  ];

  const womenSizes = [
    { size: '34 (XS)', bustCm: '80 - 84', waistCm: '62 - 66', hipCm: '88 - 92', bustIn: '31.5 - 33', waistIn: '24.5 - 26', hipIn: '34.5 - 36' },
    { size: '36 (S)', bustCm: '84 - 88', waistCm: '66 - 70', hipCm: '92 - 96', bustIn: '33 - 34.5', waistIn: '26 - 27.5', hipIn: '36 - 38' },
    { size: '38 (M)', bustCm: '88 - 92', waistCm: '70 - 74', hipCm: '96 - 100', bustIn: '34.5 - 36', waistIn: '27.5 - 29', hipIn: '38 - 39.5' },
    { size: '40 (L)', bustCm: '92 - 96', waistCm: '74 - 78', hipCm: '100 - 104', bustIn: '36 - 38', waistIn: '29 - 31', hipIn: '39.5 - 41' },
  ];

  const rows = gender === 'men' ? menSizes : womenSizes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsSizeGuideOpen(false)}
      />

      <div className="relative w-full max-w-2xl bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 z-10 shadow-2xl animate-fade-in text-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Ruler className="w-5 h-5 text-stone-300" />
            <h3 className="font-serif text-xl tracking-[0.05em] text-white">
              {gender === 'men' ? "Men's Sartorial Size Chart" : "Women's Atelier Size Chart"}
            </h3>
          </div>
          <button
            onClick={() => setIsSizeGuideOpen(false)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/5"
            aria-label="Close size guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unit Toggle */}
        <div className="flex items-center justify-between py-4">
          <span className="text-xs tracking-[0.1em] uppercase text-stone-400">
            Measurements
          </span>
          <div className="flex p-0.5 bg-white/5 rounded-lg border border-white/10">
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 text-xs rounded-md uppercase font-medium transition-colors ${
                unit === 'cm' ? 'bg-white text-black' : 'text-stone-400 hover:text-white'
              }`}
            >
              Centimeters (cm)
            </button>
            <button
              onClick={() => setUnit('in')}
              className={`px-3 py-1 text-xs rounded-md uppercase font-medium transition-colors ${
                unit === 'in' ? 'bg-white text-black' : 'text-stone-400 hover:text-white'
              }`}
            >
              Inches (in)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto my-4">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-white/10 text-stone-400 uppercase tracking-[0.15em]">
                <th className="py-3 px-3">Atelier Size</th>
                <th className="py-3 px-3">{gender === 'men' ? 'Chest' : 'Bust'}</th>
                <th className="py-3 px-3">Waist</th>
                <th className="py-3 px-3">Hips</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr key={row.size} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-medium text-white">{row.size}</td>
                  <td className="py-3 px-3 text-stone-300">
                    {gender === 'men'
                      ? unit === 'cm'
                        ? (row as any).chestCm
                        : (row as any).chestIn
                      : unit === 'cm'
                      ? (row as any).bustCm
                      : (row as any).bustIn}
                  </td>
                  <td className="py-3 px-3 text-stone-300">
                    {unit === 'cm' ? row.waistCm : row.waistIn}
                  </td>
                  <td className="py-3 px-3 text-stone-300">
                    {unit === 'cm' ? row.hipCm : row.hipIn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measuring Tip */}
        <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 text-xs text-stone-400 leading-relaxed">
          <span className="font-medium text-stone-300 block mb-1 uppercase tracking-[0.1em]">
            Atelier Fitting Concierge:
          </span>
          All garments are crafted true to European sartorial standards. For an oversized or relaxed silhouette, we recommend selecting one size above your usual measurement.
        </div>
      </div>
    </div>
  );
};

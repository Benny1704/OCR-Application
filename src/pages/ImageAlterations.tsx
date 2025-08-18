import { useState } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "../hooks/useTheme";

const ImageAlterations = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
    const [rotation, setRotation] = useState<number>(0);
    return (
        <div className="max-w-6xl mx-auto animate-fade-in-up">
            <div className={`p-8 rounded-2xl shadow-lg border transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`}>
                <h2 className={`text-3xl font-bold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Prepare Your Image</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className={`md:col-span-1 p-6 rounded-xl border transition-colors ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Alterations</h3>
                        <div className="space-y-6">
                            <div>
                                <label className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Noise Reduction</label>
                                <button className={`mt-2 w-full py-2 px-4 rounded-lg font-semibold shadow-sm transition-colors ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Apply Filter</button>
                            </div>
                            <div>
                                <label htmlFor="rotation" className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Rotation: {rotation}°</label>
                                <input id="rotation" type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer mt-2 range-thumb-violet ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
                            </div>
                            <div className={`pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                <button onClick={() => navigate('/loading')} className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105">
                                    Submit for Processing
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className={`md:col-span-2 flex items-center justify-center rounded-lg p-4 min-h-[400px] border transition-colors ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                        <img src="https://placehold.co/600x800/e2e8f0/334155?text=Your+Uploaded%5CnInvoice" alt="Uploaded document" className="max-w-full max-h-full object-contain rounded-md shadow-lg" style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s ease' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImageAlterations

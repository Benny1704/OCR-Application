import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, SendHorizontal, WandSparkles, ArrowLeft, ArrowRight, Check, CircleSlash, Plus, Minus } from "lucide-react";
import Loader from "../components/common/Loader";
import * as api from '../lib/api/Api';
import { useToast } from "../hooks/useToast";
import { MockImageBase24 } from "../lib/MockData";
import { containerVariants, itemVariants, imageTransitionVariants } from "../components/common/Animation";

// --- Types ---
interface ImageState {
  initialImageData: string;
  rotation: number;
  noiseReduction: string;
  processedImage: string | null;
  isConfirmed: boolean;
}

// --- Component ---
const ImageAlterations = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [imageStates, setImageStates] = useState<ImageState[]>([]);
  const [[page, direction], setPage] = useState([0, 0]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const images = location.state?.imageData 
      ? (Array.isArray(location.state.imageData) ? location.state.imageData : [location.state.imageData]) 
      : Array(4).fill(MockImageBase24);
      
    setImageStates(images.map((imageData: string) => ({
      initialImageData: imageData,
      rotation: 0,
      noiseReduction: 'None',
      processedImage: null,
      isConfirmed: false,
    })));
  }, [location.state]);

  const noiseOptions: { [key: string]: number } = {
    'None': 0, 'Low': 5, 'Medium': 7, 'High': 9,
  };
  
  const currentIndex = page;

  const updateCurrentState = (newState: Partial<ImageState>) => {
    setImageStates(prevStates =>
      prevStates.map((state, index) =>
        index === currentIndex ? { ...state, ...newState, isConfirmed: false } : state
      )
    );
  };

  const paginate = (newDirection: number) => {
    let newIndex = currentIndex + newDirection;
    if (newIndex < 0) {
      newIndex = imageStates.length - 1;
    } else if (newIndex >= imageStates.length) {
      newIndex = 0;
    }
    setPage([newIndex, newDirection]);
  };
  
  const handleProcess = async () => {
    if (!imageStates[currentIndex]?.initialImageData) {
        addToast({ type: 'error', message: 'No image data to process.' });
        return;
    }

    setIsProcessing(true);
    try {
        const response = await api.alterImage({
            imageData: imageStates[currentIndex].initialImageData,
            rotation: imageStates[currentIndex].rotation,
            noise: noiseOptions[imageStates[currentIndex].noiseReduction],
        }, addToast);

        if (response?.processed_image_base64) {
            updateCurrentState({
              processedImage: `data:image/png;base64,${response.processed_image_base64}`,
            });
            addToast({ type: 'success', message: 'Image processed successfully!' });
            handleReset();
        } else {
            addToast({ type: 'error', message: 'Failed to process image.' });
        }
    } catch (error) {
        console.error("Processing error:", error);
        addToast({ type: 'error', message: 'An error occurred during processing.' });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    const allConfirmed = imageStates.every(state => state.isConfirmed);
    if (!allConfirmed) {
      addToast({ type: 'error', message: 'Please confirm alterations for all images.' });
      return;
    }
    const finalImages = imageStates.map(state => state.processedImage || `data:image/png;base64,${state.initialImageData}`);
    
    setIsSubmitting(true);
    try {
        await api.retryMessage(location.state.messageId, addToast, finalImages);
        addToast({type: 'success', message: 'Document submitted for reprocessing!'});
        navigate('/queue', { state: { defaultTab: 'Failed' } });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    updateCurrentState({ rotation: 0, noiseReduction: 'None' });
  };

  const handleConfirm = () => {
    setImageStates(prev => prev.map((s, i) => i === currentIndex ? {...s, isConfirmed: true} : s));
    addToast({ type: 'success', message: `Image ${currentIndex + 1} confirmed!` });
    if (currentIndex < imageStates.length - 1) {
        paginate(1);
    }
  };
  
  const currentImageState = imageStates[currentIndex];
  if (!currentImageState) return <div className="flex justify-center items-center h-full"><Loader type="ai" /></div>;

  const confirmedCount = imageStates.filter(s => s.isConfirmed).length;
  const allImagesConfirmed = imageStates.length > 0 && confirmedCount === imageStates.length;

  const hasPendingAlterations = currentImageState.rotation !== 0 || currentImageState.noiseReduction !== 'None';
  const canConfirm = !hasPendingAlterations || !!currentImageState.processedImage;

  return (
    <motion.div className="h-full" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className={`h-full p-6 rounded-3xl transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border border-gray-700/50' : 'bg-white border border-gray-200/80'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Controls Panel */}
          <div className={`lg:col-span-1 p-6 rounded-xl flex flex-col justify-between transition-colors ${theme === 'dark' ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <div>
              <h3 className={`text-xl font-semibold mb-8 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Image Adjustments</h3>
              <div className="space-y-8">
                {/* Modern Noise Reduction Control */}
                <div>
                  <label className={`block font-semibold mb-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Noise Reduction</label>
                  <div className={`grid grid-cols-4 gap-1 rounded-lg p-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    {Object.keys(noiseOptions).map(option => (
                        <button 
                            key={option} 
                            onClick={() => updateCurrentState({ noiseReduction: option })}
                            className={`px-2 py-2 text-sm font-semibold rounded-md transition-colors relative ${currentImageState.noiseReduction === option ? 'text-white' : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
                        >
                            <span className="relative z-10">{option}</span>
                             {currentImageState.noiseReduction === option && (
                                <motion.div className="absolute inset-0 bg-violet-600 rounded-md z-0" layoutId="noiseBubble" transition={{type: "spring", stiffness: 350, damping: 30}}/>
                            )}
                        </button>
                    ))}
                  </div>
                </div>
                {/* Modern Rotation Slider */}
                <div>
                    <label className={`font-semibold text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Rotation: <span className="font-bold text-emerald-400">{currentImageState.rotation}°</span></label>
                    <div className="flex items-center gap-3 mt-3">
                        <button onClick={() => updateCurrentState({ rotation: Math.max(-180, currentImageState.rotation - 1)})} className={`p-2 rounded-md ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}><Minus size={16}/></button>
                        <input id="rotation" type="range" min="-180" max="180" value={currentImageState.rotation} onChange={e => updateCurrentState({ rotation: Number(e.target.value) })} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-600" />
                        <button onClick={() => updateCurrentState({ rotation: Math.min(180, currentImageState.rotation + 1)})} className={`p-2 rounded-md ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}><Plus size={16}/></button>
                    </div>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-700/50 space-y-3">
               <div className="flex gap-3">
                    <motion.button onClick={handleProcess} disabled={isProcessing || !hasPendingAlterations} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50" whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                      <WandSparkles className="w-5 h-5"/> Process
                    </motion.button>
                     <motion.button onClick={handleReset} className="w-full bg-gray-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2" whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                       <RefreshCcw className="w-5 h-5"/> Reset
                    </motion.button>
                </div>
                 <motion.button onClick={handleConfirm} disabled={!canConfirm || currentImageState.isConfirmed} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-green-800" whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                  <Check className="w-5 h-5"/> {currentImageState.isConfirmed ? 'Confirmed' : 'Confirm Changes'}
                </motion.button>
            </div>
          </div>

          {/* Image Display & Preview Area */}
          <div className="lg:col-span-2 flex flex-col h-full gap-4">
            <div className={`flex-grow w-full flex items-center justify-center rounded-xl p-4 min-h-[300px] relative overflow-hidden ${theme === 'dark' ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
              <AnimatePresence initial={false} custom={direction}>
                  <motion.img
                      key={page}
                      src={currentImageState.processedImage || `data:image/png;base64,${currentImageState.initialImageData}`}
                      custom={direction}
                      variants={imageTransitionVariants}
                      initial="enter"
                      animate={{
                        ...imageTransitionVariants.center,
                        rotate: currentImageState.rotation,
                        scale: isProcessing ? 0 : 1,
                      }}
                      exit="exit"
                      transition={{ 
                        x: { type: "spring", stiffness: 300, damping: 30 }, 
                        opacity: { duration: 0.2 }, 
                        rotate: { type: "spring", stiffness: 300, damping: 25 },
                        scale: { duration: 0.3 }
                      }}
                      className="max-w-full max-h-full object-contain rounded-md absolute"
                  />
              </AnimatePresence>

              {isProcessing && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <Loader type="ai" />
                </div>
              )}

              {imageStates.length > 1 && (
                <>
                  <motion.button onClick={() => paginate(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full z-20" whileHover={{ backgroundColor: "rgba(0,0,0,0.5)" }} whileTap={{ scale: 0.9 }}> <ArrowLeft /> </motion.button>
                  <motion.button onClick={() => paginate(1)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full z-20" whileHover={{ backgroundColor: "rgba(0,0,0,0.5)"}} whileTap={{ scale: 0.9 }}> <ArrowRight /> </motion.button>
                </>
              )}
            </div>

            <div className={`flex-shrink-0 p-4 rounded-xl flex flex-col gap-3 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <h4 className={`text-sm font-semibold text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                MANDATORY: Confirm each image to proceed
              </h4>
              <div className="w-full">
                <div className="flex justify-center space-x-4 overflow-x-auto py-2 px-4 scrollbar-hide">
                  {imageStates.map((state, index) => (
                    <motion.div
                      key={index}
                      onClick={() => setPage([index, index > currentIndex ? 1 : -1])}
                      className="w-24 h-24 rounded-lg cursor-pointer p-1 relative flex-shrink-0 outline-4 outline-offset-2 outline-violet-500"
                      animate={{ outlineStyle: currentIndex === index ? 'solid' : 'none' }}
                      whileHover={{ scale: 0.95, filter: 'brightness(0.8)' }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <img src={state.processedImage || `data:image/png;base64,${state.initialImageData}`} alt={`thumbnail ${index}`} className="w-full h-full object-cover rounded-md" />
                      <div className="absolute top-1 right-1">
                        {state.isConfirmed ? <Check className="w-5 h-5 bg-green-500 text-white rounded-full p-1"/> : <CircleSlash className="w-5 h-5 bg-red-500 text-white rounded-full p-1"/>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <motion.button 
                  onClick={handleSubmit} 
                  disabled={!allImagesConfirmed || isSubmitting} 
                  className="w-full bg-violet-600 text-white font-bold py-3 px-5 rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                  whileHover={{ y: allImagesConfirmed ? -2 : 0, boxShadow: allImagesConfirmed ? '0px 7px 15px rgba(139, 92, 246, 0.3)' : 'none' }} 
                  whileTap={{ y: 0 }}
              >
                  {isSubmitting ? <Loader type="btnLoader" /> : allImagesConfirmed ? (
                      <>
                        Submit All <SendHorizontal className="w-4 h-4"/>
                      </>
                  ) : (
                      <span>({confirmedCount}/{imageStates.length}) Confirmed</span>
                  )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImageAlterations;
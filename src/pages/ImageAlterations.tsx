import { useState, Fragment, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { motion, type Variants } from "framer-motion";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon, RefreshCcw, SendHorizontal, WandSparkles } from "lucide-react";
import Loader from "../components/common/Loader";
import * as api from '../lib/api/Api';
import { useToast } from "../hooks/useToast";
import { MockImageBase24 } from "../lib/MockData";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" }}
};

const ImageAlterations = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [initialImageData, setInitialImageData] = useState<string | null>(MockImageBase24);
  const [rotation, setRotation] = useState<number>(0);
  const [noiseReduction, setNoiseReduction] = useState<string>('None');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.imageData) {
      setInitialImageData(location.state.imageData);
    }
  }, [location.state]);


  const noiseOptions: { [key: string]: number } = {
    'None': 0,
    'Low': 5,
    'Medium': 7,
    'High': 9,
  };

  const handleProcess = async () => {
    if (!initialImageData) {
        addToast({ type: 'error', message: 'No image data available to process.' });
        return;
    }

    setIsProcessing(true);
    try {
        const response = await api.alterImage({
            imageData: initialImageData,
            rotation,
            noise: noiseOptions[noiseReduction],
        }, addToast);

        if (response && response.processed_image_base64) {
            setProcessedImage(`data:image/png;base64,${response.processed_image_base64}`);
            addToast({ type: 'success', message: 'Image processed successfully!' });
            setRotation(0);
            setNoiseReduction('None');
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

  const handleSubmit = () => {
    navigate('/queue', { state: { processedImage: processedImage || initialImageData } });
  };

  const handleReset = () => {
    setRotation(0);
    setNoiseReduction('None');
    setProcessedImage(null);
  };

  return (
    <motion.div className="h-full" variants={containerVariants} initial="hidden" animate="visible" >
      <motion.div
        variants={itemVariants}
        className={`h-full p-8 rounded-3xl transition-colors ${
          theme === 'dark' ? 'bg-[#1C1C2E] border border-gray-700/50' : 'bg-white border border-gray-200/80'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          
          <motion.div
            variants={itemVariants}
            className={`lg:col-span-1 p-6 rounded-xl transition-colors ${
              theme === 'dark' ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <h3 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              Image Alterations
            </h3>
            <div className="space-y-8">
              
              <div>
                <label className={`block font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Noise Reduction
                </label>
                <Menu as="div" className="relative inline-block text-left w-full">
                  <div>
                    <Menu.Button className={`inline-flex w-full justify-between items-center rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all ${
                        theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-offset-violet-800' : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-4">
                        <i className="fi fi-rr-sparkles"></i>
                        {noiseReduction}
                      </span>
                      <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className={`absolute right-0 mt-2 w-full origin-top-right rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 ${
                        theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                      }`}
                    >
                      <div className="py-1">
                        {Object.keys(noiseOptions).map((option) => (
                          <Menu.Item key={option}>
                            {({ active }) => (
                              <button
                                onClick={() => setNoiseReduction(option)}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                                  active ? 'bg-violet-500 text-white' : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')
                                }`}
                              >
                                {option}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>

              <div>
                <label htmlFor="rotation" className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rotation: <span className="font-bold text-emerald-400">{rotation}°</span>
                </label>
                <input
                  id="rotation"
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer mt-3 slider-thumb ${
                    theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                  }`}
                />
              </div>

              <div className="pt-6 border-t border-gray-700/50 space-y-4">
                <div className="flex gap-4">
                    <motion.button
                      onClick={handleProcess}
                      disabled={isProcessing}
                      className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                      whileHover={{ scale: 1.05, boxShadow: '0px 10px 20px rgba(59, 130, 246, 0.4)' }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Process
                      <WandSparkles className="w-5 h-5"/>
                    </motion.button>
                     <motion.button
                      onClick={handleReset}
                      className="w-full bg-gray-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.05, boxShadow: '0px 10px 20px rgba(107, 114, 128, 0.4)' }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Reset
                      <RefreshCcw className="w-5 h-5"/>
                    </motion.button>
                </div>
                <motion.button
                  onClick={handleSubmit}
                  disabled={!processedImage}
                  className="w-full bg-violet-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  whileHover={{ scale: 1.05, boxShadow: '0px 10px 20px rgba(139, 92, 246, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  Submit
                  <SendHorizontal className="w-4 h-4"/>
                  {/* <Send className="w-5 h-5"/> */}
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className={`lg:col-span-2 flex items-center justify-center rounded-xl p-4 min-h-[400px] transition-colors overflow-hidden ${
              theme === 'dark' ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-100 border border-gray-200'
            }`}
          >
            {isProcessing ? (
              <Loader type="ai" />
            ) : (
              <motion.img
                src={processedImage || `data:image/png;base64,${initialImageData}`}
                alt="Document"
                className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                animate={{ rotate: rotation }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              />
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImageAlterations;
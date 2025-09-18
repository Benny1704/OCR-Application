// src/components/common/Loader.tsx

import BrandLogo from '../../assets/images/RMKV_logo.png';
import '../../assets/styles/Loader.scss';
import { useTheme } from '../../hooks/useTheme';

type LoaderProps = {
  type?: 'ripple' | 'wifi' | 'text' | 'dots' | 'ai' | 'btnLoader';
  text?: string;
};

const AILoader = () => {
    const { theme } = useTheme();
    return (
        <div className={`ai-loader-wrapper ${theme}`}>
            <span className="loader-letter">P</span>
            <span className="loader-letter">r</span>
            <span className="loader-letter">o</span>
            <span className="loader-letter">c</span>
            <span className="loader-letter">e</span>
            <span className="loader-letter">s</span>
            <span className="loader-letter">s</span>
            <span className="loader-letter">i</span>
            <span className="loader-letter">n</span>
            <span className="loader-letter">g</span>

            <div className="loader"></div>
        </div>
    )
};

const BtnLoader = () => (
    <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-white"></div>
);

const RippleLoader = () => (
    <div className="ripple-loader">
        <div style={{ "--i": 1, "--inset": "44%" } as React.CSSProperties} className="box">
            <div className="logo">
                <img src={BrandLogo} alt="Loading..." />
            </div>
        </div>
        <div style={{ "--i": 2, "--inset": "40%" } as React.CSSProperties} className="box"></div>
        <div style={{ "--i": 3, "--inset": "36%" } as React.CSSProperties} className="box"></div>
        <div style={{ "--i": 4, "--inset": "32%" } as React.CSSProperties} className="box"></div>
        <div style={{ "--i": 5, "--inset": "28%" } as React.CSSProperties} className="box"></div>
        <div style={{ "--i": 6, "--inset": "24%" } as React.CSSProperties} className="box"></div>
        <div style={{ "--i": 7, "--inset": "20%" } as React.CSSProperties} className="box"></div>
        <div style={{ "--i": 8, "--inset": "16%" } as React.CSSProperties} className="box"></div>
    </div>
);

const WifiLoader = ({ text }: { text: string }) => (
    <div id="wifi-loader">
        <svg className="circle-outer" viewBox="0 0 86 86">
            <circle className="back" cx="43" cy="43" r="40"></circle>
            <circle className="front" cx="43" cy="43" r="40"></circle>
        </svg>
        <svg className="circle-middle" viewBox="0 0 60 60">
            <circle className="back" cx="30" cy="30" r="27"></circle>
            <circle className="front" cx="30" cy="30" r="27"></circle>
        </svg>
        <svg className="circle-inner" viewBox="0 0 34 34">
            <circle className="back" cx="17" cy="17" r="14"></circle>
            <circle className="front" cx="17" cy="17" r="14"></circle>
        </svg>
        <div className="text" data-text={text}></div>
    </div>
);

const TextLoader = ({ text }: { text: string }) => (
    <div className="loader text-loader">
        <p>{text}</p>
        <div className="words">
            <span className="word">documents</span>
            <span className="word">invoices</span>
            <span className="word">data</span>
            <span className="word">reports</span>
            <span className="word">documents</span>
        </div>
    </div>
);

const DotsLoader = () => (
    <div className="flex flex-col items-center gap-3">
        <svg viewBox="0 0 240 240" height="240" width="240" className="dots-loader">
            <circle strokeLinecap="round" strokeDashoffset="-330" strokeDasharray="0 660" strokeWidth="20" stroke="#000" fill="none" r="105" cy="120" cx="120" className="pl__ring pl__ring--a"></circle>
            <circle strokeLinecap="round" strokeDashoffset="-110" strokeDasharray="0 220" strokeWidth="20" stroke="#000" fill="none" r="35" cy="120" cx="120" className="pl__ring pl__ring--b"></circle>
            <circle strokeLinecap="round" strokeDasharray="0 440" strokeWidth="20" stroke="#000" fill="none" r="70" cy="120" cx="85" className="pl__ring pl__ring--c"></circle>
            <circle strokeLinecap="round" strokeDasharray="0 440" strokeWidth="20" stroke="#000" fill="none" r="70" cy="120" cx="155" className="pl__ring pl__ring--d"></circle>
        </svg>
        {/* <TextLoader text="Loading" /> */}
    </div>
);


const Loader = ({ type = 'ripple', text = "Loading" }: LoaderProps) => {
    if (type === 'ai' || type === 'btnLoader') {
        return type === 'ai' ? <AILoader /> : <BtnLoader />;
    }

    return (
        <div className="loader-container">
            {type === 'ripple' && <RippleLoader />}
            {type === 'wifi' && <WifiLoader text={text} />}
            {type === 'text' && <TextLoader text={text} />}
            {type === 'dots' && <DotsLoader />}
        </div>
    );
};

export default Loader;
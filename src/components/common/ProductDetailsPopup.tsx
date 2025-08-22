// src/components/ProductDetailPopup.tsx
import React from 'react';
import type { ProductDetailPopupProps } from '../../interfaces/Types';
import DataTable from './DataTable'; // Assuming your DataTable is here
import { useTheme } from '../../hooks/useTheme';

// --- Reusable & Styled Sub-Components ---

const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => {
  const { theme } = useTheme();
  return (
    <div className={`flex items-center gap-3 border-b pb-4 mb-6 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
      <div className={`flex-shrink-0 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{icon}</div>
      <h3 className={`text-xl font-semibold tracking-wide ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{title}</h3>
    </div>
  );
};

const InfoField = ({ label, value }: { label: string; value: string | number }) => {
  const { theme } = useTheme();
  return (
    <div>
      <p className={`text-sm font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p className={`mt-1 text-lg font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
};

const SummaryCard = ({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) => {
  const { theme } = useTheme();
  return (
    <div className={`flex items-center gap-4 rounded-lg p-4 ring-1 ring-inset ${theme === 'dark' ? 'bg-black/20 ring-white/10' : 'bg-white ring-slate-200'}`}>
      <div className={`${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{icon}</div>
      <div>
        <p className={`text-base font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      </div>
    </div>
  );
};

const ProductDetailPopup = ({ isOpen, onClose, data }: ProductDetailPopupProps) => {
  const { theme } = useTheme();

  if (!isOpen || !data) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-5xl h-full max-h-[95vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ring-1 
                    ${theme === "dark" ? "bg-[#1C1C2E] text-gray-200 ring-white/10" : "bg-gray-50 text-gray-900 ring-black/5"}
                    transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={e => e.stopPropagation()}
      >
        <header className={`flex-shrink-0 flex justify-between items-start p-6 sm:p-8 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
          <div>
            <p className={`text-base font-medium ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Product Group Details</p>
            <h2 className={`text-4xl sm:text-5xl font-extrabold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {data.product_group}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500
                        ${theme === 'dark' 
                          ? 'text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 focus:ring-offset-[#1C1C2E]' 
                          : 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 focus:ring-offset-gray-50'}`}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <main className="flex-grow overflow-y-auto p-6 sm:p-8">
          <div className="space-y-10">
            {/* <section>
              <SectionHeader icon={<SupplierIcon />} title="Supplier Information" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
                <InfoField label="Byno" value={data.by_no} />
                <InfoField label="PO No" value={data.po_no} />
                <InfoField label="HSN" value={data.hsn_code} />
                <InfoField label="GST" value={`${data.gst_rate}%`} />
                <InfoField label="UOM" value={data.uom} />
                <InfoField label="Description" value={data.supplier_description} />
              </div>
            </section> */}
            
            <section>
              <SectionHeader icon={<ItemsIcon />} title="Item Breakdown" />
              <div className={`rounded-lg p-4 overflow-hidden ring-1 ${theme === 'dark' ? 'ring-white/10' : 'ring-black/5'}`}>
                <DataTable tableData={data.child_products} isEditable={true} isSearchable={true} pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25, 50, 100] }} maxHeight="100%" />
              </div>
            </section>
            
            <section>
              <SectionHeader icon={<SummaryIcon />} title="Quantity Summary" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard label="Total Pcs" value={data.summary.total_pcs} icon={<PiecesIcon />} />
                <SummaryCard label="Entered Pcs" value={data.summary.entered_pcs} icon={<PiecesIcon />} />
                <SummaryCard label="Total Qty" value={data.summary.total_qty} icon={<QuantityIcon />} />
                <SummaryCard label="Entered Qty" value={data.summary.entered_qty} icon={<QuantityIcon />} />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- SVG Icons (can be moved to a separate file, e.g., icons.tsx) ---
const iconProps = { className: "h-7 w-7", strokeWidth: 1.5 };
const SupplierIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.25m11.25 0H21.75m-16.5 0a1.125 1.125 0 01-1.125-1.125V6.75A1.125 1.125 0 012.25 5.625h19.5A1.125 1.125 0 0123 6.75v13.125c0 .621-.504 1.125-1.125 1.125z" /></svg>;
const ItemsIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>;
const SummaryIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const PiecesIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>;
const QuantityIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-6.866-7.711l2.62-10.726m0 0A48.417 48.417 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52M6.25 4.97A48.417 48.417 0 0112 4.5c2.291 0 4.545.16 6.75.47m-13.5 0l-2.62 10.726c-.122.499.106 1.028.589 1.202a5.989 5.989 0 006.866-7.711L6.25 4.97z" /></svg>;

export default ProductDetailPopup;
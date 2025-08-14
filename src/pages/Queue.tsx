import { useEffect, useRef, useState } from 'react';
import '../assets/styles/Queue.scss';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import type { documentQueue } from '../interfaces/Queue.interface';
import type { ColDef } from 'ag-grid-community';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

const Queue = () => {

  const tabs: ('Queued' | 'Processed' | 'Failed')[] = ['Queued', 'Processed', 'Failed'];

  const tabRef = useRef<HTMLUListElement>(null);

  const [activeTab, setActiveTab] = useState<'Queued' | 'Processed' | 'Failed'>('Queued');
  
  const [rowData, setRowData] = useState<documentQueue[]>([
    {
      fileName: "Innovatech_INV-2025-8501.pdf",
      supplier: "Innovatech Solutions",
      invoiceID: "INV-2025-8501",
      irnNumber: "b3c9f2d1e8a7f6b5c4d3e2a1f0b9c8d7",
      invoiceDate: "2025-07-28",
      uploadDate: "2025-07-29"
    },
    {
      fileName: "Invoice_QS-99432.pdf",
      supplier: "Quantum Supplies Ltd.",
      invoiceID: "QS-99432",
      irnNumber: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
      invoiceDate: "2025-07-25",
      uploadDate: "2025-07-25"
    },
    {
      fileName: "ApexLogistics_7651-APX_inv.xml",
      supplier: "Apex Logistics",
      invoiceID: "7651-APX",
      irnNumber: "c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
      invoiceDate: "2025-08-01",
      uploadDate: "2025-08-02"
    },
    {
      fileName: "scan_20250805_1.pdf",
      supplier: "Starlight Office Goods",
      invoiceID: "SOG-2025-034",
      irnNumber: "f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0",
      invoiceDate: "2025-08-05",
      uploadDate: "2025-08-05"
    },
    {
      fileName: "Vertex_Construction_VC-58299.pdf",
      supplier: "Vertex Construction",
      invoiceID: "VC-58299",
      irnNumber: "e9f8d7c6b5a4e3f2d1c0b9a8e7f6d5c4",
      invoiceDate: "2025-08-10",
      uploadDate: "2025-08-11"
    }
  ]);
  const [colDefs, setColDefs] = useState<ColDef<documentQueue>[]>([
      { field: "fileName", filter: true, floatingFilter: true },
      { field: "supplier", filter: true, floatingFilter: true },
      { field: "invoiceID", filter: true, floatingFilter: true },
      { field: "irnNumber", filter: true, floatingFilter: true },
      { field: "invoiceDate", filter: true, floatingFilter: true },
      { field: "uploadDate", filter: true, floatingFilter: true }
  ]);

  useEffect(() => {
    if (tabRef.current) {
      const activeLi = tabRef.current.querySelector('.nav-item.active') as HTMLElement;
      
      if (activeLi) {
        tabRef.current.style.setProperty('--position-y-active', `${activeLi.offsetTop}px`);
        tabRef.current.style.setProperty('--position-x-active', `${activeLi.offsetLeft}px`);
        // tabRef.current.style.setProperty('--width-active', `${activeLi.clientWidth}px`);
        // tabRef.current.style.setProperty('--height-active', `${activeLi.clientHeight}px`);
      }
    }
  }, [activeTab]);

  return (
    <div className="queue-container">
      <h1>Document Queue</h1>

      <div className="tab-container">
        <div className="header">
          <div className="left-shape">
            <h1>{activeTab} Invoices</h1>
          </div>
          <div className="tabs">
            <ul ref={tabRef}>
              {tabs.map((tab) => 
                <li className={activeTab === tab ? "nav-item active" : "nav-item"} onClick={() => setActiveTab(tab)}>
                  <span className="dot"></span>
                  <p className="text">{tab}</p>
                </li>
              )}
              <div className="tab-effect"></div>
            </ul>
          </div>
          <div className="right-shape"></div>
        </div>
        <div className="content">
          <AgGridReact rowData={rowData} columnDefs={colDefs} />
        </div>
      </div>
    </div>
  )
}

export default Queue
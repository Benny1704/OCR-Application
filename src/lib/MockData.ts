import type { Log, Document, ExtractedData } from "../interfaces/Types";
export const mockLogs: Log[] = [
  {
    id: 1,
    timestamp: "2024-08-01 10:05:14",
    user: "admin@nextriq",
    action: "LOGIN_SUCCESS",
    details: "User logged in successfully.",
  },
  {
    id: 2,
    timestamp: "2024-08-01 10:06:22",
    user: "admin@nextriq",
    action: "UPLOAD_DOCUMENT",
    details: "Uploaded file: invoice_ACME_123.pdf",
  },
  {
    id: 3,
    timestamp: "2024-08-01 10:07:01",
    user: "admin@nextriq",
    action: "DATA_VERIFIED",
    details: "Verified data for invoice_ACME_123.pdf",
  },
];
export const initialMockDocuments: Document[] = [
    {
        id: 1,
        name: "Invoice_TECH_0818.pdf",
        supplierName: "Tech Solutions Inc.",
        status: "Queued",
        uploadDate: "2025-08-18 10:30 AM",
        invoiceDate: "2025-08-15",
        size: "256 KB",
        edited: false,
        isPriority: false,
        uploadedBy:"admin"
      },
      {
        id: 2,
        name: "Catering_Service_Bill.pdf",
        supplierName: "Gourmet Catering",
        status: "Queued",
        uploadDate: "2025-08-19 09:15 AM",
        invoiceDate: "2025-08-17",
        size: "420 KB",
        edited: false,
        isPriority: true, // This one will be processed first
        uploadedBy:"admin"
      },
      {
        id: 3,
        name: "Hardware_Purchase_Receipt.jpg",
        supplierName: "Global Hardware Co.",
        status: "Queued",
        uploadDate: "2025-08-17 03:45 PM",
        invoiceDate: "2025-08-17",
        size: "1.2 MB",
        edited: false,
        isPriority: false,
        uploadedBy:"admin"
      },
    
      // --- Processed Documents ---
      {
        id: 4,
        name: "Consulting_Fee_INV-001.pdf",
        supplierName: "Apex Consultants",
        status: "Processed",
        uploadDate: "2025-08-16 11:00 AM",
        invoiceDate: "2025-08-12",
        size: "310 KB",
        edited: true,
        isPriority: false,
        invoiceId: "INV-APX-0812",
        irnNumber: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
        uploadedBy:"admin"
      },
      {
        id: 5,
        name: "Office_Rent_July.pdf",
        supplierName: "City Real Estate",
        status: "Processed",
        uploadDate: "2025-08-15 01:20 PM",
        invoiceDate: "2025-08-01",
        size: "95 KB",
        edited: false,
        isPriority: false,
        invoiceId: "INV-CRE-0801",
        irnNumber: "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4",
        uploadedBy:"admin"
      },
      {
        id: 6,
        name: "Logistics_Shipment_789.pdf",
        supplierName: "Swift Logistics",
        status: "Processed",
        uploadDate: "2025-08-14 04:55 PM",
        invoiceDate: "2025-08-11",
        size: "640 KB",
        edited: true,
        isPriority: false,
        invoiceId: "INV-SL-0811",
        irnNumber: "f1e2d3c4b5a69876543210g1h2i3j4k5",
        uploadedBy:"admin"
      },
    
      // --- Failed Documents ---
      {
        id: 7,
        name: "Scanned_Receipt_Blurry.jpg",
        supplierName: "Unknown",
        status: "Failed",
        uploadDate: "2025-08-13 08:05 AM",
        invoiceDate: "2025-08-10",
        size: "2.1 MB",
        edited: false,
        isPriority: false,
        errorMessage: "OCR engine failed. Image quality is too low to read text.",
        uploadedBy:"admin"
      },
      {
        id: 8,
        name: "Unsupported_Format.tiff",
        supplierName: "Creative Supplies",
        status: "Failed",
        uploadDate: "2025-08-12 02:00 PM",
        invoiceDate: "2025-08-09",
        size: "3.5 MB",
        edited: false,
        isPriority: false,
        errorMessage: "Invalid file type. Only PDF, JPG, and PNG are supported.",
        uploadedBy:"admin"
      },
      {
        id: 9,
        name: "Corrupted_Invoice.pdf",
        supplierName: "Digital Services LLC",
        status: "Failed",
        uploadDate: "2025-08-11 05:30 PM",
        invoiceDate: "2025-08-05",
        size: "512 KB",
        edited: false,
        isPriority: false,
        errorMessage: "File is corrupted and cannot be opened.",
        uploadedBy:"admin"
      },
];

export const mockExtractedData: ExtractedData = {
  invoice_image_url: 'https://www.billdu.com/wp-content/uploads/2022/10/downloadable-invoice-sample-in-word.png',
  
  // Supplier & Invoice Details
  supplier_code: 'GTS-9876',
  supplier_name_email: 'Global Tech Supplies Inc. <contact@globaltech.com>',
  by_no: 'BN-456',
  gstin_no: '22AAAAA0000A1Z5',
  invoice_no: 'INV-2025-00123',
  grn_no: 'GRN-2025-789',
  po_no: 'PO-112233',
  invoice_date: '2025-08-20',
  pattial_amount: '500.00',
  merchandise_name: 'Computer Hardware & Peripherals',

  // Product Details
  product_details: [
    { id: '1', name: 'Quantum SSD 1TB', quantity: 2, unit_price: 500.0, total: 1000.0 },
    { id: '2', name: 'AetherRAM 16GB DDR5', quantity: 1, unit_price: 350.0, total: 350.0 },
    { id: '3', name: 'Photon Wireless Mouse', quantity: 2, unit_price: 100.0, total: 200.0 },
  ],

  // Amount & Tax Details
  total_pcs: '5',
  freight_charges: '50.00',
  master_discount_percent: '2.00%',
  igst: '282.60',
  igst_rounded_off: '0.00',
  product_total: '1550.00',
  misc_additions: '15.00',
  special_discount_percent: '1.00%',
  tcs_percent: '0.1%',
  tcs_amount: '1.85',
  discount: '-35.00',
  misc_deductions: '-10.00',
  credit_days: '30',
  tcs_rounded_off: '0.00',
  rounded_off: '+0.55',
  taxable_value: '1570.00',
  e_invoice: 'e-inv-a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  total_amount: '1855.00',
};

// src/lib/mockProductData.ts
import type { ProductWithDetails } from '../interfaces/Types';

export const mockProductData: ProductWithDetails[] = [
  {
    // --- Main Table Fields ---
    id: 'PROD_001',
    s_no: 1,
    product_group: 'Electronics',
    uom: 'Box',
    qty: 10,
    pcs: 100,
    cost_price: 15000.00,
    discount_amount: 750.00,
    discount_percent: '5%',
    price_code: 'PC-ELEC-A1',
    supplier_description: 'High-End Consumer Electronics',
    mrp: 18000.00,
    hsn_code: '851712',
    igst: '18%',
    rounded_off: 0.50,
    total: 16815.50,
    
    // --- Popup Data ---
    by_no: 'BY-2025-101',
    gst_rate: '18%',
    po_no: 'PO-2025-556',
    child_products: [
      { id: 'CHILD_001a', s_no: 1, product_code: 'SKU-PHN-01', product_description: 'Smartphone Model X', pieces: 50, style_code: 'STY-X', hsn_code: '851712', counter: 'C1', type: 'Regular', brand: 'AlphaBrand' },
      { id: 'CHILD_001b', s_no: 2, product_code: 'SKU-PHN-02', product_description: 'Smartphone Model X Pro', pieces: 50, style_code: 'STY-XPRO', hsn_code: '851712', counter: 'C1', type: 'Promo', brand: 'AlphaBrand' },
    ],
    summary: { total_pcs: 100, entered_pcs: 100, total_qty: 10, entered_qty: 10 },
  },
  {
    // --- Main Table Fields ---
    id: 'PROD_002',
    s_no: 2,
    product_group: 'Apparel',
    uom: 'Carton',
    qty: 25,
    pcs: 500,
    cost_price: 25000.00,
    discount_amount: 2500.00,
    discount_percent: '10%',
    price_code: 'PC-APR-B2',
    supplier_description: 'Summer Collection Menswear',
    mrp: 30000.00,
    hsn_code: '620342',
    igst: '12%',
    rounded_off: 0.00,
    total: 25200.00,

    // --- Popup Data ---
    by_no: 'BY-2025-102',
    gst_rate: '12%',
    po_no: 'PO-2025-557',
    child_products: [
      { id: 'CHILD_002a', s_no: 1, product_code: 'SKU-TSH-01', product_description: 'Cotton T-Shirt M', pieces: 250, style_code: 'STY-TSM', hsn_code: '620342', counter: 'C2', type: 'Regular', brand: 'BetaWear' },
      { id: 'CHILD_002b', s_no: 2, product_code: 'SKU-TSH-02', product_description: 'Cotton T-Shirt L', pieces: 250, style_code: 'STY-TSL', hsn_code: '620342', counter: 'C2', type: 'Regular', brand: 'BetaWear' },
    ],
    summary: { total_pcs: 500, entered_pcs: 490, total_qty: 25, entered_qty: 24 }, // Example of discrepancy
  },
];

export const cashFlowData = [
  { name: "18 July", income: 4000, outcome: 2400 },
  { name: "19 July", income: 3000, outcome: 1398 },
  { name: "20 July", income: 2000, outcome: 9800 },
  { name: "21 July", income: 2780, outcome: 3908 },
  { name: "22 July", income: 1890, outcome: 4800 },
  { name: "23 July", income: 2390, outcome: 3800 },
  { name: "24 July", income: 3490, outcome: 4300 },
];
export const expensesData = [
  { name: "Page A", uv: 4000, pv: 2400, amt: 2400 },
  { name: "Page B", uv: 3000, pv: 1398, amt: 2210 },
  { name: "Page C", uv: 2000, pv: 9800, amt: 2290 },
  { name: "Page D", uv: 2780, pv: 3908, amt: 2000 },
  { name: "Page E", uv: 1890, pv: 4800, amt: 2181 },
  { name: "Page F", uv: 2390, pv: 3800, amt: 2500 },
  { name: "Page G", uv: 3490, pv: 4300, amt: 2100 },
];
export const monthlyExpenseData = [
  { name: "Jan", expense: 4500 },
  { name: "Feb", expense: 4200 },
  { name: "Mar", expense: 6200 },
  { name: "Apr", expense: 5800 },
  { name: "May", expense: 7100 },
  { name: "Jun", expense: 8500 },
  { name: "Jul", expense: 7300 },
];
export const invoiceVolumeData = [
  { name: "Jan", count: 120 },
  { name: "Feb", count: 150 },
  { name: "Mar", count: 130 },
  { name: "Apr", count: 180 },
  { name: "May", count: 210 },
  { name: "Jun", count: 250 },
  { name: "Jul", count: 220 },
];
export const spendByVendorData = [
  { name: "Global Imports", value: 40000 },
  { name: "ACME Corp", value: 30000 },
  { name: "Nextriq", value: 22000 },
  { name: "SuperMart", value: 15000 },
];
export const discountByVendorData = [
  { name: "Global Imports", value: 2500 },
  { name: "ACME Corp", value: 1800 },
  { name: "Nextriq", value: 3200 },
  { name: "SuperMart", value: 900 },
];

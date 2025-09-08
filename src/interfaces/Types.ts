import { type ReactNode } from "react";

// --- Generic & Reusable Interfaces ---
export interface DataItem {
  id: number | string;
  [key: string]: any;
}

export interface CellIdentifier {
  rowIndex: number;
  colKey: string;
}

export interface CopiedCell extends CellIdentifier {
  value: any;
}

export interface DataTableProps {
  tableData: DataItem[];
  isMasterData?: boolean;
  isEditable?: boolean;
  isSearchable?: boolean;
}

// --- Application State & Navigation ---
export type Page =
  | "login"
  | "dashboard"
  | "logs"
  | "queue"
  | "upload"
  | "imageAlteration"
  | "loading"
  | "edit"
  | "preview";

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
    action?: {
        label: string;
        onClick: () => void;
    };
}

// --- User & Authentication ---
export type Role = "admin" | "user";
export interface AuthUser {
  username: string;
  role: Role;
}

// --- Document Queue & Status ---
export interface QueuedDocument {
  id: string;
  sno: number;
  name: string;
  size: string;
  uploadDate: string;
  uploadedBy: string;
  messageId: string;
  isPriority: boolean;
  status: "Queued" | "Processing";
}

export interface ProcessedDocument {
  id: string;
  sno: number;
  name: string;
  supplierName: string;
  invoiceId: string;
  irnNumber: string;
  uploadedBy: string;
  uploadDate: string;
  invoiceDate: string;
  messageId: string;
  status: "Processed";
}

export interface FailedDocument {
  id: string;
  sno: number;
  name: string;
  size: string;
  uploadedBy: string;
  uploadDate: string;
  messageId: string;
  errorMessage: string;
  status: "Failed";
}

export type Document = QueuedDocument | ProcessedDocument | FailedDocument;

// // --- API Data Structures (from CLARE_API_URL) ---
// export interface Supplier {
// 	supplier_id: number;
// 	supplier_name: string;
// 	supplier_address: string;
// 	supplier_gst: string;
// }

export interface InvoiceDetails {
	invoice_id: number;
	invoice_number: string;
	irn: string;
	invoice_date: string | null;
	way_bill: string;
	acknowledgement_number: string;
	acknowledgement_date: string;
	order_number: string | null;
	order_date: string | null;
	supplier_id: number;
	supplier_name: string;
	supplier_address: string;
	supplier_gst: string;
  [key: string]: any;
}

export interface ProductDetails {
	id: number; // Renamed from item_id to conform to DataItem
	invoice_id: number;
	category: string;
	UOM: string;
	item_description: string;
	design_code: string;
	total_quantity: number;
	total_amount: number;
	HSN: string;
  [key: string]: any;
}

export interface AmountAndTaxDetails {
	meta_id: number;
	invoice_amount: number;
	taxable_value: number;
	cgst_amount: number;
	sgst_amount: number;
	igst_amount: number;
	igst_percentage: number | null;
	total_tax_amount: number;
	other_deductions: number;
	freight_charges: number;
	other_charges: number;
	round_off_amount: number;
  [key: string]: any;
}

export interface LineItem {
	id: number; // Renamed from attribute_id to conform to DataItem
	size: string;
	total_count: number;
	color_code: string;
	single_unit_price: number;
	single_unit_mrp: number;
	no_item_split: number;
	attributes: null;
  [key: string]: any;
}

export interface EditableComponentProps {
  initialInvoiceDetails: InvoiceDetails;
  initialProductDetails: ProductDetails[];
  initialAmountAndTaxDetails: AmountAndTaxDetails;
  isReadOnly: boolean;
  onPreview?: (
      invoiceDetails: InvoiceDetails,
      productDetails: ProductDetails[],
      amountAndTaxDetails: AmountAndTaxDetails
  ) => void;
}

// --- Component Prop Interfaces ---
export interface MainLayoutProps {
  children?: ReactNode;
}

export interface ProductDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: LineItem[] | null;
  isLoading: boolean;
}

// --- Log Interface ---
export interface Log {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
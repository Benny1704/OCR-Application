import { type ReactNode } from "react";

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

export interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: DataItem | null;
}

export interface DataTableProps {
  tableData: DataItem[];
  isMasterData?: boolean;
  isEditable?: boolean;
  isSearchable?: boolean;
}

export interface InfoPillProps {
  children: React.ReactNode;
}

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
export type Role = "admin" | "user";
export interface AuthUser {
  email: string;
  role: Role;
}
export interface Invoice {
  invoice_number: string;
  invoice_date: string;
  irn_number: string;
  acknowledgement_no: string;
  acknowledgement_date: string;
  e_way_bill_no: string;
}
export interface Supplier {
  supplier_name: string;
  supplier_address: string;
  supplier_gst_no: string;
  msme_no: string;
  pan_no: string;
}
export interface Purchase {
  order_no: string;
  order_date: string;
  transport_name: string;
  agent_name: string;
  LR_no: string;
  LR_date: string;
  merchandiser_name: string;
}
export interface Taxes {
  taxable_value: string;
  CGST_amount: string;
  SGST_amount: string;
  IGST_amount: string;
  total_tax_amount: string;
}
export interface Amount {
  round_off_amount: string;
  invoice_amount: string;
  amount_in_words: string;
}
export interface BilledTo {
  customer_name: string;
  address_line1: string;
  address_line2: string;
  address_line3: string;
  address_line4: string;
  state_country: string;
  distance_level_km: string;
  phone: string;
  state_code: string;
  gstin_no_customer: string;
}
export interface Billing {
  billed_to: BilledTo;
  bank_name: string;
  bank_branch: string;
  account_name: string;
  account_no: string;
  IFSC_code: string;
}
export interface ProductItem {
  s_no: string;
  category: string;
  description: string;
  design_code: string;
  size: {
    size: string[];
    color: string;
    UOM: string;
    pieces: string[];
    quantity: string[];
    rate: string[];
    MRP_rate: string[];
    GST: string;
    discount_percentage: string;
    discount_amount: string;
    product_valued: string;
    HSN: string;
    tax_percentage: string;
    tax_amount: string;
  };
}
export interface ProductDetails {
  items: ProductItem[];
  total_quantity: number;
  total_net_Amount: number;
}
export interface ExtractedData {
  invoice: Invoice;
  supplier: Supplier;
  purchase: Purchase;
  taxes: Taxes;
  discount: { discount_percentage: string; discount_amount: string };
  charges: {
    other_deductions: string;
    freight_charges: string;
    other_charges: string;
  };
  amount: Amount;
  billing: Billing;
  product_details: ProductDetails;
}
export interface Log {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
export interface Document {
  id: number;
  name: string;
  supplierName: string;
  status: "Queued" | "Processed" | "Failed" | "Processing";
  uploadDate: string;
  invoiceDate: string;
  size: string;
  edited: boolean;
  isPriority: boolean;
  invoiceId?: string;
  irnNumber?: string;
}
export interface MainLayoutProps {
  children?: ReactNode;
}

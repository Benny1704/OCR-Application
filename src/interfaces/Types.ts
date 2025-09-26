import type { ReactNode, Dispatch, SetStateAction, JSX } from "react";

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
  onDataChange?: Dispatch<SetStateAction<any[]>>;
  [key: string]: any; // Allow other props
}

// --- Table Configuration ---
export interface TableColumnConfig {
    key: string;
    label: string;
    type?: 'string' | 'number' | 'boolean' | 'date';
    width?: string;
    sortable?: boolean;
    isEditable?: boolean;
    isRequired?: boolean;
    isCalculated?: boolean;
    fixed?: boolean;
}

export interface TableConfig {
    columns: TableColumnConfig[];
    fixedColumn?: string;
}


// --- Pagination ---
export interface Pagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  data: T[];
  pagination: Pagination;
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
    type: 'success' | 'error' | 'warning' | 'info';
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
  section: number;
  password?: string;
}

export interface Document {
  id: string;
  name: string;
  status: "Queued" | "Processing" | "Processed" | "Failed" | "Reviewed";
  uploadDate: string;
  uploadedBy: string;
}

export interface QueuedDocument extends Document {
  size: string;
  isPriority: boolean;
  messageId: string;
  queue_position: number;
  supplier_meta: {
    supplier_code: string;
    supplier_name: string;
    supplier_gst_in: string;
  };
  invoice_meta: {
    invoice_no: string;
    invoice_date: string;
    invoice_amount: number;
  };
}

export interface ProcessedDocument extends Document {
  sno: number;
  supplierName: string;
  invoiceId: string;
  irnNumber: string;
  invoiceDate: string;
  messageId: string;
}

export interface FailedDocument extends Document {
  size: string;
  errorMessage: string;
  messageId: string;
  supplier_meta: {
    supplier_code: string;
    supplier_name: string;
    supplier_gst_in: string;
  };
  invoice_meta: {
    invoice_no: string;
    invoice_date: string;
    invoice_amount: number;
  };
}

export interface InvoiceDetails {
  supplier_id: number;
  invoice_id: number;
  invoice_number: string;
  irn: string;
  invoice_date: string | null;
  way_bill: string;
  acknowledgement_number: string;
  acknowledgement_date: string | null;
  created_at: string | null;
  order_number: string | null;
  order_date: string | null;
  supplier_name: string;
  supplier_address: string;
  supplier_gst: string;
  supplier_code: string;
  merchandiser_name: string;
  [key: string]: any;
}

export interface ProductDetails extends DataItem {
  item_id: number;
  invoice_id: number;
  category: string;
  uom: string;
  design_code: string;
  total_quantity: number;
  total_pieces: number;
  total_amount: number;
  gst_percentage: number;
  style_code: string;
  line_items?: LineItem[];
  [key: string]: any;
}

export interface AmountAndTaxDetails {
  invoice_id: number;
  meta_id: number;
  invoice_amount: number;
  taxable_value: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  igst_percentage: string | null;
  total_tax_amount: number;
  other_deductions: number;
  freight_charges: number;
  other_charges: number;
  round_off_amount: number;
  misc_additions: number;
  misc_deductions: number;
  discount_id: number;
  discount_percentage: number | null;
  discount_amount: number | null;
  discount_round_off: number;
  [key: string]: any;
}

export interface LineItem extends DataItem {
  attribute_id: number;
  item_id: number;
  item_description: string;
  size: string;
  total_count: number;
  pieces: number;
  color_code: string;
  single_unit_price: number;
  single_unit_mrp: number;
  ean_code: string;
  discount_percentage: string | null;
  discount_amount: number;
  cgst_percentage: string | null;
  sgst_percentage: string | null;
  igst_percentage: string | null;
  hsn: string;
  [key: string]: any;
}

export interface EditableComponentProps {
  isManual?: boolean;
  initialInvoiceDetails?: InvoiceDetails | null;
  initialProductDetails?: ProductDetails[] | null;
  initialAmountAndTaxDetails?: AmountAndTaxDetails | null;
  isReadOnly?: boolean;
  invoiceError?: string | null;
  productError?: string | null;
  amountError?: string | null;
  onRetry?: () => void;
  messageId: string;
  formConfig: FormSection[];
  itemSummaryConfig: { columns: FormField[] };
  itemAttributesConfig: { columns: FormField[] };
  onSaveNewProduct: (product: ProductDetails) => Promise<ProductDetails>;
  onFormChange?: (
      newInvoiceDetails: InvoiceDetails,
      newProductDetails: ProductDetails[],
      newAmountAndTaxDetails: AmountAndTaxDetails
  ) => void;
  onValidationChange?: (hasErrors: boolean) => void;
  renderActionCell?: (row: DataItem) => JSX.Element;
  footer?: React.ReactNode;
}

// --- Component Prop Interfaces ---
export interface MainLayoutProps {
  children?: ReactNode;
}

export interface ProductDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDetails | null;
  onSave: (updatedLineItems: LineItem[]) => void; // To save changes back to parent
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


// --- UI Config Interfaces ---
export interface FormField {
    key: string;
    label: string;
    isEditable?: boolean;
    isRequired?: boolean;
    isCalculated?: boolean;
}

export interface FormSection {
    id: 'supplier_invoice' | 'product_details' | 'amount_details';
    title: string;
    fields?: FormField[];
}

export interface Section {
  section_id: number;
  section_name: string;
}
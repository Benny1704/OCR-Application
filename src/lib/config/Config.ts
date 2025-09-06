export interface FormField {
  key: string;
  label: string;
}

export interface FormSection {
  id: 'supplier_invoice' | 'product_details' | 'amount_details';
  title: string;
  fields?: FormField[];
}

export const formConfig: FormSection[] = [
    {
      id: 'supplier_invoice',
      title: 'Supplier & Invoice Details',
      fields: [
        { key: 'supplier_code', label: 'Supplier Code' },
        { key: 'supplier_name_email', label: 'Supplier Name & Email' },
        // { key: 'by_no', label: 'Byno' },
        { key: 'gstin_no', label: 'GSTIN No' },
        { key: 'invoice_no', label: 'Invoice No' },
        { key: 'grn_no', label: 'GRN No' },
        { key: 'po_no', label: 'PO No' },
        { key: 'invoice_date', label: 'Invoice Date' },
        { key: 'pattial_amount', label: 'Pattial Amount' },
        // { key: 'merchandise_name', label: 'Merchandise Name' },
      ],
    },
    {
      id: 'product_details',
      title: 'Product Details',
    },
    {
      id: 'amount_details',
      title: 'Amount & Tax Details',
      fields: [
        { key: 'total_pcs', label: 'Total Pcs' },
        { key: 'freight_charges', label: 'Freight Charges' },
        { key: 'master_discount_percent', label: 'Master Discount %' },
        { key: 'igst', label: 'IGST' },
        { key: 'igst_rounded_off', label: 'IGST Rounded Off' },
        { key: 'product_total', label: 'Product Total' },
        { key: 'misc_additions', label: 'Misc Additions' },
        { key: 'special_discount_percent', label: 'Special Discount %' },
        { key: 'tcs_percent', label: 'TCS %' },
        { key: 'tcs_amount', label: 'TCS Amount' },
        { key: 'discount', label: 'Discount' },
        { key: 'misc_deductions', label: 'Misc Deductions' },
        { key: 'credit_days', label: 'Credit Days' },
        { key: 'tcs_rounded_off', label: 'TCS Rounded Off' },
        { key: 'rounded_off', label: 'Rounded Off' },
        { key: 'taxable_value', label: 'Taxable Value' },
        { key: 'e_invoice', label: 'eInvoice' },
        { key: 'total_amount', label: 'Total Amount' },
      ],
    },
];

export const documentConfig = {
  columns: [
    // { key: 'id', header: 'ID', editable: true },
    { key: 'name', header: 'File Name', editable: true },
    { key: 'supplierName', header: 'Supplier Name', editable: true },
    { key: 'invoiceId', header: 'Invoice ID', editable: true },
    { key: 'irnNumber', header: 'IRN Number', editable: true },
    { key: 'uploadedBy', header: 'Uploaded By', editable: true },
    { key: 'uploadDate', header: 'Upload Date', editable: true },
    { key: 'invoiceDate', header: 'Invoice Date', editable: true },
  ]
};
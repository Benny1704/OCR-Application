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
        { key: 'supplier_name', label: 'Supplier Name' },
        { key: 'supplier_gst', label: 'Supplier GST' },
        { key: 'supplier_address', label: 'Supplier Address' },
        { key: 'invoice_number', label: 'Invoice No' },
        { key: 'irn', label: 'IRN' },
        { key: 'invoice_date', label: 'Invoice Date' },
        { key: 'way_bill', label: 'Way Bill' },
        { key: 'acknowledgement_number', label: 'Acknowledgement Number' },
        { key: 'acknowledgement_date', label: 'Acknowledgement Date' },
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
        { key: 'invoice_amount', label: 'Invoice Amount' },
        { key: 'taxable_value', label: 'Taxable Value' },
        { key: 'cgst_amount', label: 'CGST Amount' },
        { key: 'sgst_amount', label: 'SGST Amount' },
        { key: 'igst_amount', label: 'IGST Amount' },
        { key: 'igst_percentage', label: 'IGST %' },
        { key: 'total_tax_amount', label: 'Total Tax Amount' },
        { key: 'other_deductions', label: 'Other Deductions' },
        { key: 'freight_charges', label: 'Freight Charges' },
        { key: 'other_charges', label: 'Other Charges' },
        { key: 'round_off_amount', label: 'Round Off Amount' },
        { key: 'discount_percentage', label: 'Discount %' },
        { key: 'discount_amount', label: 'Discount Amount' },
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
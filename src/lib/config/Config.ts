export interface FormField {
  key: string;
  label: string;
  type?: string;
  options?: { value: string | number; label: string }[];
  isCurrency?: boolean;
}

export interface FormSection {
  id: 'supplier_invoice' | 'product_details' | 'amount_details';
  title: string;
  fields?: FormField[];
}

export const uploadFormConfig: FormField[] = [
  {
    key: 'section_id',
    label: 'Section Name',
    type: 'select',
    options: [
      { value: 201, label: 'Best Choice' },
      { value: 204, label: 'Chudi Materials' },
      { value: 203, label: 'Chudi Readymade' },
      { value: 210, label: 'Cosmetics and Jewelry' },
      { value: 7, label: 'Handloom' },
      { value: 202, label: 'Kids' },
      { value: 209, label: 'Lifestyle' },
      { value: 207, label: 'Shirtings' },
      { value: 6, label: 'Silks' },
      { value: 206, label: 'Suitings' },
      { value: 205, label: 'Synthetic Sarees' },
      { value: 208, label: 'Textiles' },
    ],
  },
  { key: 'supplier_code', label: 'Supplier Code', type: 'text' },
  { key: 'supplier_name', label: 'Supplier Name', type: 'text' },
  { key: 'gst_no', label: 'GST No', type: 'text' },
  { key: 'invoice_no', label: 'Invoice No', type: 'text' },
  { key: 'invoice_amount', label: 'Invoice Amount', type: 'number' , isCurrency: true},
  { key: 'invoice_date', label: 'Invoice Date', type: 'datetime-local' },
];

export const documentConfig = {
  columns: [
    { key: 'name', label: 'File Name', isEditable: true, isRequired: true, isCalculated: false },
    { key: 'supplierName', label: 'Supplier Name', isEditable: true, isRequired: true, isCalculated: false },
    { key: 'supplierNumber', label: 'Supplier GSTIN', isEditable: true, isRequired: true, isCalculated: false },
    { key: 'invoiceNumber', label: 'Invoice Number', isEditable: true, isRequired: true, isCalculated: false },
    { key: 'uploadDate', label: 'Upload Date', isEditable: true, isRequired: true, isCalculated: false },
    { key: 'invoiceDate', label: 'Invoice Date', isEditable: true, isRequired: true, isCalculated: false },
  ]
};
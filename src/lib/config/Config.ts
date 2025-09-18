export interface FormField {
  key: string;
  label: string;
  type?: string;
  options?: { value: string | number; label: string }[];
}

export interface FormSection {
  id: 'supplier_invoice' | 'product_details' | 'amount_details';
  title: string;
  fields?: FormField[];
}

export const uploadFormConfig: FormField[] = [
  { key: 'register_id', label: 'Register ID', type: 'number' },
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
  { key: 'invoice_date', label: 'Invoice Date', type: 'datetime-local' },
  { key: 'invoice_amount', label: 'Invoice Amount', type: 'number' },
];

export const documentConfig = {
  columns: [
    // { key: 'id', label: 'ID', isEditable: true, isRequired: true, isCalculated: true },
    { key: 'name', label: 'File Name', isEditable: true, isRequired: true, isCalculated: false },
    { key: 'supplierName', label: 'Supplier Name', isEditable: true, isRequired: true, isCalculated: false },
    // { key: 'invoiceId', label: 'Invoice ID', isEditable: true, isRequired: true, isCalculated: true },
    // { key: 'irnNumber', label: 'IRN Number', isEditable: true, isRequired: true, isCalculated: false },
    // { key: 'uploadedBy', label: 'Uploaded By', isEditable: true, isRequired: true, isCalculated: false },
    { key: 'SupplierNumber', label: 'Supplier GSTIN', isEditable: true, isRequired: true, isCalculated: false },
    { key: 'InvoiceNumber', label: 'Invoice Number', isEditable: true, isRequired: true, isCalculated: false },
    { key: 'uploadDate', label: 'Upload Date', isEditable: true, isRequired: true, isCalculated: false },
    { key: 'invoiceDate', label: 'Invoice Date', isEditable: true, isRequired: true, isCalculated: false },
  ]
};

// export const formConfig: FormSection[] = [
//   {
//     id: 'supplier_invoice',
//     title: 'Supplier & Invoice Details',
//     fields: [
//       { key: 'supplier_name', label: 'Supplier Name' },
//       { key: 'supplier_gst', label: 'Supplier GST' },
//       { key: 'supplier_address', label: 'Supplier Address' },
//       { key: 'invoice_number', label: 'Invoice No' },
//       { key: 'irn', label: 'IRN' },
//       { key: 'invoice_date', label: 'Invoice Date' },
//       { key: 'way_bill', label: 'Way Bill' },
//       { key: 'acknowledgement_number', label: 'Acknowledgement Number' },
//       { key: 'acknowledgement_date', label: 'Acknowledgement Date' },
//     ],
//   },
//   {
//     id: 'product_details',
//     title: 'Product Details',
//   },
//   {
//     id: 'amount_details',
//     title: 'Amount & Tax Details',
//     fields: [
//       { key: 'invoice_amount', label: 'Invoice Amount' },
//       { key: 'taxable_value', label: 'Taxable Value' },
//       { key: 'cgst_amount', label: 'CGST Amount' },
//       { key: 'sgst_amount', label: 'SGST Amount' },
//       { key: 'igst_amount', label: 'IGST Amount' },
//       { key: 'igst_percentage', label: 'IGST %' },
//       { key: 'total_tax_amount', label: 'Total Tax Amount' },
//       { key: 'other_deductions', label: 'Other Deductions' },
//       { key: 'freight_charges', label: 'Freight Charges' },
//       { key: 'other_charges', label: 'Other Charges' },
//       { key: 'round_off_amount', label: 'Round Off Amount' },
//       { key: 'discount_percentage', label: 'Discount %' },
//       { key: 'discount_amount', label: 'Discount Amount' },
//     ],
//   },
// ];

// export const itemSummaryConfig = {
// columns: [
//   { key: 'category', label: 'Category', isEditable: true, isRequired: true, isCalculated: false },
//   { key: 'UOM', label: 'UOM', isEditable: true, isRequired: true, isCalculated: false },
//   { key: 'item_description', label: 'Item Description', isEditable: true, isRequired: true, isCalculated: false },
//   { key: 'design_code', label: 'Design Code', isEditable: true, isRequired: true, isCalculated: false },
//   { key: 'total_quantity', label: 'Total Quantity', isEditable: true, isRequired: true, isCalculated: false },
//   { key: 'total_amount', label: 'Total Amount', isEditable: true, isRequired: true, isCalculated: true },
//   { key: 'HSN', label: 'HSN', isEditable: true, isRequired: true, isCalculated: false },
// ]
// };

// export const itemAttributesConfig = {
// columns: [
//   { key: 'size', label: 'Size', isEditable: true, isRequired: true, isCalculated: false },
//   { key: 'total_count', label: 'Total Count', isEditable: true, isRequired: true, isCalculated: false },
//   { key: 'color_code', label: 'Color Code', isEditable: true, isRequired: true, isCalculated: false },
//   { key: 'single_unit_price', label: 'Single Unit (Rate)', isEditable: true, isRequired: true, isCalculated: false },
//   { key: 'single_unit_mrp', label: 'Single Unit (MRP)', isEditable: true, isRequired: true, isCalculated: false },
//   { key: 'no_item_split', label: 'No. of Split', isEditable: true, isRequired: true, isCalculated: false },
//   // { key: 'invoiceDate', label: 'Invoice Date', isEditable: true, isRequired: true, isCalculated: true },
// ]
// };
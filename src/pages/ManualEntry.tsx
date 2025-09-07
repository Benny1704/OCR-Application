import EditableComponent from '../components/common/EditableComponent';
import {
    type InvoiceDetails,
    type ProductDetails,
    type AmountAndTaxDetails,
} from '../interfaces/Types';

const initialEmptyInvoiceDetails: InvoiceDetails = {
    invoice_id: 0, invoice_number: '', irn: '', invoice_date: null, way_bill: '',
    acknowledgement_number: '', acknowledgement_date: '', order_number: null, order_date: null,
    supplier_id: 0, supplier_name: '', supplier_address: '', supplier_gst: ''
};

const initialEmptyProductDetails: ProductDetails[] = [];

const initialEmptyAmountAndTaxDetails: AmountAndTaxDetails = {
    meta_id: 0,
    invoice_amount: 0,
    taxable_value: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    igst_percentage: null,
    total_tax_amount: 0,
    other_deductions: 0,
    freight_charges: 0,
    other_charges: 0,
    round_off_amount: 0,
};


const ManualEntry = () => {
    return (
        <EditableComponent
            isManual={true}
            initialInvoiceDetails={initialEmptyInvoiceDetails}
            initialProductDetails={initialEmptyProductDetails}
            initialAmountAndTaxDetails={initialEmptyAmountAndTaxDetails}
        />
    );
};

export default ManualEntry;
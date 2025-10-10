import axios, { AxiosError } from 'axios';
import type { AmountAndTaxDetails, InvoiceDetails, PaginatedResponse, QueuedDocument, ProcessedDocument, FailedDocument, FormField, Section, LineItem, ProductDetails } from '../../interfaces/Types';

// --- Base URLs ---
const API_URL = "http://10.2.0.4:30904";
// const API_URL = import.meta.env.VITE_API_URL;

// --- Axios Instances ---
const api = axios.create({ baseURL: API_URL });

// --- Global Toast Function ---
let globalAddToast: ((toast: { message: string, type: "error" | "success" }) => void) | null = null;

export const setGlobalToast = (addToast: (toast: { message: string, type: "error" | "success" }) => void) => {
    globalAddToast = addToast;
};


// --- Axios Interceptor for Authentication ---
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        config.headers['accept'] = 'application/json';
        config.headers['ngrok-skip-browser-warning'] = 'true';
        return config;
    },
    (error) => Promise.reject(error)
);


// --- Centralized Error Handler ---
const handleError = (error: any) => {
    let errorMessage = "An unknown error occurred.";
    let statusCode: number | undefined;

    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        statusCode = axiosError.response?.status;
        if (axiosError.response) {
            const errorData = axiosError.response.data;
            errorMessage = errorData.detail || errorData.message || axiosError.message;
        } else if (axiosError.request) {
            errorMessage = "No response from server. Check your network connection.";
        } else {
            errorMessage = axiosError.message;
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    console.error("API Error:", error);

    if (globalAddToast && statusCode !== 422) {
        globalAddToast({ message: errorMessage, type: "error" });
    }

    const errorToThrow = new Error(errorMessage) as any;
    errorToThrow.statusCode = statusCode;
    throw errorToThrow;
};

// --- API Functions ---

export const getSections = async (): Promise<Section[]> => {
    try {
        const response = await api.get('/sections/');
        return response.data;
    } catch (error) {
        handleError(error);
        return [];
    }
};

export const login = async (credentials: { username: string; password: string; section_id: number }): Promise<{ access_token: string }> => {
    try {
        const response = await api.post('/users/token', credentials);
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const uploadFiles = async (
    file: File,
    invoiceDetails: any,
    onProgress: (percentCompleted: number) => void,
): Promise<{ success: boolean; message?: string }> => {

    const formData = new FormData();
    formData.append('file', file);
    formData.append('invoice_register_details', JSON.stringify(invoiceDetails));
    try {
        const response = await api.post('/upload/upload-invoice', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });
        return { success: true, message: response.data.response };
    } catch (error) {
        handleError(error);
        return { success: false };
    }
};


export const alterImage = async (params: { imageData: string; rotation: number; noise: number }) => {
    try {
        const payload: any = {
            image_base64: params.imageData,
            rotate_angle: params.rotation,
        };
        if (params.noise > 0) {
            payload.denoise_ksize = params.noise;
        }
        const response = await api.post('/ocr_preprocessing/process', payload);
        return response.data;
    } catch (error) {
        handleError(error);
        return null;
    }
};

export const getQueuedDocuments = async (page: number = 1, pageSize: number = 10, section_id?: number): Promise<PaginatedResponse<QueuedDocument>> => {
    try {
        const params: any = { page, page_size: pageSize };
        if (section_id) {
            params.section_id = section_id;
        }
        const response = await api.get('/document/queued', { params });
        return response.data;
    } catch (error) {
        handleError(error);
        return { data: [], pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 1, has_next: false, has_previous: false } };
    }
};

export const getProcessedDocuments = async (page: number = 1, pageSize: number = 10, section_id?: number): Promise<PaginatedResponse<ProcessedDocument>> => {
    try {
        const params: any = { page, page_size: pageSize };
        if (section_id) {
            params.section_id = section_id;
        }
        const response = await api.get('/document/processed', { params });        
        return response.data;
    } catch (error) {
        handleError(error);
        return { data: [], pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 1, has_next: false, has_previous: false } };
    }
};

export const getFailedDocuments = async (page: number = 1, pageSize: number = 10, section_id?: number): Promise<PaginatedResponse<FailedDocument>> => {
    try {
        const params: any = { page, page_size: pageSize };
        if (section_id) {
            params.section_id = section_id;
        }
        const response = await api.get('/document/failed', { params });
        return response.data;
    } catch (error) {
        handleError(error);
        return { data: [], pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 1, has_next: false, has_previous: false } };
    }
};

export const getCompletedDocuments = async (page: number = 1, pageSize: number = 10, section_id?: number): Promise<PaginatedResponse<ProcessedDocument>> => {
    try {
        const params: any = { page, page_size: pageSize };
        if (section_id) {
            params.section_id = section_id;
        }
        const response = await api.get('/document/completed', { params });
        return response.data;
    } catch (error) {
        handleError(error);
        return { data: [], pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 1, has_next: false, has_previous: false } };
    }
};

export const getDocumentSummary = async (section_id?: number, is_today?: boolean) => {
    try {
        const params: any = {};
        if (section_id) {
            params.section_id = section_id;
        }
        if (is_today !== undefined) {
            params.is_today = is_today;
        }
        const response = await api.get('/document/summary', { params });
        return response.data;
    } catch (error) {
        handleError(error);
        return { waiting: 0, processed: 0, failed: 0, completed: 0 };
    }
};


export const deleteMessage = async (id: string) => {
    try {
        const response = await api.patch(`/messages/${id}/delete`);
        return response.data;
    } catch (error) {
        handleError(error);
    }
};

export const togglePriority = async (id: string) => {
    try {
        const response = await api.patch(`/messages/${id}/prioritize`);
        return response.data;
    } catch (error) {
        handleError(error);
    }
};

export const retryMessage = async (id: string, images?: string[]) => {
    try {
        const payload = images ? { images } : {};
        const response = await api.patch(`/messages/${id}/retry`, payload);
        return response.data;
    } catch (error) {
        handleError(error);
    }
};

export const getTotalDiscountThisMonth = async (section_id?: number): Promise<any> => {
    try {
        const params = section_id ? { section_id } : {};
        const response = await api.get('/metrics/total_discount_this_month', { params });
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const getTotalSpendThisMonth = async (section_id?: number): Promise<any> => {
    try {
        const params = section_id ? { section_id } : {};
        const response = await api.get('/metrics/total_spend_this_month', { params });
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};


// --- Chart Data Functions ---
const fetchDataForChart = async (instance: any, endpoint: string, filterType: 'monthly' | 'yearly', year: number, toYear?: number, section_id?: number) => {
    const params: any = filterType === 'monthly'
        ? { year }
        : { from_year: year, to_year: toYear };

    if (section_id) {
        params.section_id = section_id;
    }

    const response = await instance.get(endpoint, { params });
    const data = response.data;
    const key = Object.keys(data)[0];

    if (filterType === 'monthly' && data[key]) {
        return data[key].monthly_counts || data[key].monthly_expenses;
    }
    if (filterType === 'yearly' && data[key]) {
        return data[key].yearly_counts || data[key].yearly_expenses;
    }
    return data[key];
};

export const getFinancialObligations = (filterType: 'monthly' | 'yearly', year: number, toYear?: number, section_id?: number) => {
    return fetchDataForChart(api, '/metrics/financial_obligations', filterType, year, toYear, section_id);
};

export const getInvoiceCount = (filterType: 'monthly' | 'yearly', year: number, toYear?: number, section_id?: number) => {
    return fetchDataForChart(api, '/metrics/invoice_count', filterType, year, toYear, section_id);
};

export const getSpendByVendor = async (year: number, month?: number, section_id?: number) => {
    const params: any = { year };
    if (month) {
        params.month = month;
    }
    if (section_id) {
        params.section_id = section_id;
    }
    const response = await api.get('/metrics/spend_by_vendor', { params });
    return response.data.spend_by_vendor.vendors;
};

export const getDiscountByVendor = async (year: number, month?: number, section_id?: number) => {
    const params: any = { year };
    if (month) {
        params.month = month;
    }
    if (section_id) {
        params.section_id = section_id;
    }
    const response = await api.get('/metrics/discount_percent_per_vendor', { params });

    return response.data.discount_percent_per_vendor.vendors;
};
// --- Invoice Details API Functions ---

export const getInvoiceDetails = async (invoiceId: number) => {
    try {
        const response = await api.get(`/invoices/${invoiceId}`);
        return response.data;
    } catch (error) {
        handleError(error);
        return null;
    }
};

export const getProductDetails = async (invoiceId: number) => {
    try {
        const response = await api.get(`/invoices/${invoiceId}/line-items`);
        return response.data;
    } catch (error) {
        handleError(error);
        return [];
    }
};

export const getAmountAndTaxDetails = async (invoiceId: number) => {
    try {
        const response = await api.get(`/invoices/${invoiceId}/meta-discount`);
        return response.data;
    } catch (error) {
        handleError(error);
        return null;
    }
};

export const getLineItems = async (invoiceId: number, itemId: number) => {
    try {
        const response = await api.get(`/invoices/${invoiceId}/line-items/${itemId}/attributes`);
        return response.data;
    } catch (error) {
        handleError(error);
        return [];
    }
};

// --- Update API Functions ---

export const updateInvoiceDetails = async (invoiceId: number, data: InvoiceDetails) => {
    try {
        const response = await api.put(`/invoice/${invoiceId}`, data);
        return response.data;
    } catch (error) {
        handleError(error);
        return null;
    }
};

export const updateProductDetails = async (invoiceId: number, data: any) => {
    try {
        const { items } = data;
        const response = await api.put(`/invoice/${invoiceId}/item-summary`, items);
        return response.data;
    } catch (error) {
        handleError(error);
        return null;
    }
};

export const updateAmountAndTaxDetails = async (invoiceId: number, data: AmountAndTaxDetails) => {
    try {
        const response = await api.put(`/invoice/${invoiceId}/meta-discount`, data);
        return response.data;
    } catch (error) {
        handleError(error);
        return null;
    }
};

export const updateLineItems = async (itemId: number, data: LineItem[]) => {
    try {
        const response = await api.put(`/invoice/${itemId}/item-attribute`, data);
        return response.data;
    } catch (error) {
        handleError(error);
        return [];
    }
};

// --- Summary/Logs API Functions ---
const getSummaryData = async (endpoint: string, year: number, month?: number) => {
    const params: any = { year };
    if (month) {
        params.month = month;
    }
    const response = await api.get(endpoint, { params });
    return response.data;
}

export const getInvoiceCountStats = (year: number, month?: number) => {
    return getSummaryData('/summary/count-invoice-processed', year, month);
};

export const getLlmConsumedStats = (year: number, month?: number) => {
    return getSummaryData('/summary/llm-consumed', year, month);
};

export const getProcessingFailuresStats = (year: number, month?: number) => {
    return getSummaryData('/summary/processing-failures', year, month);
};

export const getMonthlyProcessingStats = async (year: number) => {
    const response = await api.get('/summary/monthly-processing', { params: { year } });
    return response.data;
};

export const confirmInvoice = async (messageId: string, data: { isEdited: boolean; state: string }): Promise<boolean> => {
    try {
        const params = new URLSearchParams({
            state: data.state,
            is_edited: String(data.isEdited)
        }).toString();

        await api.post(`/confirm/${messageId}?${params}`);
        return true;
    } catch (error) {
        handleError(error);
        return false;
    }
};

// --- UI Config API Functions ---
export const getInvoiceConfig = async (): Promise<{ fields: FormField[] }> => {
    try {
        const response = await api.get('/ui_configs/invoice');
        return response.data;
    } catch (error) {
        handleError(error);
        return { fields: [] };
    }
}

export const getInvoiceMetaConfig = async (): Promise<{ fields: FormField[] }> => {
    try {
        const response = await api.get('/ui_configs/invoiceMeta');
        return response.data;
    } catch (error) {
        handleError(error);
        return { fields: [] };
    }
}

export const getItemSummaryConfig = async (): Promise<{ fields: FormField[] }> => {
    try {
        const response = await api.get('/ui_configs/itemSummary');
        return response.data;
    } catch (error) {
        handleError(error);
        return { fields: [] };
    }
}

export const getItemAttributesConfig = async (): Promise<{ fields: FormField[] }> => {
    try {
        const response = await api.get('/ui_configs/itemAttributes');
        return response.data;
    } catch (error) {
        handleError(error);
        return { fields: [] };
    }
}

// --- NEW MANUAL ENTRY APIS ---

export const manualInvoiceEntryInvoice = async (messageID: string, invoiceData: Partial<InvoiceDetails>): Promise<{ invoice_id: number }> => {
    try {
        const payload = {
            ...invoiceData,
            message_id: messageID
        };
        const response = await api.post('/manual_invoice_entry/invoice', payload);
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const manualInvoiceEntryInvoiceMeta = async (metaData: Partial<AmountAndTaxDetails>) => {
    try {
        const response = await api.post('/manual_invoice_entry/invoice_meta', metaData);
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const manualInvoiceEntryItemSummary = async (payload: { items: Partial<ProductDetails>[] }): Promise<{
    status: string; data: ProductDetails[], message: string
}> => {
    try {
        const response = await api.post('/manual_invoice_entry/item_summary', payload);
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const manualInvoiceEntryItemAttributes = async (attributes: Partial<LineItem>[]): Promise<{
    status: string; data: LineItem[], message: string
}> => {
    try {
        // Clean each attribute object to match the exact payload structure required by the API.
        const cleanedAttributes = attributes.map(attr => ({
            item_id: attr.item_id,
            item_description: attr.item_description || "",
            total_count: Number(attr.total_count) || 0,
            size: attr.size || "",
            pieces: Number(attr.pieces) || 0,
            color_code: attr.color_code || "",
            single_unit_price: Number(attr.single_unit_price) || 0,
            discount_percentage: String(attr.discount_percentage) || "0",
            discount_amount: Number(attr.discount_amount) || 0,
            single_unit_mrp: Number(attr.single_unit_mrp) || 0,
            HSN: String((attr as any).hsn || attr.HSN || ""),
            cgst_percentage: String(attr.cgst_percentage) || "0",
            sgst_percentage: String(attr.sgst_percentage) || "0",
            igst_percentage: String(attr.igst_percentage) || "0",
            EAN: String((attr as any).ean_code || attr.EAN || "")
        }));

        // The object sent to the API now correctly wraps the cleaned array in an "attributes" key.
        const response = await api.post('/manual_invoice_entry/item_attributes', { attributes: cleanedAttributes });

        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const getInvoicePdfFilename = async (messageId: string): Promise<{ queue_id: string, original_filename: string } | null> => {
    try {
        const response = await api.get(`/invoice_pdf_filename/${messageId}`);
        return response.data;
    } catch (error) {
        handleError(error);
        return null;
    }
};
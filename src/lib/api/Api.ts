import axios, { AxiosError } from 'axios';
import type { AmountAndTaxDetails, InvoiceDetails, LineItem, ProductDetails, PaginatedResponse, QueuedDocument, ProcessedDocument, FailedDocument } from '../../interfaces/Types';

// --- Base URLs ---
const API_URL = import.meta.env.VITE_API_URL;

// --- Axios Instances ---
// Creating separate instances allows for different base URLs and configurations
const api = axios.create({ baseURL: API_URL });

// --- Axios Interceptor for Authentication ---
// This function runs before every request is sent for any of the instances above.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // Add other common headers here
        config.headers['accept'] = 'application/json';
        config.headers['ngrok-skip-browser-warning'] = 'true';
        return config;
    },
    (error) => Promise.reject(error)
);


// --- Centralized Error Handler ---
// This helper function standardizes error message extraction and toast notifications.
const handleError = (error: any, addToast: (toast: { id?: number, message: string, type: "error" }) => void) => {
    let errorMessage = "An unknown error occurred.";

    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
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

    // Only show toast if a function is provided
    if (addToast) {
        addToast({ message: errorMessage, type: "error" });
    }

    // It's good practice to re-throw the error so the calling component knows the request failed.
    throw new Error(errorMessage);
};

// --- API Functions (Refactored) ---

export const login = async (credentials: { username: string, password: string }, addToast: any): Promise<{ access_token: string }> => {
    try {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        // Main API login attempt
        const response = await api.post('/users/token', formData);
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        // This part is unreachable because handleError throws, but it's here to satisfy TypeScript's control flow analysis
        throw error;
    }
};

export const uploadFiles = async (
    files: File[],
    onProgress: (percentCompleted: number) => void, // Added for progress tracking
    addToast: any
): Promise<{ success: boolean }> => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });

    try {
        await api.post('/upload/upload-invoice', formData, {
            onUploadProgress: (progressEvent) => {
                const total = progressEvent.total ?? (files.reduce((acc, file) => acc + file.size, 0));
                const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
                onProgress(percentCompleted);
            },
        });
        return { success: true };
    } catch (error) {
        handleError(error, addToast);
        return { success: false };
    }
};

export const alterImage = async (params: { imageData: string; rotation: number; noise: number }, showToast: any) => {
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
        handleError(error, showToast);
        return null;
    }
};

export const getQueuedDocuments = async (addToast: any, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<QueuedDocument>> => {
    try {
        const response = await api.get('/document/queued', { params: { page, page_size: pageSize } });
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        return { data: [], pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 1, has_next: false, has_previous: false } };
    }
};

export const getProcessedDocuments = async (addToast: any, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<ProcessedDocument>> => {
    try {
        const response = await api.get('/document/processed', { params: { page, page_size: pageSize } });
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        return { data: [], pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 1, has_next: false, has_previous: false } };
    }
};

export const getFailedDocuments = async (addToast: any, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<FailedDocument>> => {
    try {
        const response = await api.get('/document/failed', { params: { page, page_size: pageSize } });
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        return { data: [], pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 1, has_next: false, has_previous: false } };
    }
};

export const getCompletedDocuments = async (addToast: any, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<ProcessedDocument>> => {
    try {
        const response = await api.get('/document/completed', { params: { page, page_size: pageSize } });
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        return { data: [], pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 1, has_next: false, has_previous: false } };
    }
};


export const getDocumentSummary = async (addToast: any) => {
    try {
        const response = await api.get('/document/summary');
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        return { waiting: 0, processed: 0, failed: 0, completed: 0 };
    }
};

export const deleteMessage = async (id: string, addToast: any) => {
    try {
        const response = await api.patch(`/messages/${id}/delete`);
        return response.data;
    } catch (error) {
        handleError(error, addToast);
    }
};

export const togglePriority = async (id: string, addToast: any) => {
    try {
        const response = await api.patch(`/messages/${id}/prioritize`);
        return response.data;
    } catch (error) {
        handleError(error, addToast);
    }
};

export const getTotalDiscountThisMonth = async (addToast: any): Promise<any> => {
    try {
        const response = await api.get('/metrics/total_discount_this_month');
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        throw error;
    }
};

export const getTotalSpendThisMonth = async (addToast: any): Promise<any> => {
    try {
        const response = await api.get('/metrics/total_spend_this_month');
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        throw error;
    }
};


// --- Chart Data Functions ---
const fetchDataForChart = async (instance: any, endpoint: string, filterType: 'monthly' | 'yearly', year: number, toYear?: number) => {
    const params = filterType === 'monthly'
        ? { year }
        : { from_year: year, to_year: toYear };

    const response = await instance.get(endpoint, { params });
    const data = response.data;
    const key = Object.keys(data)[0]; // Handles dynamic response keys

    if (filterType === 'monthly' && data[key]) {
        return data[key].monthly_counts || data[key].monthly_expenses;
    }
    if (filterType === 'yearly' && data[key]) {
        return data[key].yearly_counts || data[key].yearly_expenses;
    }
    return data[key];
};

export const getFinancialObligations = (filterType: 'monthly' | 'yearly', year: number, toYear?: number) => {
    return fetchDataForChart(api, '/metrics/financial_obligations', filterType, year, toYear);
};

export const getInvoiceCount = (filterType: 'monthly' | 'yearly', year: number, toYear?: number) => {
    return fetchDataForChart(api, '/metrics/invoice_count', filterType, year, toYear);
};

export const getSpendByVendor = async (year: number, month?: number) => {
    const params: any = { year };
    if (month) {
        params.month = month;
    }
    const response = await api.get('/metrics/spend_by_vendor', { params });
    return response.data.spend_by_vendor.vendors;
};

export const getDiscountByVendor = async (year: number, month?: number) => {
    const params: any = { year };
    if (month) {
        params.month = month;
    }
    const response = await api.get('/metrics/discount_percent_per_vendor', { params });
    return response.data.discount_percent_per_vendor.vendors;
};

// --- Invoice Details API Functions ---

export const getInvoiceDetails = async (invoiceId: number, addToast: any) => {
    try {
        const response = await api.get(`/invoices/${invoiceId}`);
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        return null;
    }
};

export const getProductDetails = async (invoiceId: number, addToast: any) => {
    try {
        const response = await api.get(`/invoices/${invoiceId}/line-items`);
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        return [];
    }
};

export const getAmountAndTaxDetails = async (invoiceId: number, addToast: any) => {
    try {
        const response = await api.get(`/invoices/${invoiceId}/meta-discount`);
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        return null;
    }
};

export const getLineItems = async (invoiceId: number, itemId: number, addToast: any) => {
    try {
        const response = await api.get(`/invoices/${invoiceId}/line-items/${itemId}/attributes`);
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        return [];
    }
};

// --- Update API Functions ---

export const updateInvoiceDetails = async (invoiceId: number, data: InvoiceDetails, addToast: any) => {
    try {
        console.log("invoice-details: " + JSON.stringify(data));
        
        const response = await api.put(`/invoice/${invoiceId}`, data);
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        return null;
    }
};

export const updateProductDetails = async (invoiceId: number, data: ProductDetails[], addToast: any) => {
    try {
        console.log("product-details: " + JSON.stringify(data));
        const response = await api.put(`/invoice/${invoiceId}/item-summary`, data);
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        return null;
    }
};

export const updateAmountAndTaxDetails = async (invoiceId: number, data: AmountAndTaxDetails, addToast: any) => {
    try {
        console.log("meta-details: " + JSON.stringify(data));
        const response = await api.put(`/invoice/${invoiceId}/meta-discount`, data);
        return response.data;
    } catch (error) {
        handleError(error, addToast);
        return null;
    }
};

export const updateLineItems = async (itemId: number, data: LineItem[], addToast: any) => {
    try {
        const response = await api.put(`/invoice/${itemId}/item-attribute`, data);
        return response.data;
    } catch (error) {
        handleError(error, addToast);
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
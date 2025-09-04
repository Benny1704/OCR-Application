import type { Document, ExtractedData, Log, ProductWithDetails } from './../../interfaces/Types';

const MOCK_API_URL = "http://localhost:8000";
const ARUN_API_URL = "http://10.3.0.52:8000";
const API_URL = "https://32460e62c1ca.ngrok-free.app";

const getAuthToken = () => {
    return localStorage.getItem('token');
};

const getAuthHeaders = (contentType?: string) => {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
    };
    if (contentType) {
        headers['Content-Type'] = contentType;
    }

    return headers;
};

export const login = async (credentials: {username: string, password: string}):Promise<{access_token: string} | null> => {
    try {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        try {
            const response = await fetch(`${API_URL}/users/token`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.error("Login API call failed, trying mock API:", error);
        }

        const mockResponse = await fetch(`${MOCK_API_URL}/users`);
        const users = await mockResponse.json();
        const user = users.find((u: any) => u.username === credentials.username && u.password === 'password');

        if (user) {
            return { access_token: `mock_token_for_${user.username}` };
        }


        return null;
    } catch (error) {
        console.error("Login failed:", error);
        return null;
    }
}

export const alterImage = async (params: { imageData: string; rotation: number; noise: number }, showToast: any): Promise<{ processedImage: { processed_image_base64: string; } | null; processed_image_base64: string } | null> => {
    try {

        const payload: {
            image_base64: string;
            rotate_angle: number;
            denoise_ksize?: number;
        } = {
            image_base64: params.imageData,
            rotate_angle: params.rotation,
        };

        if (params.noise > 0) {
            payload.denoise_ksize = params.noise;
        }

        const response = await fetch(`${ARUN_API_URL}/ocr_preprocessing/process`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        }
        else{
            throw new Error(`API request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error("Image processing failed:", error);
        showToast({ type: 'error', message: 'Image processing failed.' });
        return null;
    }
};

export const uploadFiles = async (files: File[], showToast: any): Promise<{ success: boolean } | null> => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });

    try {
        const response = await fetch(`${API_URL}/upload/upload-invoice`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData,
        });

        if (response.ok) {
            return { success: true };
        } else {
            const errorData = await response.json();
            console.error("Server responded with error:", errorData);
            throw new Error(`Upload failed with status ${response.status}`);
        }
    } catch (error) {
        console.error("File upload failed:", error);
        showToast({ type: 'error', message: 'File upload failed.' });
        return null;
    }
};


export const getDocuments = async (showToast: any): Promise<Document[]> => {
    try {
        const response = await fetch(`${MOCK_API_URL}/documents`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Could not fetch documents:", error);
        showToast({ type: 'error', message: 'Could not fetch documents.' });
        return [];
    }
};

export const getDocument = async (id: number, showToast: any): Promise<Document> => {
    try {
        const response = await fetch(`${MOCK_API_URL}/documents/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Could not fetch document with id ${id}:`, error);
        showToast({ type: 'error', message: `Could not fetch document.` });
        throw error;
    }
};

export const getExtractedData = async (showToast: any): Promise<ExtractedData> => {
    try {
        const response = await fetch(`${MOCK_API_URL}/extractedData`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Could not fetch extracted data:", error);
        showToast({ type: 'error', message: 'Could not fetch extracted data.' });
        throw error;
    }
};

export const getProductData = async (showToast: any): Promise<ProductWithDetails[]> => {
    try {
        const response = await fetch(`${MOCK_API_URL}/productData`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Could not fetch product data:", error);
        showToast({ type: 'error', message: 'Could not fetch product data.' });
        return [];
    }
};

export const getDashboardData = async (showToast: any): Promise<any> => {
    try {
        const response = await fetch(`${MOCK_API_URL}/dashboard`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Could not fetch dashboard data:", error);
        showToast({ type: 'error', message: 'Could not fetch dashboard data.' });
        throw error;
    }
};

export const getLogs = async (showToast: any): Promise<Log[]> => {
    try {
        const response = await fetch(`${MOCK_API_URL}/logs`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Could not fetch logs:", error);
        showToast({ type: 'error', message: 'Could not fetch logs.' });
        return [];
    }
}

const handleResponse = async (response: Response, addToast: any) => {
  if (!response.ok) {
    const error = await response.json();
    addToast({
      id: Date.now(),
      message: error.message || "Something went wrong",
      type: "error",
    });
    throw new Error(error.message || "Something went wrong");
  }
  return response.json();
};

export const getQueuedDocuments = async (addToast: any) => {
  try {
    const response = await fetch(`${MOCK_API_URL}/QueuedDocuments`);
    return await handleResponse(response, addToast);
  } catch (error) {
    console.error("Failed to fetch queued documents:", error);
    return [];
  }
};

export const getProcessedDocuments = async (addToast: any) => {
  try {
    const response = await fetch(`${MOCK_API_URL}/ProcessedDocuments`);
    return await handleResponse(response, addToast);
  } catch (error) {
    console.error("Failed to fetch processed documents:", error);
    return [];
  }
};

export const getFailedDocuments = async (addToast: any) => {
  try {
    const response = await fetch(`${MOCK_API_URL}/FailedDocuments`);
    return await handleResponse(response, addToast);
  } catch (error) {
    console.error("Failed to fetch failed documents:", error);
    return [];
  }
};

export const getFinancialObligations = async (filterType: 'monthly' | 'yearly', year: number, toYear?: number) => {
    const url = filterType === 'monthly'
        ? `${ARUN_API_URL}/metrics/financial_obligations?year=${year}`
        : `${ARUN_API_URL}/metrics/financial_obligations?from_year=${year}&to_year=${toYear}`;

    const response = await fetch(url, { headers: getAuthHeaders() });
    const data = await response.json();
    return filterType === 'monthly' ? data["Financial obligations"].monthly_expenses : data["Financial obligations"].yearly_expenses;
};

export const getInvoiceCount = async (filterType: 'monthly' | 'yearly', year: number, toYear?: number) => {
    const url = filterType === 'monthly'
        ? `${ARUN_API_URL}/metrics/invoice_count?year=${year}`
        : `${ARUN_API_URL}/metrics/invoice_count?from_year=${year}&to_year=${toYear}`;

    const response = await fetch(url, { headers: getAuthHeaders() });
    const data = await response.json();
    console.log(data);
    return filterType === 'monthly' ? data["No. of Invoices"].monthly_counts : data["No. of Invoices"].yearly_counts;
};
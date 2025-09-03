import type { Document, ExtractedData, Log, ProductWithDetails } from './../../interfaces/Types';

const MOCK_API_URL = "http://localhost:8000";
const ARUN_API_URL = "http://10.3.0.52:8000";
const API_URL = "https://29ccf1fd86f6.ngrok-free.app";

const fetchWithFallback = async (url: string, options: any = {}, showToast: any) => {
    try {
        const response = await fetch(url.replace(MOCK_API_URL, API_URL), options);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response;
        } else {
            throw new Error("Received non-JSON response from API");
        }
    } catch (error) {
        console.error("API call failed, falling back to mock data:", error);
        showToast({ type: 'error', message: 'Could not connect to API, using mock data.' });
        const mockResponse = await fetch(url.replace(API_URL, MOCK_API_URL), options);
        if (!mockResponse.ok) {
            throw new Error(`Mock API request failed with status ${mockResponse.status}`);
        }
        return mockResponse;
    }
};

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
  const response = await fetchWithFallback(`${MOCK_API_URL}/documents`, { headers: getAuthHeaders() }, showToast);
  return response.json();
};

export const getDocument = async (id: number, showToast: any): Promise<Document> => {
  const response = await fetchWithFallback(`${MOCK_API_URL}/documents/${id}`, { headers: getAuthHeaders() }, showToast);
  return response.json();
};

export const getExtractedData = async (showToast: any): Promise<ExtractedData> => {
    const response = await fetchWithFallback(`${MOCK_API_URL}/extractedData`, { headers: getAuthHeaders() }, showToast);
    return response.json();
};

export const getProductData = async (showToast: any): Promise<ProductWithDetails[]> => {
    const response = await fetchWithFallback(`${MOCK_API_URL}/productData`, { headers: getAuthHeaders() }, showToast);
    return response.json();
};

export const getDashboardData = async (showToast: any): Promise<any> => {
    const response = await fetchWithFallback(`${MOCK_API_URL}/dashboard`, { headers: getAuthHeaders() }, showToast);
    return response.json();
};

export const getLogs = async (showToast: any): Promise<Log[]> => {
    const response = await fetchWithFallback(`${MOCK_API_URL}/logs`, { headers: getAuthHeaders() }, showToast);
    return response.json();
}
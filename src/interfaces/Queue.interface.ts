export interface documentQueue {
  fileName: string;
  supplier: string;
  invoiceID: string;
  irnNumber: string;
  invoiceDate: string;
  uploadDate: string;
}

export interface Document { id: number; name: string; supplierName: string; status: 'queued' | 'processed' | 'failed' | 'processing'; uploadDate: string; invoiceDate: string; size: string; edited: boolean; isPriority: boolean; invoiceId?: string; irnNumber?: string; }
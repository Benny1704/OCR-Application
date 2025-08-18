export interface documentQueue {
  sno:number;
  fileName: string;
  supplier: string;
  invoiceID: string;
  irnNumber: string;
  invoiceDate: string;
  uploadDate: string;
}

export interface Document { id: number; name: string; supplierName: string; status: 'Queued' | 'Processed' | 'Failed' | 'Processing'; uploadDate: string; invoiceDate: string; size: string; edited: boolean; isPriority: boolean; invoiceId?: string; irnNumber?: string; }
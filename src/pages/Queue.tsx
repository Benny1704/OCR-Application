import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
  useCallback,
} from "react";
import "../assets/styles/Queue.scss";
import DataTable from "../components/common/DataTable";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import type { QueuedDocument, ProcessedDocument, FailedDocument, DataItem, Pagination, ApiResponse } from "../interfaces/Types";
import { useNavigate, useLocation } from "react-router";
import {
  Star,
  FileText,
  Trash2,
  RefreshCw,
  ClipboardClock,
  ClipboardCheck,
  ClipboardX,
  User,
  Database,
  File,
  AlertCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  FileSignature,
  Calendar,
  Hash,
  DollarSign,
  Building,
} from "lucide-react";
import { Dialog, Transition } from '@headlessui/react'
import { RetryModal, StatusBadge } from "../components/common/Helper";
import { motion, AnimatePresence } from "framer-motion";
import { getQueuedDocuments, getProcessedDocuments, getFailedDocuments, deleteMessage, togglePriority, retryMessage } from "../lib/api/Api";
import { documentConfig } from "../lib/config/Config";
import { useToast } from "../hooks/useToast";
import { QueueListSkeleton } from "../components/common/SkeletonLoaders";
import ErrorDisplay from "../components/common/ErrorDisplay";

// --- Helper function to format date/time ---
const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
  const { theme } = useTheme();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${theme === 'dark' ? 'bg-[#1e293b]' : 'bg-white'}`}>
                <Dialog.Title
                  as="h3"
                  className={`text-lg font-medium leading-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                >
                  <ShieldAlert className="w-6 h-6 text-yellow-500" /> {title}
                </Dialog.Title>
                <div className="mt-2">
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {message}
                  </p>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 focus-visible:ring-gray-500' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500'}`}
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    onClick={onConfirm}
                  >
                    Confirm
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// Helper function to format bytes into a readable string
const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const PaginationControls = ({ pagination, onPageChange, theme }: { pagination: Pagination | undefined, onPageChange: (page: number) => void, theme: string }) => {
    if (!pagination || pagination.total_pages <= 1) return null;

    const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const buttonClasses = `flex items-center justify-center p-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`;

    return (
        <div className={`flex items-center justify-between p-2 border-t flex-shrink-0 ${theme === 'dark' ? 'border-gray-700/80' : 'border-gray-200/80'}`}>
            <span className={`text-sm ${textSecondary}`}>
                Page {pagination.page} of {pagination.total_pages}
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={buttonClasses}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.total_pages}
                    className={buttonClasses}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};


const Queue = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const tabs: ("Queued" | "Processed" | "Failed")[] = [
    "Queued",
    "Processed",
    "Failed",
  ];
  const tabRef = useRef<HTMLUListElement>(null);
  const [activeTab, setActiveTab] = useState<"Queued" | "Processed" | "Failed">(() => {
    return location.state?.defaultTab || "Queued";
  });

  const [queuedDocuments, setQueuedDocuments] = useState<QueuedDocument[]>([]);
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [failedDocuments, setFailedDocuments] = useState<FailedDocument[]>([]);

  // NEW FEATURE: State for last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<Record<string, Date | null>>({
    Queued: null,
    Processed: null,
    Failed: null,
  });

  const [pagination, setPagination] = useState<Record<string, Pagination>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [isRetryModalOpen, setRetryModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const fetchDocuments = useCallback(async (isRefresh = false) => {
    setIsLoading(true);
    if (!isRefresh) {
        setError(null);
    }
    try {
        let queuedResponse: ApiResponse<QueuedDocument>;
        let processedResponse: ApiResponse<ProcessedDocument>;
        let failedResponse: ApiResponse<FailedDocument>;

        if (activeTab === 'Queued') {
            queuedResponse = await getQueuedDocuments(addToast, currentPage, pageSize);
            setQueuedDocuments(queuedResponse.data.map((item: any) => ({
                id: item.message_id,
                name: item.file_name,
                size: formatBytes(item.file_size),
                uploadDate: formatDateTime(item.uploaded_on),
                uploadedBy: item.uploaded_by,
                messageId: item.message_id,
                isPriority: item.is_priority,
                status: item.status || "Queued",
                queue_position: item.queue_position,
                supplier_meta: item.supplier_meta,
                invoice_meta: item.invoice_meta
            })));
            setPagination(prev => ({...prev, Queued: queuedResponse.pagination}));
        } else if (activeTab === 'Processed') {
            processedResponse = await getProcessedDocuments(addToast, currentPage, pageSize);
            setProcessedDocuments(processedResponse.data.map((item: any, index: number) => ({
                id: item.message_id,
                sno: (processedResponse.pagination.page - 1) * processedResponse.pagination.page_size + index + 1,
                name: item.file_name,
                supplierName: item.supplier_name,
                supplierNumber: item.supplier_gst_in,
                invoiceNumber: item.invoice_number,
                invoiceId: item.invoice_id,
                irnNumber: item.irn,
                uploadedBy: item.uploaded_by,
                uploadDate: formatDateTime(item.uploaded_at),
                invoiceDate: formatDateTime(item.invoice_date),
                messageId: item.message_id,
                status: item.status,
            })));
            setPagination(prev => ({...prev, Processed: processedResponse.pagination}));
        } else if (activeTab === 'Failed') {
            failedResponse = await getFailedDocuments(addToast, currentPage, pageSize);
            setFailedDocuments(failedResponse.data.map((item: any) => ({
                id: item.message_id,
                name: item.file_name,
                size: formatBytes(item.file_size),
                uploadedBy: item.uploaded_by,
                uploadDate: formatDateTime(item.uploaded_on),
                messageId: item.message_id,
                errorMessage: item.error_message,
                status: "Failed",
                supplier_meta: item.supplier_meta,
                invoice_meta: item.invoice_meta
            })));
            setPagination(prev => ({...prev, Failed: failedResponse.pagination}));
        }
        // NEW FEATURE: Update the timestamp for the active tab
        setLastUpdated(prev => ({ ...prev, [activeTab]: new Date() }));
        if (isRefresh) {
            addToast({ type: 'success', message: `${activeTab} documents updated!` });
        }

    } catch (err: any) {
      setError(err.message || "Failed to fetch documents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, activeTab]);


  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const textHeader = theme === "dark" ? "text-white" : "text-gray-900";
  const textPrimary = theme === "dark" ? "text-gray-200" : "text-gray-700";
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const borderPrimary = theme === "dark" ? "border-gray-700/80" : "border-gray-200/80";

  const documentsForTab = useMemo(() => {
    if (activeTab === "Queued") {
      return [...queuedDocuments].sort((a, b) => {
        if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
        if (a.status === "Processing" && b.status !== "Processing") return -1;
        if (b.status === "Processing" && a.status !== "Processing") return 1;
        return (
          new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
        );
      });
    } else if (activeTab === "Processed") {
      return processedDocuments;
    } else {
      return failedDocuments;
    }
  }, [queuedDocuments, processedDocuments, failedDocuments, activeTab]);

  const allDocuments = useMemo(() => [...queuedDocuments, ...processedDocuments, ...failedDocuments], [queuedDocuments, processedDocuments, failedDocuments]);

  const selectedDocument = useMemo(
    () => allDocuments.find((d) => d.id === selectedDocumentId),
    [selectedDocumentId, allDocuments]
  );

  useEffect(() => {
    // Auto-select the first document if none is selected or if the selected one is no longer in the list
    if (
      documentsForTab.length > 0 &&
      !documentsForTab.some((d) => d.id === selectedDocumentId)
    ) {
      setSelectedDocumentId(documentsForTab[0].id);
    } else if (documentsForTab.length === 0) {
      setSelectedDocumentId(null);
    }
  }, [documentsForTab, selectedDocumentId]);

  useEffect(() => {
    // Reset page to 1 when tab changes
    setCurrentPage(1);
  }, [activeTab]);

  const handleSetPriority = (id: string) => {
    const doc = queuedDocuments.find(d => d.id === id);
    if (!doc || doc.isPriority) return;

    setConfirmationModal({
      isOpen: true,
      title: 'Set as Priority',
      message: 'Are you sure you want to set this document as a priority? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await togglePriority(id, addToast);
          await fetchDocuments();
          addToast({ type: 'success', message: 'Priority updated successfully.' });
        } finally {
          setConfirmationModal({ ...confirmationModal, isOpen: false });
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    if (user?.role !== "admin") return;
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteMessage(id, addToast);
          await fetchDocuments();
          addToast({ type: 'success', message: 'Document deleted successfully.' });
        } finally {
          setConfirmationModal({ ...confirmationModal, isOpen: false });
        }
      }
    });
  };

  const openRetryModal = () => setRetryModalOpen(true);
  const handleSimpleRetry = async () => {
    setRetryModalOpen(false);
    if (selectedDocumentId) {
        addToast({type: 'info', message: 'Sending document for retry...'})
        await retryMessage(selectedDocumentId, addToast);
        await fetchDocuments(true);
    }
  };
  const handleRetryWithAlterations = () => {
    setRetryModalOpen(false);
    navigate("/imageAlteration", { state: { messageId: selectedDocumentId } });
  };

  const updateActivePosition = () => {
    if (tabRef.current) {
      const activeLi = tabRef.current.querySelector(
        ".nav-item.active"
      ) as HTMLElement;
      if (activeLi) {
        tabRef.current.style.setProperty(
          "--position-x-active",
          `${activeLi.offsetLeft}px`
        );
      }
    }
  };

  useLayoutEffect(() => {
    updateActivePosition();
    const observer = new ResizeObserver(() => {
      updateActivePosition();
    });
    if (tabRef.current) observer.observe(tabRef.current);
    return () => {
      if (tabRef.current) observer.unobserve(tabRef.current);
    };
  }, [activeTab]);

  // Improved compact info display component
  const CompactInfo = ({ 
    icon, 
    label, 
    value, 
    className = "" 
  }: { 
    icon: React.ReactNode; 
    label: string; 
    value: string | number; 
    className?: string;
  }) => (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center ${textSecondary}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-xs ${textSecondary}`}>{label}: </span>
        <span className={`text-sm font-medium ${textPrimary} truncate`}>{value}</span>
      </div>
    </div>
  );

  const renderActionCell = (row: DataItem) => {
    const document = row as ProcessedDocument;
    const isReviewed = document.status === "Reviewed";
    
    return (
      <button
        onClick={() => navigate(`/edit/${document.invoiceId}`, { state: { messageId: document.messageId } })}
        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-medium transition-all ${
          isReviewed
            ? theme === "dark"
              ? "bg-green-900/30 text-green-300 hover:bg-green-900/50"
              : "bg-green-100 text-green-700 hover:bg-green-200"
            : theme === "dark"
            ? "bg-blue-900/30 text-blue-300 hover:bg-blue-900/50"
            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
        }`}
      >
        {isReviewed ? <FileSignature className="w-3 h-3" /> : <i className="fi fi-rr-file-edit text-xs"></i>}
        {isReviewed ? "Draft" : "Review"}
      </button>
    );
  };

  const tabIcons = {
    Queued: <ClipboardClock size={16} />,
    Processed: <ClipboardCheck size={16} />,
    Failed: <ClipboardX size={16} />,
  };

  const renderContent = () => {
    if (isLoading && documentsForTab.length === 0) {
      return <QueueListSkeleton />;
    }

    if (error) {
      return <ErrorDisplay message={error} onRetry={() => fetchDocuments()} />;
    }

    if (activeTab === "Processed") {
      return (
        <>
            {/* NEW FEATURE: Last updated and refresh button */}
            <div className={`flex items-center justify-end p-2 text-xs ${textSecondary}`}>
                <p className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Last Updated: <span className={`font-light ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{formatLastUpdated(lastUpdated[activeTab])}</span></p>
                <button
                    onClick={() => fetchDocuments(true)}
                    className={`ml-2 p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                    title="Refresh Documents"
                >
                    <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <DataTable
              tableData={processedDocuments}
              tableConfig={documentConfig}
              isSearchable={true}
              renderActionCell={renderActionCell}
              actionColumnHeader="Review"
              pagination={{
                enabled: true,
                pageSize: 10,
                pageSizeOptions: [5, 10, 25, 50, 100],
              }}
              maxHeight="calc(100vh - 280px)"
              isLoading={isLoading}
              paginationInfo={pagination.Processed}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
        </>
      );
    }

    if (documentsForTab.length > 0) {
      return (
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow overflow-hidden h-full">
          <aside
            className={`rounded-xl border flex flex-col ${theme === "dark" ? "bg-gray-800/20" : "bg-white"
              } ${borderPrimary} overflow-hidden`}
          >
            {/* NEW FEATURE: Header with last updated and refresh button */}
            <div className={`p-3 border-b ${borderPrimary} flex-shrink-0 flex justify-between items-center`}>
              <h3 className={`font-semibold text-base ${textHeader}`}>
                {activeTab} Documents
              </h3>
              <div className={`flex items-center text-xs ${textSecondary}`}>
                <p className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Last Updated: <span className={`font-light ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{formatLastUpdated(lastUpdated[activeTab])}</span></p>
                <button
                    onClick={() => fetchDocuments(true)}
                    className={`ml-2 p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                    title="Refresh Documents"
                >
                    <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="flex-grow p-2 overflow-y-auto">
              {documentsForTab.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocumentId(doc.id)}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 transition-all duration-200 group ${selectedDocumentId === doc.id
                      ? theme === "dark"
                        ? "bg-violet-600/20"
                        : "bg-violet-100"
                      : theme === "dark"
                        ? "hover:bg-gray-700/50"
                        : "hover:bg-gray-100"
                    }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${selectedDocumentId === doc.id
                        ? theme === "dark"
                          ? "bg-violet-600/30 text-violet-300"
                          : "bg-violet-200 text-violet-700"
                        : theme === "dark"
                          ? "bg-gray-700 text-gray-400 group-hover:bg-gray-600/80 group-hover:text-gray-300"
                          : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-600"
                      }`}
                  >
                    <File size={18} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p
                      className={`font-semibold text-sm flex gap-2 items-center truncate ${textHeader}`}
                    >
                      {doc.name}
                      {'isPriority' in doc && doc.isPriority && (
                        <Star
                          className="w-3.5 h-3.5 text-yellow-400"
                          fill="currentColor"
                        />
                      )}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} theme={theme} />
                </button>
              ))}
            </div>
            <PaginationControls pagination={pagination[activeTab]} onPageChange={setCurrentPage} theme={theme} />
          </aside>

          <section
            className={`lg:col-span-2 rounded-xl border flex flex-col ${theme === "dark" ? "bg-gray-800/20" : "bg-white"
              } ${borderPrimary}`}
          >
            {selectedDocument ? (
              <div className="h-full flex flex-col p-4">
                <div className="flex justify-between items-start pb-3 flex-shrink-0">
                  <div className="flex-1 overflow-hidden pr-4">
                    <h3
                      className={`text-lg font-bold truncate ${textHeader}`}
                    >
                      {selectedDocument.name}
                    </h3>
                    <p className={`text-xs ${textSecondary}`}>
                      Uploaded on {selectedDocument.uploadDate}
                    </p>
                  </div>
                  <StatusBadge
                    status={selectedDocument.status}
                    large
                    theme={theme}
                  />
                </div>
                <hr className={`flex-shrink-0 ${borderPrimary}`} />

                <div className="py-3 space-y-3 flex-grow overflow-y-auto">
                  {activeTab === "Queued" && 'queue_position' in selectedDocument && selectedDocument.queue_position !== null && (
                    <div className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-blue-900/20 border-blue-700/40' : 'bg-blue-50 border-blue-200'}`}>
                      <CompactInfo 
                        icon={<ClipboardClock size={16} />} 
                        label="Queue Position" 
                        value={`${selectedDocument.queue_position} document${selectedDocument.queue_position === 1 ? '' : 's'} ahead`}
                      />
                    </div>
                  )}

                  {activeTab === "Failed" &&
                    'errorMessage' in selectedDocument &&
                    selectedDocument.errorMessage && (
                      <div
                        className={`p-2 rounded-lg border text-xs ${theme === "dark"
                            ? "bg-red-900/20 border-red-700/40"
                            : "bg-red-50 border-red-200"
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle
                            className={`w-4 h-4 flex-shrink-0 mt-0.5 ${theme === "dark"
                                ? "text-red-400"
                                : "text-red-500"
                              }`}
                          />
                          <div>
                            <p
                              className={`font-semibold text-xs ${theme === "dark"
                                  ? "text-red-300"
                                  : "text-red-800"
                                }`}
                            >
                              Processing Error
                            </p>
                            <p
                              className={`mt-1 text-xs ${theme === "dark"
                                  ? "text-red-400"
                                  : "text-red-700"
                                }`}
                            >
                              {selectedDocument.errorMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Compact Document Information */}
                  <div>
                    <h4 className={`font-semibold text-sm mb-2 ${textHeader}`}>
                      Document Information
                    </h4>
                    <div className={`p-2 rounded-lg border space-y-1.5 ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60" : "bg-gray-50 border-gray-200"}`}>
                      <CompactInfo 
                        icon={<Database size={14} />} 
                        label="Size" 
                        value={'size' in selectedDocument ? (selectedDocument as QueuedDocument | FailedDocument).size : 'N/A'}
                      />
                      <CompactInfo 
                        icon={<User size={14} />} 
                        label="Uploaded By" 
                        value={selectedDocument.uploadedBy || "Admin"}
                      />
                    </div>
                  </div>
                  
                  {/* Compact Supplier Information */}
                  {(activeTab === "Queued" || activeTab === "Failed") && 'supplier_meta' in selectedDocument && selectedDocument.supplier_meta && (
                    <div>
                      <h4 className={`font-semibold text-sm mb-2 ${textHeader}`}>
                        Supplier Information
                      </h4>
                      <div className={`p-2 rounded-lg border space-y-1.5 ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60" : "bg-gray-50 border-gray-200"}`}>
                        <CompactInfo 
                          icon={<Building size={14} />} 
                          label="Name" 
                          value={selectedDocument.supplier_meta.supplier_name} 
                        />
                        <CompactInfo 
                          icon={<Hash size={14} />} 
                          label="GST" 
                          value={selectedDocument.supplier_meta.supplier_gst_in} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Compact Invoice Information */}
                  {(activeTab === "Queued" || activeTab === "Failed") && 'invoice_meta' in selectedDocument && selectedDocument.invoice_meta && (
                    <div>
                      <h4 className={`font-semibold text-sm mb-2 ${textHeader}`}>
                        Invoice Information
                      </h4>
                      <div className={`p-2 rounded-lg border space-y-1.5 ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60" : "bg-gray-50 border-gray-200"}`}>
                        <CompactInfo 
                          icon={<FileText size={14} />} 
                          label="Number" 
                          value={selectedDocument.invoice_meta.invoice_no} 
                        />
                        <CompactInfo 
                          icon={<DollarSign size={14} />} 
                          label="Amount" 
                          value={selectedDocument.invoice_meta.invoice_amount} 
                        />
                        <CompactInfo 
                          icon={<Calendar size={14} />} 
                          label="Date" 
                          value={formatDateTime(selectedDocument.invoice_meta.invoice_date)} 
                        />
                      </div>
                    </div>
                  )}
                </div>
                <hr className={`flex-shrink-0 ${borderPrimary}`} />

                {user?.role === 'admin' && (
                  <div className="pt-3 flex-shrink-0">
                    <h4 className={`font-semibold text-sm mb-2 ${textHeader}`}>
                      Actions
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {activeTab === "Queued" && (
                        <>
                          <button
                            onClick={() =>
                              handleSetPriority(selectedDocument.id)
                            }
                            disabled={
                              selectedDocument.status === "Processing" || ('isPriority' in selectedDocument && selectedDocument.isPriority)
                            }
                            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${theme === "dark"
                                ? "bg-gray-700 border border-gray-600 text-white hover:bg-gray-600"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                              }`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${'isPriority' in selectedDocument && selectedDocument.isPriority
                                  ? "text-yellow-400"
                                  : ""
                                }`}
                              fill={
                                'isPriority' in selectedDocument && selectedDocument.isPriority
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                            Priority
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(selectedDocument.id)
                            }
                            disabled={
                              selectedDocument.status === "Processing"
                            }
                            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${theme === "dark"
                                ? "bg-red-900/40 border border-red-700/60 text-red-300 hover:bg-red-900/60"
                                : "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                              }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </>
                      )}
                      {activeTab === "Failed" && (
                        <>
                          <button
                            onClick={() => navigate(`/manualEntry/${selectedDocument.id}`, { state: { messageId: selectedDocument.messageId } })}
                            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${theme === "dark"
                                ? "bg-blue-900/40 border border-blue-700/60 text-blue-300 hover:bg-blue-900/60"
                                : "bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100"
                              }`}
                          >
                            <i className="fi fi-rr-add-document text-xs"></i> Manual Entry
                          </button>
                          <button
                            onClick={openRetryModal}
                            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${theme === "dark"
                                ? "bg-yellow-900/40 border border-yellow-700/60 text-yellow-300 hover:bg-yellow-900/60"
                                : "bg-yellow-50 border border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                              }`}
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Retry
                          </button>
                        </>
                      )}
                    </div>
                    {selectedDocument.status === "Processing" && (
                      <p
                        className={`text-xs mt-2 ${theme === "dark"
                            ? "text-yellow-400"
                            : "text-yellow-600"
                          }`}
                      >
                        Cannot perform actions while processing.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div
                  className={`flex items-center justify-center w-16 h-16 rounded-full mb-4 ${theme === "dark"
                      ? "bg-violet-600/10 text-violet-400"
                      : "bg-violet-100 text-violet-600"
                    }`}
                >
                  <FileText className="w-8 h-8" />
                </div>
                <h3
                  className={`text-lg font-semibold ${textHeader}`}
                >
                  Select a document
                </h3>
                <p className={`text-sm ${textSecondary}`}>
                  Choose a document to view its details.
                </p>
              </div>
            )}
          </section>
        </main>
      );
    }

    return (
      <div className="flex-grow flex flex-col justify-center items-center text-center py-12">
        <div
          className={`flex items-center justify-center w-20 h-20 rounded-full mb-4 ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"
            }`}
        >
          <FileText className={`w-10 h-10 ${textSecondary}`} />
        </div>
        <p className={`font-semibold text-base ${textHeader}`}>
          No {activeTab.toLowerCase()} documents found
        </p>
        <p className={`text-sm mt-1 ${textSecondary}`}>
          This queue is currently empty.
        </p>
      </div>
    );
  };


  return (
    <div className="queue-container animate-fade-in-up">
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />
      <div className="tab-container">
        <div className="header">
          <div className="left-shape">
            <h1>Document Queue</h1>
          </div>
          <div className="tabs">
            <ul ref={tabRef}>
              {tabs.map((tab) => (
                <li
                  key={tab}
                  className={activeTab === tab ? "nav-item active" : "nav-item"}
                  onClick={() => setActiveTab(tab)}
                >
                  <span className="dot"></span>
                  <p className="text">{tab}</p>
                </li>
              ))}
              <div className="tab-effect"></div>
            </ul>
          </div>
          <div className="right-shape">
            <div className={`active-tab ${activeTab.toLowerCase()}`}>
              {tabIcons[activeTab]}
              {activeTab}
              <div className="badge">{pagination[activeTab]?.total_items || 0}</div>
            </div>
          </div>
        </div>

        <div className="content">
          <RetryModal
            isOpen={isRetryModalOpen}
            onClose={() => setRetryModalOpen(false)}
            onRetry={handleSimpleRetry}
            onRetryWithAlterations={handleRetryWithAlterations}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full flex flex-col"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Queue;
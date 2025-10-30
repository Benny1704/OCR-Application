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
import { useLocation } from "react-router";
import {
  Star,
  FileText,
  Trash2,
  RefreshCw,
  ClipboardClock,
  User,
  Database,
  File,
  AlertCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  Calendar,
  Hash,
  DollarSign,
  Building,
  FilePen,
  FilePlus,
} from "lucide-react";
import { Dialog, Transition } from '@headlessui/react'
import { NoDataDisplay, RefreshPillButton, RetryModal, StatusBadge } from "../components/common/Helper";
import { motion, AnimatePresence } from "framer-motion";
import { getQueuedDocuments, getProcessedDocuments, getFailedDocuments, deleteMessage, togglePriority, retryMessage } from "../lib/api/Api";
import { documentConfig } from "../lib/config/Config";
import { useToast } from "../hooks/useToast";
import { QueueListSkeleton } from "../components/common/SkeletonLoaders";
import ErrorDisplay from "../components/common/ErrorDisplay";
import { useSections } from "../contexts/SectionContext";
import PillToggle from "../components/common/PillToggle";
import { useAppNavigation } from "../hooks/useAppNavigation";

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
  const { navigate, updateCurrentState } = useAppNavigation();
  const location = useLocation();
  const { addToast, toasts } = useToast(); // MODIFIED: Get toasts array
  const { getSectionNameById, sectionFilter, setSectionFilter } = useSections();
  const isInitialMount = useRef(true);

  const tabs: ("Queued" | "Yet to Review" | "Failed")[] = [
    "Queued",
    "Yet to Review",
    "Failed",
  ];
  const tabRef = useRef<HTMLUListElement>(null);
  
  const [activeTab, setActiveTab] = useState<"Queued" | "Yet to Review" | "Failed">(() => {
    return location.state?.queueState?.activeTab || "Queued";
  });

  const [queuedDocuments, setQueuedDocuments] = useState<QueuedDocument[]>([]);
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [failedDocuments, setFailedDocuments] = useState<FailedDocument[]>([]);

  const [lastUpdated, setLastUpdated] = useState<Record<string, Date | null>>({
    Queued: null,
    "Yet to Review": null,
    Failed: null,
  });

  const [pagination, setPagination] = useState<Record<string, Pagination>>({});
  
  const [currentPage, setCurrentPage] = useState(() => {
    return location.state?.queueState?.currentPage || 1;
  });
  
  const [pageSizes, setPageSizes] = useState<Record<string, number>>(() => {
    return location.state?.queueState?.pageSizes || {
      "Queued": 10,
      "Yet to Review": 10,
      "Failed": 10,
    };
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [isRetryModalOpen, setRetryModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    updateCurrentState({
      queueState: {
        activeTab,
        currentPage,
        pageSizes,
        sectionFilter,
      },
    });
  }, [activeTab, currentPage, pageSizes, sectionFilter, updateCurrentState]);

  const getSectionId = useCallback(() => {
    if (!user) return undefined;
    if (user.role === 'admin') {
        return sectionFilter === 'current' ? user.section : undefined;
    }
    return user.section;
  }, [user, sectionFilter]);

  const fetchDocuments = useCallback(async (isRefresh = false) => {
    if (!user) return;
    setIsLoading(true);
    if (!isRefresh) {
        setError(null);
    }
    try {
        const sectionId = getSectionId();
        const pageSize = pageSizes[activeTab];
        let queuedResponse: ApiResponse<QueuedDocument>;
        let processedResponse: ApiResponse<ProcessedDocument>;
        let failedResponse: ApiResponse<FailedDocument>;

        if (activeTab === 'Queued') {
            queuedResponse = await getQueuedDocuments(currentPage, pageSize, sectionId);
            if (Array.isArray(queuedResponse.data)) {
              setQueuedDocuments(queuedResponse.data.map((item: any) => ({
                  id: item.message_id,
                  name: item.file_name,
                  size: formatBytes(item.file_size),
                  uploadDate: formatDateTime(item.uploaded_on),
                  uploadedBy: item.uploaded_by,
                  messageId: item.message_id,
                  sectionName: item.section_name,
                  isPriority: item.is_priority,
                  status: item.status || "Queued",
                  queue_position: item.queue_position,
                  supplier_meta: item.supplier_meta,
                  invoice_meta: item.invoice_meta
              })));
            }
            setPagination(prev => ({...prev, Queued: queuedResponse.pagination}));
        } else if (activeTab === 'Yet to Review') {
            processedResponse = await getProcessedDocuments(currentPage, pageSize, sectionId);
            if (Array.isArray(processedResponse.data)) {
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
                  sectionName: item.section_name,
                  uploadDate: formatDateTime(item.uploaded_at),
                  invoiceDate: formatDateTime(item.invoice_date),
                  messageId: item.message_id,
                  status: item.status,
              })));
            }
            setPagination(prev => ({...prev, "Yet to Review": processedResponse.pagination}));
        } else if (activeTab === 'Failed') {
            failedResponse = await getFailedDocuments(currentPage, pageSize, sectionId);
            if (Array.isArray(failedResponse.data)) {
              setFailedDocuments(failedResponse.data.map((item: any) => ({
                  id: item.message_id,
                  name: item.file_name,
                  size: formatBytes(item.file_size),
                  uploadedBy: item.uploaded_by,
                  uploadDate: formatDateTime(item.uploaded_on),
                  messageId: item.message_id,
                  sectionName: item.section_name,
                  errorMessage: item.error_message,
                  status: "failed",
                  supplier_meta: item.supplier_meta,
                  invoice_meta: item.invoice_meta
              })));
            }
            setPagination(prev => ({...prev, Failed: failedResponse.pagination}));
        }
        setLastUpdated(prev => ({ ...prev, [activeTab]: new Date() }));
        if (isRefresh) {
            // MODIFIED: Check for existing toast before adding a new one
            const refreshMessage = `${activeTab} documents updated!`;
            if (!toasts.some(toast => toast.message === refreshMessage)) {
                addToast({ type: 'success', message: refreshMessage });
            }
        }

    } catch (err: any) {
      setError(err.message || "Failed to fetch documents. Please try again.");
      setLastUpdated(prev => ({ ...prev, [activeTab]: null })); // Clear update time on error
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSizes, activeTab, getSectionId, user, toasts]); // MODIFIED: Add toasts to dependency array


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
        if (a.status === "processing" && b.status !== "processing") return -1;
        if (b.status === "processing" && a.status !== "processing") return 1;
      
        if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
      
        return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      });
    } else if (activeTab === "Yet to Review") {
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
    setCurrentPage(1);
  }, [activeTab]);

  const handleNavigateToEdit = useCallback((invoiceId: string, messageId: string) => {
    navigate(`/edit/${invoiceId}`, {
      state: {
        messageId,
        fromQueue: true,
        queueState: {
          activeTab,
          currentPage,
          pageSizes,
          sectionFilter
        }
      }
    });
  }, [navigate, activeTab, currentPage, pageSizes, sectionFilter]);

  const handleNavigateToManualEntry = useCallback((id: string, messageId: string) => {
    navigate(`/manualEntry/${id}`, {
      state: {
        messageId,
        fromQueue: true,
        queueState: {
          activeTab,
          currentPage,
          pageSizes,
          sectionFilter
        }
      }
    });
  }, [navigate, activeTab, currentPage, pageSizes, sectionFilter]);

  const handleNavigateToImageAlteration = useCallback((messageId: string) => {
    navigate("/imageAlteration", {
      state: {
        messageId,
        fromQueue: true,
        queueState: {
          activeTab,
          currentPage,
          pageSizes,
          sectionFilter
        }
      }
    });
  }, [navigate, activeTab, currentPage, pageSizes, sectionFilter]);

  const handleSetPriority = (id: string) => {
    const doc = queuedDocuments.find(d => d.id === id);
    if (!doc || doc.isPriority) return;

    setConfirmationModal({
      isOpen: true,
      title: 'Set as Priority',
      message: 'Are you sure you want to set this document as a priority? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await togglePriority(id);
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
          await deleteMessage(id);
          await fetchDocuments();
          addToast({ type: 'success', message: 'Document deleted successfully.' });
        } finally {
          setConfirmationModal({ ...confirmationModal, isOpen: false });
        }
      }
    });
  };

  const handleSimpleRetry = async () => {
    setRetryModalOpen(false);
    if (selectedDocumentId) {
        addToast({type: 'info', message: 'Sending document for retry...'})
        await retryMessage(selectedDocumentId);
        await fetchDocuments(true);
    }
  };
  
  const handleRetryWithAlterations = () => {
    setRetryModalOpen(false);
    handleNavigateToImageAlteration(selectedDocumentId!);
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
      if (tabRef.current) {
        observer.unobserve(tabRef.current)
      }
    };
  }, [activeTab]);

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
    const isReviewed = document.status === "reviewed";
    
    return (
      <button
        onClick={() => handleNavigateToEdit(document.invoiceId, document.messageId)}
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
        {isReviewed ? <FileSignature className="w-3 h-3" /> : <FilePen className="w-3 h-3" />}
        {isReviewed ? "Draft" : "Review"}
      </button>
    );
  };

  const renderContent = () => {
    if (isLoading && documentsForTab.length === 0) {
      return <QueueListSkeleton />;
    }

    if (error) {
      return <ErrorDisplay message={error} onRetry={() => fetchDocuments()} />;
    }

    if (activeTab === "Yet to Review") {
      return (
        <>
            {/* <div className="flex items-center justify-end p-2 text-xs">
                <RefreshPillButton
                    lastUpdatedDate={lastUpdated[activeTab]}
                    theme={theme}
                    isLoading={isLoading}
                    onRefresh={() => fetchDocuments(true)}
                />
            </div> */}
            <DataTable
              tableData={processedDocuments}
              tableConfig={documentConfig}
              isSearchable={true}
              renderActionCell={renderActionCell}
              actionColumnHeader="Review"
              pagination={{
                enabled: true,
                pageSize: pageSizes[activeTab],
                pageSizeOptions: [5, 10, 25, 50, 100],
              }}
              maxHeight="calc(100vh - 240px)"
              isLoading={isLoading}
              paginationInfo={pagination["Yet to Review"]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => setPageSizes(prev => ({ ...prev, "Yet to Review": size }))}
              isRefreshable={true}
              isRefreshing={isLoading}
              lastUpdatedDate={lastUpdated[activeTab]}
              onRefresh={() => fetchDocuments(true)}
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
            <div className={`p-3 border-b ${borderPrimary} flex-shrink-0 flex justify-between items-center`}>
              <h3 className={`font-semibold  text-base md:text-[10px] ${textHeader}`}>
                {activeTab} Documents
              </h3>
                <RefreshPillButton
                    lastUpdatedDate={lastUpdated[activeTab]}
                    theme={theme}
                    isLoading={isLoading}
                    onRefresh={() => fetchDocuments(true)}
                />
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
                  <div className={`font-semibold text-sm flex gap-2 items-center truncate ${textHeader}`}>
                      <span className="truncate">{doc.name}</span>
                      {'isPriority' in doc && doc.isPriority && (
                        <Star
                          className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0"
                          fill="currentColor"
                        />
                      )}
                    </div>
                    <p className={`text-xs truncate ${textSecondary}`}>{doc.sectionName}</p>
                  </div>
                  <StatusBadge status={doc.status} theme={theme} />
                </button>
              ))}
            </div>
            <PaginationControls pagination={pagination[activeTab]} onPageChange={setCurrentPage} theme={theme} />
          </aside>

          <section
            className={`lg:col-span-2 rounded-xl border flex flex-col min-h-0 ${theme === "dark" ? "bg-gray-800/20" : "bg-white"
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

                {((activeTab === 'Queued' && user?.role === 'admin') || activeTab === 'Failed') && (
                  <div className="pt-3 flex-shrink-0">
                    <h4 className={`font-semibold text-sm mb-2 ${textHeader}`}>
                      Actions
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {activeTab === "Queued" && user?.role === 'admin' && (
                        <>
                          <button
                            onClick={() =>
                              handleSetPriority(selectedDocument.id)
                            }
                            disabled={
                              selectedDocument.status === "processing" || ('isPriority' in selectedDocument && selectedDocument.isPriority)
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
                              selectedDocument.status === "processing"
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
                            onClick={() => handleNavigateToManualEntry(selectedDocument.id, selectedDocument.messageId)}
                            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${theme === "dark"
                                ? "bg-blue-900/40 border border-blue-700/60 text-blue-300 hover:bg-blue-900/60"
                                : "bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100"
                              }`}
                          >
                            <FilePlus className="h-3.5 w-3.5"/> Manual Entry
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              onClick={handleSimpleRetry}
                              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${theme === "dark"
                                  ? "bg-yellow-900/40 border border-yellow-700/60 text-yellow-300 hover:bg-yellow-900/60"
                                  : "bg-yellow-50 border border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                                }`}
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Retry
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {selectedDocument.status === "processing" && user?.role === 'admin' && (
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
                <NoDataDisplay heading={`No ${activeTab.toLowerCase()} documents found`} message="This queue is currently empty."/>
      </div>
    );
  };
  
  const sectionName = user?.section ? getSectionNameById(user.section) : '';

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
            <div className="flex flex-col items-start justify-end">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold">Document Queue</h1>
                <span className={`inline-flex items-center justify-center min-w-[2rem] h-6 px-2.5 rounded-full text-xs font-semibold transition-colors ${
                  theme === 'dark' 
                    ? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30' 
                    : 'bg-violet-100 text-violet-700 ring-1 ring-violet-200'
                }`}>
                  {pagination[activeTab]?.total_items || 0}
                </span>
              </div>
              {sectionFilter === 'current' && sectionName && (
                <p className={`text-sm font-light ${textSecondary}`}>
                  {sectionName}
                </p>
              )}
            </div>
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
                  <p className="text">
                    {tab}
                  </p>
                </li>
              ))}
              <div className="tab-effect"></div>
            </ul>
          </div>
          <div className="right-shape">
            {user?.role === 'admin' && (
              <PillToggle
                  options={[
                      { label: 'Overall', value: 'overall' },
                      { label: 'Current Section', value: 'current' },
                  ]}
                  selected={sectionFilter}
                  onSelect={setSectionFilter}
              />
            )}
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
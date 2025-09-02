import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "../assets/styles/Queue.scss";
import DataTable from "../components/common/DataTable";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import type { Document } from "../interfaces/Types";
import { useNavigate } from "react-router";
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
} from "lucide-react";
import { RetryModal, StatusBadge } from "../components/common/Helper";
import { motion, AnimatePresence } from "framer-motion";
import { getDocuments } from "../lib/api/Api";
import { documentConfig } from "../lib/config/Config";
import { useToast } from "../hooks/useToast";

const Queue = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const tabs: ("Queued" | "Processed" | "Failed")[] = [
    "Queued",
    "Processed",
    "Failed",
  ];
  const tabRef = useRef<HTMLUListElement>(null);
  const [activeTab, setActiveTab] = useState<"Queued" | "Processed" | "Failed">("Queued");

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null
  );
  const [isRetryModalOpen, setRetryModalOpen] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
        const data = await getDocuments(addToast);
        setDocuments(data);
    };
    fetchDocuments();
  }, [])

  // --- Theme-based text colors for convenience ---
  const textHeader = theme === "dark" ? "text-white" : "text-gray-900";
  const textPrimary = theme === "dark" ? "text-gray-200" : "text-gray-700";
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const borderPrimary = theme === "dark" ? "border-gray-700/80" : "border-gray-200/80";

  useEffect(() => {
    const interval = setInterval(() => {
      setDocuments((currentDocs) => {
        const queuedDocs = currentDocs.filter(
          (d) => d.status === "Queued" && !d.isPriority
        );
        const priorityDoc = currentDocs.find(
          (d) => d.status === "Queued" && d.isPriority
        );
        if (!priorityDoc && queuedDocs.length === 0) return currentDocs;
        
        const docToProcess = priorityDoc || queuedDocs[0];
        if (!docToProcess) return currentDocs;

        const updatedDocs = currentDocs.map((d) =>
          d.id === docToProcess.id ? { ...d, status: "Processing" as const } : d
        );
        setTimeout(() => {
          setDocuments((prevDocs) =>
            prevDocs.map((d) =>
              d.id === docToProcess.id
                ? { ...d, status: "Processed" as const, isPriority: false }
                : d
            )
          );
        }, 2000);
        return updatedDocs;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const documentsForTab = useMemo(() => {
    let list: Document[] = [];
    if (activeTab === "Queued") {
      list = documents.filter(
        (d) => d.status === "Queued" || d.status === "Processing"
      );
      list.sort((a, b) => {
        if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
        if (a.status === "Processing" && b.status !== "Processing") return -1;
        if (b.status === "Processing" && a.status !== "Processing") return 1;
        return (
          new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
        );
      });
    } else if (activeTab === "Processed") {
      list = documents.filter((d) => d.status === "Processed");
    } else {
      list = documents.filter((d) => d.status === "Failed");
    }
    return list;
  }, [documents, activeTab]);

  const selectedDocument = useMemo(
    () => documents.find((d) => d.id === selectedDocumentId),
    [selectedDocumentId, documents]
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

  const handleSetPriority = (id: number) => {
    setDocuments((docs) =>
      docs.map((doc) =>
        doc.id === id ? { ...doc, isPriority: !doc.isPriority } : doc
      )
    );
  };

  const handleDelete = (id: number) => {
    if (user?.role !== "admin") return;
    setDocuments((docs) => docs.filter((doc) => doc.id !== id));
  };

  const openRetryModal = () => setRetryModalOpen(true);
  const handleSimpleRetry = () => {
    setRetryModalOpen(false);
    navigate("/loading");
  };
  const handleRetryWithAlterations = () => {
    setRetryModalOpen(false);
    navigate("/imageAlteration");
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

  const InfoCard = ({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
  }) => (
    <div
      className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${
        theme === "dark"
          ? "bg-gray-800/60 border border-gray-700/80"
          : "bg-gray-100 border border-gray-200"
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          theme === "dark"
            ? "bg-violet-600/10 text-violet-400"
            : "bg-violet-100 text-violet-600"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className={`text-xs ${textSecondary}`}>{label}</p>
        <p className={`font-semibold text-sm ${textPrimary}`}>{value}</p>
      </div>
    </div>
  );

  const EditButton = () => (
    <button className="edit-btn" onClick={() => navigate("/edit")}>
      <i className="fi fi-rr-file-edit"></i> Review
    </button>
  );

  const tabIcons = {
    Queued: <ClipboardClock size={16} />,
    Processed: <ClipboardCheck size={16} />,
    Failed: <ClipboardX size={16} />,
  };

  return (
    <div className="queue-container animate-fade-in-up">
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
              <div className="badge">{documentsForTab.length}</div>
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
              {activeTab === "Processed" ? (
                <div className="flex-grow overflow-auto">
                  <DataTable
                    tableData={JSON.parse(JSON.stringify(documentsForTab))}
                    tableConfig={documentConfig}
                    isSearchable={true}
                    renderActionCell={EditButton}
                    actionColumnHeader="Review"
                    pagination={{
                      enabled: true,
                      pageSize: 10,
                      pageSizeOptions: [5, 10, 25, 50, 100],
                    }}
                    maxHeight="100%"
                  />
                </div>
              ) : documentsForTab.length > 0 ? (
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow overflow-hidden">
                  <aside
                    className={`rounded-xl border flex flex-col ${
                      theme === "dark" ? "bg-gray-800/20" : "bg-white"
                    } ${borderPrimary}`}
                  >
                    <div className={`p-3 border-b ${borderPrimary}`}>
                      <h3 className={`font-semibold text-base ${textHeader}`}>
                        {activeTab} Documents
                      </h3>
                    </div>
                    <div className="flex-grow p-2 overflow-y-auto">
                      {documentsForTab.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDocumentId(doc.id)}
                          className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 transition-all duration-200 group ${
                            selectedDocumentId === doc.id
                              ? theme === "dark"
                                ? "bg-violet-600/20"
                                : "bg-violet-100"
                              : theme === "dark"
                              ? "hover:bg-gray-700/50"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                              selectedDocumentId === doc.id
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
                              {doc.isPriority && (
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
                  </aside>

                  <section
                    className={`lg:col-span-2 rounded-xl border flex flex-col ${
                      theme === "dark" ? "bg-gray-800/20" : "bg-white"
                    } ${borderPrimary}`}
                  >
                    {selectedDocument ? (
                      <div className="h-full flex flex-col p-4">
                        <div className="flex justify-between items-start pb-4 flex-shrink-0">
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

                        <div className="py-4 space-y-4 flex-grow overflow-y-auto">
                          {activeTab === "Failed" &&
                            selectedDocument.errorMessage && (
                              <div
                                className={`p-3 rounded-lg flex items-start gap-3 text-xs ${
                                  theme === "dark"
                                    ? "bg-red-900/20 border border-red-700/40"
                                    : "bg-red-50 border border-red-200"
                                }`}
                              >
                                <AlertCircle
                                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                    theme === "dark"
                                      ? "text-red-400"
                                      : "text-red-500"
                                  }`}
                                />
                                <div>
                                  <p
                                    className={`font-semibold ${
                                      theme === "dark"
                                        ? "text-red-300"
                                        : "text-red-800"
                                    }`}
                                  >
                                    Processing Error
                                  </p>
                                  <p
                                    className={`mt-1 ${
                                      theme === "dark"
                                        ? "text-red-400"
                                        : "text-red-700"
                                    }`}
                                  >
                                    {selectedDocument.errorMessage}
                                  </p>
                                </div>
                              </div>
                            )}

                          <div>
                            <h4
                              className={`font-semibold text-base mb-3 ${textHeader}`}
                            >
                              Document Information
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <InfoCard
                                icon={<Database size={18} />}
                                label="File Size"
                                value={selectedDocument.size}
                              />
                              <InfoCard
                                icon={<User size={18} />}
                                label="Uploaded By"
                                value={selectedDocument.uploadedBy || "Admin"}
                              />
                            </div>
                          </div>
                        </div>
                        <hr className={`flex-shrink-0 ${borderPrimary}`} />

                        <div className="pt-4 flex-shrink-0">
                          <h4
                            className={`font-semibold text-base mb-3 ${textHeader}`}
                          >
                            Actions
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            {activeTab === "Queued" &&
                              user?.role === "admin" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleSetPriority(selectedDocument.id)
                                    }
                                    disabled={
                                      selectedDocument.status === "Processing"
                                    }
                                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-semibold shadow-sm transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                                      theme === "dark"
                                        ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                                    }`}
                                  >
                                    <Star
                                      className={`w-3.5 h-3.5 ${
                                        selectedDocument.isPriority
                                          ? "text-yellow-400"
                                          : ""
                                      }`}
                                      fill={
                                        selectedDocument.isPriority
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
                                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-semibold shadow-sm transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                                      theme === "dark"
                                        ? "bg-red-900/40 border-red-700/60 text-red-300 hover:bg-red-900/60"
                                        : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                    }`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </>
                              )}
                            {activeTab === "Failed" && (
                              <>
                                <button
                                  onClick={() => navigate('/manualEntry')}
                                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-semibold shadow-sm transition-all border ${
                                    theme === "dark"
                                      ? "bg-blue-900/40 border-blue-700/60 text-blue-300 hover:bg-blue-900/60"
                                      : "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                                  }`}
                                >
                                  <i className="fi fi-rr-add-document"></i> Manual Entry
                                </button>
                                {user?.role === "admin" && (
                                  <button
                                    onClick={openRetryModal}
                                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-semibold shadow-sm transition-all border ${
                                      theme === "dark"
                                        ? "bg-yellow-900/40 border-yellow-700/60 text-yellow-300 hover:bg-yellow-900/60"
                                        : "bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                                    }`}
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                          {selectedDocument.status === "Processing" && (
                            <p
                              className={`text-xs mt-3 ${
                                theme === "dark"
                                  ? "text-yellow-400"
                                  : "text-yellow-600"
                              }`}
                            >
                              Cannot perform actions while processing.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div
                          className={`flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                            theme === "dark"
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
              ) : (
                <div className="flex-grow flex flex-col justify-center items-center text-center py-12">
                  <div
                    className={`flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                      theme === "dark" ? "bg-gray-800" : "bg-gray-100"
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
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Queue;
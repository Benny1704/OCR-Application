import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "../assets/styles/Queue.scss";
import DataTable from "../components/common/DataTable";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { documentConfig, initialMockDocuments } from "../lib/MockData";
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
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import type { ColDef } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);
interface IRow {
  make: string;
  model: string;
  price: number;
  electric: boolean;
}
const Queue = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rowData, setRowData] = useState<IRow[]>([
    { make: "Tesla", model: "Model Y", price: 64950, electric: true },
    { make: "Ford", model: "F-Series", price: 33850, electric: false },
    { make: "Toyota", model: "Corolla", price: 29600, electric: false },
    { make: "Mercedes", model: "EQA", price: 48890, electric: true },
    { make: "Fiat", model: "500", price: 15774, electric: false },
    { make: "Nissan", model: "Juke", price: 20675, electric: false },
  ]);

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState<ColDef<IRow>[]>([
    { field: "make" },
    { field: "model" },
    { field: "price" },
    { field: "electric" },
  ]);

  const defaultColDef: ColDef = {
    flex: 1,
  };

  const EditButton = () => {
    return (
      <button className="edit-btn" onClick={() => navigate("/edit")}>
        <i className="fi fi-rr-file-edit"></i> Review
      </button>
    );
  };

  const tabs: ("Queued" | "Processed" | "Failed")[] = [
    "Queued",
    "Processed",
    "Failed",
  ];

  const tabRef = useRef<HTMLUListElement>(null);

  const [activeTab, setActiveTab] = useState<"Queued" | "Processed" | "Failed">(
    "Queued"
  );

  const tabIcons = {
    Queued: <ClipboardClock size={18} />,
    Processed: <ClipboardCheck size={18} />,
    Failed: <ClipboardX size={18} />,
  };

  const [documents, setDocuments] = useState<Document[]>(initialMockDocuments);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null
  );
  const [isRetryModalOpen, setRetryModalOpen] = useState(false);

  const textHeader = theme === "dark" ? "text-white" : "text-gray-900";
  const textPrimary = theme === "dark" ? "text-gray-300" : "text-gray-600";
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";

  useEffect(() => {
    // Mock processing simulation
    const interval = setInterval(() => {
      setDocuments((currentDocs) => {
        const queuedDocs = currentDocs.filter(
          (d) => d.status === "Queued" && !d.isPriority
        );
        if (queuedDocs.length === 0) return currentDocs;

        const priorityDoc = currentDocs.find(
          (d) => d.status === "Queued" && d.isPriority
        );
        const docToProcess = priorityDoc || queuedDocs[0];

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
        if (a.status === "Processing") return -1;
        if (b.status === "Processing") return 1;
        return (
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
      });
    } else if (activeTab === "Processed") {
      list = documents.filter((d) => d.status === "Processed");
    } else {
      // failed tab
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
    navigate("loading");
  };
  const handleRetryWithAlterations = () => {
    setRetryModalOpen(false);
    navigate("imageAlteration");
  };

  useLayoutEffect(() => {
        
    updateActivePosition();

    const observer = new ResizeObserver(() => {
        updateActivePosition();
    });

    if (tabRef.current) {
      observer.observe(tabRef.current);
    }

    return () => {
      if (tabRef.current) {
          observer.unobserve(tabRef.current);
      }
    };
  }, [window.location.pathname,activeTab]);

  const updateActivePosition = () => {
    if (tabRef.current) {
      const activeLi = tabRef.current.querySelector(
        ".nav-item.active"
      ) as HTMLElement;

      if (activeLi) {
        tabRef.current.style.setProperty(
          "--position-y-active",
          `${activeLi.offsetTop}px`
        );
        tabRef.current.style.setProperty(
          "--position-x-active",
          `${activeLi.offsetLeft}px`
        );
      }
    }
  }

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
      className={`p-4 rounded-lg flex items-center gap-4 transition-colors ${
        theme === "dark"
          ? "bg-gray-800/60 border border-gray-700/80"
          : "bg-gray-100 border border-gray-200"
      }`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          theme === "dark"
            ? "bg-violet-600/10 text-violet-400"
            : "bg-violet-100 text-violet-600"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className={`text-sm ${textSecondary}`}>{label}</p>
        <p className={`font-semibold ${textPrimary}`}>{value}</p>
      </div>
    </div>
  );

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
          {activeTab === "Processed" ? (
            <div className="table">
              <DataTable
                tableData={JSON.parse(JSON.stringify(documentsForTab))}
                tableConfig={documentConfig}
                isSearchable={true}
                // isEditable={true}
                renderActionCell={EditButton}
                actionColumnHeader="Review"
                pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25, 50, 100] }}
                maxHeight="100%"
              />
              {/* <AgGridReact rowData={rowData} columnDefs={colDefs} defaultColDef={defaultColDef}/> */}
            </div>
          ) : (
            <div className="h-full">
              {documentsForTab.length > 0 ? (
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                  <aside
                    className={`rounded-xl border ${
                      theme === "dark"
                        ? "bg-gray-800/20 border-gray-700/60"
                        : "bg-white border-gray-200/80"
                    }`}
                  >
                    <div className="p-4 border-b border-inherit">
                      <h3 className={`font-semibold text-lg ${textHeader}`}>
                        {activeTab} Documents
                      </h3>
                    </div>
                    <div className="p-2">
                      <div className="space-y-1 overflow-y-auto max-h-[550px] pr-2">
                        {documentsForTab.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedDocumentId(doc.id)}
                            className={`w-full text-left p-3 rounded-lg flex items-center gap-4 transition-all duration-200 group ${
                              selectedDocumentId === doc.id
                                ? theme === "dark"
                                  ? "bg-violet-600/10"
                                  : "bg-violet-50"
                                : theme === "dark"
                                ? "hover:bg-gray-700/50"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                                selectedDocumentId === doc.id
                                  ? theme === "dark"
                                    ? "bg-violet-600/20 text-violet-400"
                                    : "bg-violet-100 text-violet-600"
                                  : theme === "dark"
                                  ? "bg-gray-700/50 text-gray-400 group-hover:bg-gray-600/50 group-hover:text-gray-300"
                                  : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-600"
                              }`}
                            >
                              <File size={20} />
                            </div>
                
                            <div className="flex-1 overflow-hidden">
                              <p className={`font-bold flex gap-2 items-center truncate ${textHeader}`}>
                                {doc.name}
                                {doc.isPriority && (
                                  <Star
                                    className="w-4 h-4 text-yellow-400 mt-1"
                                    fill="currentColor"
                                  />
                                )}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <StatusBadge status={doc.status} theme={theme} />
                              
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </aside>
                
                  {/* --- DOCUMENT DETAILS (RIGHT) --- */}
                  <section
                    className={`lg:col-span-2 rounded-xl border flex flex-col ${
                      theme === "dark"
                        ? "bg-gray-800/20 border-gray-700/60"
                        : "bg-white border-gray-200/80"
                    }`}
                  >
                    {selectedDocument ? (
                      <div className="animate-fade-in h-full flex flex-col p-6">
                        {/* --- HEADER --- */}
                        <div className="flex justify-between items-start pb-5">
                          <div className="flex-1 overflow-hidden">
                            <h3 className={`text-2xl font-bold truncate ${textHeader}`}>
                              {selectedDocument.name}
                            </h3>
                            <p className={textSecondary}>
                              Uploaded on {selectedDocument.uploadDate}
                            </p>
                          </div>
                          <StatusBadge
                            status={selectedDocument.status}
                            large
                            theme={theme}
                          />
                        </div>
                
                        <hr
                          className={
                            theme === "dark" ? "border-gray-700" : "border-gray-200"
                          }
                        />
                
                        <div className="py-6 space-y-6 flex-grow overflow-y-auto">
                          {/* --- ERROR MESSAGE --- */}
                          {activeTab === "Failed" &&
                            selectedDocument.errorMessage && (
                              <div
                                className={`p-4 rounded-lg flex items-start gap-3 transition-colors ${
                                  theme === "dark"
                                    ? "bg-red-900/20 border border-red-700/40"
                                    : "bg-red-50 border border-red-200"
                                }`}
                              >
                                <AlertCircle
                                  className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
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
                                    className={`mt-1 text-sm ${
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
                          {/* --- DOCUMENT INFORMATION --- */}
                          <div>
                            <h4
                              className={`font-semibold text-lg mb-4 ${textHeader}`}
                            >
                              Document Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <InfoCard
                                icon={<Database size={20} />}
                                label="File Size"
                                value={selectedDocument.size}
                              />
                              <InfoCard
                                icon={<User size={20} />}
                                label="Uploaded By"
                                value={selectedDocument.uploadedBy || "Admin"}
                              />
                            </div>
                          </div>
                        </div>
                
                        <hr
                          className={
                            theme === "dark" ? "border-gray-700" : "border-gray-200"
                          }
                        />
                
                        {/* --- ACTIONS --- */}
                        <div className="pt-5">
                          <h4
                            className={`font-semibold text-lg mb-4 ${textHeader}`}
                          >
                            Actions
                          </h4>
                          <div className="flex flex-wrap items-center gap-3">
                            {activeTab === "Queued" &&
                              (selectedDocument.status === "Queued" ||
                                selectedDocument.status === "Processing") &&
                              user?.role === "admin" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleSetPriority(selectedDocument.id)
                                    }
                                    disabled={
                                      selectedDocument.status === "Processing"
                                    }
                                    className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold shadow-sm transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                                      theme === "dark"
                                        ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                                    }`}
                                  >
                                    <Star
                                      className={`w-4 h-4 ${
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
                                    Set as Priority
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDelete(selectedDocument.id)
                                    }
                                    disabled={
                                      selectedDocument.status === "Processing"
                                    }
                                    className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold shadow-sm transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                                      theme === "dark"
                                        ? "bg-red-900/40 border-red-700/60 text-red-300 hover:bg-red-900/60"
                                        : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4" /> Delete
                                  </button>
                                </>
                              )}
                            {activeTab === "Failed" && (
                            <>
                              <button
                                  onClick={() => navigate('/manualEntry')}
                                  className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold shadow-sm transition-all border ${
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
                                  className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold shadow-sm transition-all border ${
                                    theme === "dark"
                                      ? "bg-yellow-900/40 border-yellow-700/60 text-yellow-300 hover:bg-yellow-900/60"
                                      : "bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                                  }`}
                                >
                                  <RefreshCw className="w-4 h-4" /> Retry Processing
                                </button>
                              )}
                            </>
                          )}
                          </div>
                          {selectedDocument.status === "Processing" && (
                            <p
                              className={`text-sm mt-4 ${
                                theme === "dark"
                                  ? "text-yellow-400"
                                  : "text-yellow-600"
                              }`}
                            >
                              Cannot perform actions while a document is being
                              processed.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div
                          className={`flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                            theme === "dark"
                              ? "bg-violet-600/10 text-violet-400"
                              : "bg-violet-100 text-violet-600"
                          }`}
                        >
                          <FileText className="w-10 h-10" />
                        </div>
                        <h3 className={`text-xl font-semibold ${textHeader}`}>
                          Select a document
                        </h3>
                        <p className={textSecondary}>
                          Choose a document from the list to view its details and
                          available actions.
                        </p>
                      </div>
                    )}
                  </section>
                </main>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center py-16 text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-semibold text-gray-700 dark:text-gray-200">
                    No documents found
                  </p>
                  <p className="text-sm mt-1">This queue is empty.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Queue;
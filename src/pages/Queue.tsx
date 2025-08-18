import { useEffect, useMemo, useRef, useState } from "react";
import "../assets/styles/Queue.scss";
import DataTable from "../components/common/DataTable";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { initialMockDocuments } from "../lib/MockData";
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
} from "lucide-react";
import { RetryModal, StatusBadge } from "../components/common/Helper";

const Queue = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const EditButton = () => {
    return (
      <button className="edit-btn" onClick={() => navigate("/edit")}>
        <i className="fi fi-rr-file-edit"></i> Edit
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
    Queued: <ClipboardClock size={18} className="animate-spin-slow" />,
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

  useEffect(() => {
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
        // tabRef.current.style.setProperty('--width-active', `${activeLi.clientWidth}px`);
        // tabRef.current.style.setProperty('--height-active', `${activeLi.clientHeight}px`);
      }
    }
  }, [activeTab]);

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
            <DataTable
              tableData={JSON.parse(JSON.stringify(documentsForTab))}
              renderActionCell={EditButton}
              actionColumnHeader="Action"
            />
          ) : (
            <main
              className={`flex flex-col lg:flex-row min-h-[600px] rounded-2xl border transition-colors ${
                theme === "dark"
                  ? "bg-[#1C1C2E] border-gray-700/50 shadow-2xl shadow-black/20"
                  : "bg-white border-gray-200 shadow-xl"
              }`}
            >
              <aside
                className={`w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r transition-colors ${
                  theme === "dark" ? "border-gray-700/50" : "border-gray-200"
                }`}
              >
                <div className="p-4 h-full">
                  <h2
                    className={`text-lg font-semibold mb-3 capitalize ${textHeader}`}
                  >
                    {activeTab} Documents ({documentsForTab.length})
                  </h2>
                  <div className="space-y-2 overflow-y-auto max-h-[550px] pr-2">
                    {documentsForTab.length > 0 ? (
                      documentsForTab.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDocumentId(doc.id)}
                          className={`w-full text-left p-3 rounded-lg flex items-center justify-between gap-4 transition-all duration-200 border-2 ${
                            selectedDocumentId === doc.id
                              ? theme === "dark"
                                ? "bg-violet-600/10 border-violet-500"
                                : "bg-violet-50 border-violet-400"
                              : "border-transparent " +
                                (theme === "dark"
                                  ? "hover:bg-gray-700/50"
                                  : "hover:bg-gray-100")
                          }`}
                        >
                          <div className="flex-1 overflow-hidden flex items-center gap-3">
                            {doc.isPriority && (
                              <Star
                                className="w-5 h-5 text-yellow-400 flex-shrink-0"
                                fill="currentColor"
                              />
                            )}
                            <div className="flex-1 overflow-hidden">
                              <p className={`font-bold truncate ${textHeader}`}>
                                {doc.supplierName}
                              </p>
                              <p
                                className={`font-medium truncate text-sm ${textPrimary}`}
                              >
                                {doc.name}
                              </p>
                              <p className={`text-xs mt-1 ${textSecondary}`}>
                                Invoice Date: {doc.invoiceDate}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={doc.status} theme={theme} />
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-2" />
                        <p className="font-semibold text-gray-700 dark:text-gray-200">
                          No documents found
                        </p>
                        <p className="text-sm mt-1">This queue is empty.</p>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
              <section className="w-full lg:w-2/3 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {selectedDocument ? (
                  <div className="animate-fade-in">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1 overflow-hidden">
                        <h3
                          className={`text-2xl font-bold truncate ${textHeader}`}
                        >
                          {selectedDocument.name}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Uploaded on {selectedDocument.uploadDate}
                        </p>
                      </div>
                      <StatusBadge
                        status={selectedDocument.status}
                        large
                        theme={theme}
                      />
                    </div>
                    <div
                      className={`mt-6 border-t pt-6 transition-colors ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <h4
                        className={`font-semibold text-lg mb-4 ${textHeader}`}
                      >
                        Document Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div
                          className={`p-3 rounded-lg border transition-colors ${
                            theme === "dark"
                              ? "bg-gray-900/50 border-gray-700"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <p className={textSecondary}>Supplier Name</p>
                          <p className={`font-semibold ${textPrimary}`}>
                            {selectedDocument.supplierName}
                          </p>
                        </div>
                        <div
                          className={`p-3 rounded-lg border transition-colors ${
                            theme === "dark"
                              ? "bg-gray-900/50 border-gray-700"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <p className={textSecondary}>Invoice Date</p>
                          <p className={`font-semibold ${textPrimary}`}>
                            {selectedDocument.invoiceDate}
                          </p>
                        </div>
                        <div
                          className={`p-3 rounded-lg border transition-colors ${
                            theme === "dark"
                              ? "bg-gray-900/50 border-gray-700"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <p className={textSecondary}>File Size</p>
                          <p className={`font-semibold ${textPrimary}`}>
                            {selectedDocument.size}
                          </p>
                        </div>
                        <div
                          className={`p-3 rounded-lg border transition-colors ${
                            theme === "dark"
                              ? "bg-gray-900/50 border-gray-700"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <p className={textSecondary}>Edited</p>
                          <p className={`font-semibold ${textPrimary}`}>
                            {selectedDocument.edited ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`p-6 rounded-xl border mt-8 transition-colors ${
                        theme === "dark"
                          ? "bg-gray-900/50 border-gray-700"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <h4 className="font-semibold text-lg text-gray-800 dark:text-white mb-4">
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
                                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                  theme === "dark"
                                    ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {" "}
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
                                />{" "}
                                Set as Priority{" "}
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(selectedDocument.id)
                                }
                                disabled={
                                  selectedDocument.status === "Processing"
                                }
                                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                  theme === "dark"
                                    ? "bg-red-800/80 border-red-700 text-white hover:bg-red-700"
                                    : "bg-red-100 border-red-200 text-red-700 hover:bg-red-200"
                                }`}
                              >
                                {" "}
                                <Trash2 className="w-4 h-4" /> Delete{" "}
                              </button>
                            </>
                          )}
                        {activeTab === "Failed" && user?.role === "admin" && (
                          <button
                            onClick={openRetryModal}
                            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold shadow-sm transition-all ${
                              theme === "dark"
                                ? "bg-yellow-700/80 border-yellow-600 text-white hover:bg-yellow-600"
                                : "bg-yellow-100 border-yellow-200 text-yellow-800 hover:bg-yellow-200"
                            }`}
                          >
                            {" "}
                            <RefreshCw className="w-4 h-4" /> Retry{" "}
                          </button>
                        )}
                        {selectedDocument.status !== "Queued" &&
                          selectedDocument.status !== "Failed" && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No actions available for this document status.
                            </p>
                          )}
                      </div>
                      {selectedDocument.status === "Processing" && (
                        <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-4">
                          Cannot perform actions while a document is being
                          processed.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center">
                    <FileText className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                      Select a document
                    </h3>
                    <p>
                      Choose a document from the list on the left to see its
                      details.
                    </p>
                  </div>
                )}
              </section>
            </main>
          )}
        </div>
      </div>
    </div>
  );
};

export default Queue;

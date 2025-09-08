import { useState, useEffect, useCallback } from "react";
import DataTable from "../components/common/DataTable";
import { useTheme } from "../hooks/useTheme";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "../components/common/Animation";
import { useNavigate } from "react-router-dom";
import { type DataItem, type Document, type ProcessedDocument } from "../interfaces/Types";
import { getCompletedDocuments } from "../lib/api/Api";
import { documentConfig } from "../lib/config/Config";
import { useToast } from "../hooks/useToast";
import ErrorDisplay from "../components/common/ErrorDisplay";
import { TableSkeleton } from "../components/common/SkeletonLoaders";

const Documents = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const data = await getCompletedDocuments(addToast);
        setDocuments(data.map((item: any, index: number) => ({
          id: item.message_id,
          sno: index + 1,
          name: item.file_name,
          supplierName: item.supplier_name,
          invoiceId: item.invoice_id,
          irnNumber: item.irn,
          uploadedBy: item.uploaded_by,
          uploadDate: item.uploaded_at,
          invoiceDate: item.invoice_date,
          messageId: item.message_id,
          status: "Processed",
        })));
    } catch (err: any) {
        setError(err.message || "Failed to fetch documents.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const renderActionCell = (row: DataItem) => {
    const doc = row as ProcessedDocument;
    return (
        <button onClick={() => navigate(`/review/${doc.invoiceId}`)} className="edit-btn" >
            <i className="fi fi-rr-file-check"></i> Review
        </button>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <TableSkeleton />;
    }

    if (error) {
      return <ErrorDisplay message={error} onRetry={fetchDocuments} />;
    }

    return (
      <DataTable
        tableData={documents}
        isSearchable={true}
        isEditable={false}
        tableConfig={documentConfig}
        pagination={{ enabled: true, pageSize: 25, pageSizeOptions: [5, 10, 25, 50, 100] }}
        maxHeight="100%"
        renderActionCell={renderActionCell}
        actionColumnHeader="Actions"
      />
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`h-full w-full flex flex-col transition-colors rounded-3xl p-4 sm:p-6 ${
        theme === "dark" ? "bg-[#1C1C2E]" : "bg-gray-50"
      }`}
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6"
      >
        <h1 className={`text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          Reviewed Documents
        </h1>
      </motion.div>

      <motion.div variants={itemVariants} className="flex-grow overflow-auto">
        {renderContent()}
      </motion.div>
    </motion.div>
  );
};

export default Documents;
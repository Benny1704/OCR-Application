import { useState, useMemo } from "react";
import DataTable from "../components/common/DataTable";
import { useTheme } from "../hooks/useTheme";
import { documentConfig, initialMockDocuments } from "../lib/MockData";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "../components/common/Animation";
import { useNavigate } from "react-router-dom";
import { type DataItem } from "../interfaces/Types";

const Documents = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const reviewedDocuments = useMemo(() => {
    let docs = initialMockDocuments.filter(
      (doc) => doc.status === "Reviewed"
    );

    if (startDate && endDate) {
      docs = docs.filter(doc => {
        const docDate = new Date(doc.invoiceDate);
        return docDate >= new Date(startDate) && docDate <= new Date(endDate);
      });
    }

    return docs;
  }, [startDate, endDate]);

  const renderActionCell = (row: DataItem) => {
    return (
      <button onClick={() => navigate(`/review/${row.id}`)} className="edit-btn">
        <i className="fi fi-rr-file-edit"></i> Review
      </button>
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
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`px-3 py-1.5 text-sm border rounded-md focus:ring-violet-500 focus:border-violet-500 ${theme === 'dark' ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
          />
          <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`px-3 py-1.5 text-sm border rounded-md focus:ring-violet-500 focus:border-violet-500 ${theme === 'dark' ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex-grow overflow-auto">
        <DataTable
          tableData={reviewedDocuments}
          isSearchable={true}
          isEditable={false}
          tableConfig={documentConfig}
          pagination={{ enabled: true, pageSize: 25, pageSizeOptions: [5, 10, 25, 50, 100] }}
          maxHeight="100%"
          renderActionCell={renderActionCell}
          actionColumnHeader="Actions"
        />
      </motion.div>
    </motion.div>
  );
};

export default Documents;
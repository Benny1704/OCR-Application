import DataTable from "../components/common/DataTable";
import { useTheme } from "../hooks/useTheme";
import { documentConfig, initialMockDocuments } from "../lib/MockData";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "../components/common/Animation";

const Documents = () => {
  const { theme } = useTheme();
  const reviewedDocuments = initialMockDocuments.filter(
    (doc) => doc.status === "Reviewed"
  );

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
        <DataTable
          tableData={reviewedDocuments}
          isSearchable={true}
          isEditable={false}
          tableConfig={documentConfig}
          pagination={{ enabled: true, pageSize: 25, pageSizeOptions: [5, 10, 25, 50, 100] }}
          maxHeight="100%"
        />
      </motion.div>
    </motion.div>
  );
};

export default Documents;
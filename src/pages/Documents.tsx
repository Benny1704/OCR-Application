import DataTable from "../components/common/DataTable";
import { useTheme } from "../hooks/useTheme";
import { documentConfig, initialMockDocuments } from "../lib/MockData";

const Documents = () => {
  const { theme } = useTheme();
  const reviewedDocuments = initialMockDocuments.filter(
    (doc) => doc.status === "Reviewed"
  );
  return (
    <div className={`h-full w-full flex flex-col transition-colors rounded-[30px] p-8 ${
      theme === "dark" ? "bg-[#1C1C2E] text-gray-200" : "bg-gray-50 text-gray-900"
    }`}>
      <h1 className="text-2xl font-bold mb-4">Reviewed Documents</h1>
      <DataTable
        tableData={reviewedDocuments}
        isSearchable={true}
        isEditable={false}
        tableConfig={documentConfig}
        pagination={{ enabled: true, pageSize: 10, pageSizeOptions: [5, 10, 25, 50, 100] }}
        // maxHeight="100%/"
      />
    </div>
  );
};

export default Documents;
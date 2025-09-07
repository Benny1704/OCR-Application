import EditableComponent from '../components/common/EditableComponent';
import { useEffect, useState, useCallback } from 'react';
import { getExtractedData } from '../lib/api/Api';
import type { ExtractedData } from '../interfaces/Types';
import { useToast } from '../hooks/useToast';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';

const Edit = () => {
  const [data, setData] = useState<ExtractedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const extractedData = await getExtractedData(addToast);
        if (!extractedData) {
          throw new Error("No data was extracted.");
        }
        setData(extractedData);
    } catch (err: any) {
        setError(err.message || "Failed to fetch extracted data.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <Loader type="wifi"/>;
  }

  if (error) {
    return <div className="p-4"><ErrorDisplay message={error} onRetry={fetchData} /></div>;
  }
  
  return (
    <EditableComponent initialData={data!}/>
  );
};

export default Edit;
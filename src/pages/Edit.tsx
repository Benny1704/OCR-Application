import EditableComponent from '../components/common/EditableComponent';
import { useEffect, useState } from 'react';
import { getExtractedData } from '../lib/api/Api';
import type { ExtractedData } from '../interfaces/Types';
import { useToast } from '../hooks/useToast';

const Edit = () => {
  const [data, setData] = useState<ExtractedData | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        const extractedData = await getExtractedData(addToast);
        setData(extractedData);
    };
    fetchData();
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }
  
  return (
    <EditableComponent initialData={data}/>
  );
};

export default Edit;
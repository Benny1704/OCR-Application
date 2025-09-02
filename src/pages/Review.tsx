import { useParams } from 'react-router-dom';
import EditableComponent from '../components/common/EditableComponent';
import { useEffect, useState } from 'react';
import { getExtractedData } from '../lib/api/Api';
import type { ExtractedData } from '../interfaces/Types';
import { useToast } from '../hooks/useToast';

const Review = () => {
    const { id } = useParams();
    const [data, setData] = useState<ExtractedData | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            const extractedData = await getExtractedData(addToast);
            setData(extractedData);
        };
        fetchData();
    }, [id]);
  
    if (!data) {
        return <div>Loading...</div>;
    }
  
    return <EditableComponent initialData={data} isReadOnly={true} />;
}

export default Review
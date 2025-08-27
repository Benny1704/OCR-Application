import { useParams } from 'react-router-dom';
import EditableComponent from '../components/common/EditableComponent';
import { initialMockDocuments, mockExtractedData } from '../lib/MockData';

const Review = () => {
    const { id } = useParams();
    const document = initialMockDocuments.find(d => d.id === Number(id));
  
    return <EditableComponent initialData={mockExtractedData} isReadOnly={true} />;
}

export default Review
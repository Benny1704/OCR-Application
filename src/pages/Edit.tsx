import EditableComponent from '../components/common/EditableComponent';
import { mockExtractedData } from '../lib/MockData';

const Edit = () => {

  return (
    <EditableComponent initialData={mockExtractedData}/>
  );
};

export default Edit;

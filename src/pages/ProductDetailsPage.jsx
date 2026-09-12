import { useParams } from 'react-router-dom';

export function ProductDetailsPage() {
  const { id } = useParams();
  return (
    <div>
      <h1>Product {id}</h1>
      <p>Product detail goes here (Step 11).</p>
    </div>
  );
}

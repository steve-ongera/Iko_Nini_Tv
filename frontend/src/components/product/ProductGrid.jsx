import React from 'react'
import ProductCard from './ProductCard'
import Loader from '../common/Loader'
import EmptyState from '../common/EmptyState'

const ProductGrid = ({ products, loading, columns = 4 }) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <Loader />
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        message="Try adjusting your search or filter to find what you're looking for."
        icon="bi-search"
      />
    )
  }

  const gridClass = {
    2: 'row-cols-1 row-cols-md-2',
    3: 'row-cols-1 row-cols-sm-2 row-cols-md-3',
    4: 'row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4',
    5: 'row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5',
  }[columns] || 'row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4'

  return (
    <div className={`row g-4 ${gridClass}`}>
      {products.map((product) => (
        <div key={product.id} className="col">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}

export default ProductGrid
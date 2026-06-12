import React, { useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import ProductCard from './ProductCard'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const ProductCarousel = ({ products, title, viewAllLink }) => {
  if (!products || products.length === 0) return null

  return (
    <div className="mb-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">{title}</h3>
        {viewAllLink && (
          <a href={viewAllLink} className="text-decoration-none">
            View All <i className="bi bi-arrow-right"></i>
          </a>
        )}
      </div>
      
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        breakpoints={{
          576: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
          1280: { slidesPerView: 5 },
        }}
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default ProductCarousel
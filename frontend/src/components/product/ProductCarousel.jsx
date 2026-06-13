import React, { useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const ProductCarousel = ({ products, title, viewAllLink }) => {
  const prevRef = useRef(null)
  const nextRef = useRef(null)
  const [isBeginning, setIsBeginning] = useState(true)
  const [isEnd, setIsEnd] = useState(false)

  if (!products || products.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>

      {/* Header */}
      {(title || viewAllLink) && (
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          {title && (
            <h2 className="section-title">
              <span className="section-title-accent"></span>
              {title}
            </h2>
          )}
          {viewAllLink && (
            <Link to={viewAllLink} className="section-view-all">
              View All <i className="bi bi-arrow-right"></i>
            </Link>
          )}
        </div>
      )}

      {/* Custom nav buttons — desktop only */}
      <button
        ref={prevRef}
        aria-label="Previous"
        className="desktop-only"
        style={{
          position: 'absolute',
          left: '-16px',
          top: title ? 'calc(50% + 24px)' : '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          width: '36px', height: '36px',
          borderRadius: '50%',
          background: 'white',
          border: '1px solid var(--gray-200)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--gray-700)',
          fontSize: '1rem',
          transition: 'var(--transition-fast)',
          opacity: isBeginning ? 0.35 : 1,
          pointerEvents: isBeginning ? 'none' : 'auto',
        }}
      >
        <i className="bi bi-chevron-left"></i>
      </button>

      <button
        ref={nextRef}
        aria-label="Next"
        className="desktop-only"
        style={{
          position: 'absolute',
          right: '-16px',
          top: title ? 'calc(50% + 24px)' : '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          width: '36px', height: '36px',
          borderRadius: '50%',
          background: 'white',
          border: '1px solid var(--gray-200)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--gray-700)',
          fontSize: '1rem',
          transition: 'var(--transition-fast)',
          opacity: isEnd ? 0.35 : 1,
          pointerEvents: isEnd ? 'none' : 'auto',
        }}
      >
        <i className="bi bi-chevron-right"></i>
      </button>

      {/* Swiper */}
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={12}
        slidesPerView={1.35}       // peek next card on mobile
        centeredSlides={false}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onSwiper={(swiper) => {
          // Wire custom buttons after mount
          swiper.params.navigation.prevEl = prevRef.current
          swiper.params.navigation.nextEl = nextRef.current
          swiper.navigation.init()
          swiper.navigation.update()
        }}
        onSlideChange={(swiper) => {
          setIsBeginning(swiper.isBeginning)
          setIsEnd(swiper.isEnd)
        }}
        onReachBeginning={() => setIsBeginning(true)}
        onReachEnd={() => setIsEnd(true)}
        pagination={{
          clickable: true,
          el: '.carousel-pagination',
        }}
        autoplay={{ delay: 5000, disableOnInteraction: true, pauseOnMouseEnter: true }}
        breakpoints={{
          480:  { slidesPerView: 2,   spaceBetween: 12 },
          640:  { slidesPerView: 2.5, spaceBetween: 14 },
          768:  { slidesPerView: 3,   spaceBetween: 16 },
          1024: { slidesPerView: 4,   spaceBetween: 16 },
          1280: { slidesPerView: 5,   spaceBetween: 16 },
        }}
        style={{ paddingBottom: '2rem' }}   // room for dots
      >
        {products.map((product) => (
          <SwiperSlide key={product.id} style={{ height: 'auto' }}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Pagination dots — styled to match your design tokens */}
      <div className="carousel-pagination" style={{ textAlign: 'center', marginTop: '-1rem' }}></div>

      {/* Swiper dot override */}
      <style>{`
        .carousel-pagination .swiper-pagination-bullet {
          width: 6px;
          height: 6px;
          background: var(--gray-300);
          opacity: 1;
          border-radius: var(--radius-full);
          transition: var(--transition-fast);
        }
        .carousel-pagination .swiper-pagination-bullet-active {
          width: 20px;
          background: var(--brand-red);
          border-radius: var(--radius-full);
        }
        /* Hide Swiper's built-in arrows since we use custom ones */
        .swiper-button-next,
        .swiper-button-prev {
          display: none !important;
        }
      `}</style>
    </div>
  )
}

export default ProductCarousel
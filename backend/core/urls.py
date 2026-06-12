"""
store/urls.py
Iko Nini TV — App URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'store'

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/profile/', views.ProfileView.as_view(), name='profile'),
    path('auth/password/change/', views.ChangePasswordView.as_view(), name='password-change'),
    
    # User Addresses
    path('auth/addresses/', views.UserAddressListCreateView.as_view(), name='address-list'),
    path('auth/addresses/<int:pk>/', views.UserAddressDetailView.as_view(), name='address-detail'),
    
    # Delivery
    path('counties/', views.CountyListView.as_view(), name='counties'),
    path('counties/<int:county_id>/pickup-stations/', views.PickupStationListView.as_view(), name='county-pickup-stations'),
    path('pickup-stations/<int:id>/', views.PickupStationDetailView.as_view(), name='pickup-station-detail'),
    path('delivery/calculate/', views.CalculateDeliveryView.as_view(), name='calculate-delivery'),
    
    # Categories & Brands
    path('categories/', views.CategoryListView.as_view(), name='categories'),
    path('categories/<slug:slug>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('brands/', views.BrandListView.as_view(), name='brands'),
    
    # Products
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/featured/', views.FeaturedProductsView.as_view(), name='featured-products'),
    path('products/flash-sales/', views.FlashSaleProductsView.as_view(), name='flash-sales'),
    path('products/<slug:slug>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/<slug:slug>/reviews/', views.ProductReviewListView.as_view(), name='product-reviews'),
    path('products/<slug:slug>/reviews/create/', views.ProductReviewCreateView.as_view(), name='create-review'),
    
    # Recently Viewed
    path('recently-viewed/', views.RecentlyViewedView.as_view(), name='recently-viewed'),
    
    # Cart
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/add/', views.AddToCartView.as_view(), name='add-to-cart'),
    path('cart/items/<int:item_id>/', views.UpdateCartItemView.as_view(), name='update-cart-item'),
    path('cart/clear/', views.ClearCartView.as_view(), name='clear-cart'),
    
    # Wishlist
    path('wishlist/', views.WishlistView.as_view(), name='wishlist'),
    path('wishlist/<int:pk>/', views.WishlistDeleteView.as_view(), name='wishlist-delete'),
    
    # Orders
    path('orders/place/', views.PlaceOrderView.as_view(), name='place-order'),
    path('orders/', views.OrderListView.as_view(), name='orders'),
    path('orders/<str:order_number>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:order_number>/cancel/', views.CancelOrderView.as_view(), name='cancel-order'),
    
    # Payments
    path('payments/mpesa/initiate/', views.MpesaInitiateView.as_view(), name='mpesa-initiate'),
    path('payments/mpesa/callback/', views.MpesaCallbackView.as_view(), name='mpesa-callback'),
    path('payments/mpesa/status/<str:checkout_request_id>/', views.MpesaStatusView.as_view(), name='mpesa-status'),
    path('payments/paypal/create-order/', views.PaypalCreateOrderView.as_view(), name='paypal-create'),
    path('payments/paypal/capture/', views.PaypalCaptureView.as_view(), name='paypal-capture'),
    
    # Search
    path('search/', views.SearchView.as_view(), name='search'),
    
    # Banners
    path('banners/', views.BannerListView.as_view(), name='banners'),
]
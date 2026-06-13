"""
core/views.py
Iko Nini TV — All API Views
"""

from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, F, Avg, Count, Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate, update_session_auth_hash
from django.core.mail import send_mail
from django.conf import settings
import uuid
from datetime import timedelta

from .models import (
    User, UserAddress,
    County, PickupStation,
    Category, Brand,
    Product, ProductImage, ProductVariant, ProductReview, RecentlyViewedProduct,
    Cart, CartItem,
    WishlistItem,
    Order, OrderItem, OrderStatusHistory,
    Payment, MpesaTransaction, PaypalTransaction,
    Banner,
)
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer, ChangePasswordSerializer, UserAddressSerializer,
    CountySerializer, PickupStationSerializer, DeliveryCalculateSerializer,
    CategorySerializer, BrandSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductReviewSerializer, ProductCreateReviewSerializer,
    RecentlyViewedSerializer, CartSerializer, CartItemSerializer, WishlistSerializer,
    OrderSerializer, PlaceOrderSerializer,
    MpesaInitiateSerializer, MpesaStatusSerializer,
    PaypalCreateOrderSerializer, PaypalCaptureSerializer,
    BannerSerializer,
)
from .permissions import IsOwnerOrReadOnly, IsAdminOrReadOnly
from .pagination import StandardResultsSetPagination
from .filters import ProductFilter
from .utils.mpesa import MpesaAPI
from .utils.paypal import PayPalAPI
from .tasks import poll_mpesa_transaction


# ─────────────────────────────────────────────
#  AUTHENTICATION VIEWS
# ─────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    """User registration"""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate email verification token (optional)
        # send_verification_email(user)
        
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """User login with email & password"""
    serializer_class = TokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = authenticate(email=request.data.get('email'), 
                              password=request.data.get('password'))
            if user:
                response.data['user'] = UserSerializer(user).data
        return response


class LogoutView(APIView):
    """Logout - blacklist refresh token"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"detail": "Logged out successfully."}, status=200)
        except Exception:
            return Response({"detail": "Invalid token."}, status=400)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get/Update user profile"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Change user password"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if user.check_password(serializer.data.get("old_password")):
                user.set_password(serializer.data.get("new_password"))
                user.save()
                update_session_auth_hash(request, user)
                return Response({"detail": "Password updated successfully."}, status=200)
            return Response({"old_password": "Wrong password."}, status=400)
        return Response(serializer.errors, status=400)


class UserAddressListCreateView(generics.ListCreateAPIView):
    """List and create user addresses"""
    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserAddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a user address"""
    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)


# ─────────────────────────────────────────────
#  DELIVERY VIEWS
# ─────────────────────────────────────────────

class CountyListView(generics.ListAPIView):
    """List all counties with their pickup stations"""
    queryset = County.objects.filter(is_active=True).prefetch_related(
        Prefetch('pickup_stations', queryset=PickupStation.objects.filter(is_active=True))
    )
    serializer_class = CountySerializer
    permission_classes = [AllowAny]


class PickupStationListView(generics.ListAPIView):
    """List pickup stations for a specific county"""
    serializer_class = PickupStationSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        county_id = self.kwargs.get('county_id')
        return PickupStation.objects.filter(county_id=county_id, is_active=True)


class PickupStationDetailView(generics.RetrieveAPIView):
    """Get pickup station details"""
    queryset = PickupStation.objects.filter(is_active=True)
    serializer_class = PickupStationSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'


class CalculateDeliveryView(APIView):
    """Calculate delivery cost based on delivery type"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = DeliveryCalculateSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.data
            cost = 0
            
            if data['delivery_type'] == 'pickup':
                station = get_object_or_404(PickupStation, id=data['pickup_station_id'])
                cost = station.delivery_cost
            else:
                county = get_object_or_404(County, id=data['county_id'])
                cost = county.home_delivery_cost
            
            return Response({
                'delivery_type': data['delivery_type'],
                'cost': cost,
                'currency': 'KES'
            })
        return Response(serializer.errors, status=400)


# ─────────────────────────────────────────────
#  CATEGORY & BRAND VIEWS
# ─────────────────────────────────────────────

class CategoryListView(generics.ListAPIView):
    """List all active categories (tree structure)"""
    queryset = Category.objects.filter(is_active=True, parent=None)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class CategoryDetailView(generics.RetrieveAPIView):
    """Get category details with products"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class BrandListView(generics.ListAPIView):
    """List all active brands"""
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    permission_classes = [AllowAny]


# ─────────────────────────────────────────────
#  PRODUCT VIEWS
# ─────────────────────────────────────────────

class ProductListView(generics.ListAPIView):
    """List products with filtering, searching, sorting"""
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'sku', 'brand__name']
    ordering_fields = ['price', 'created_at', 'sold_count', 'avg_rating']  # use avg_rating not average_rating
    ordering = ['-created_at']

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_active=True)
            .select_related('category', 'brand')
            .annotate(avg_rating=Avg('reviews__rating'))  # ← makes it a real DB column
        )


class FeaturedProductsView(generics.ListAPIView):
    """List featured products"""
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    
    def get_queryset(self):
        return Product.objects.filter(is_active=True, is_featured=True)[:12]


class FlashSaleProductsView(generics.ListAPIView):
    """List flash sale products"""
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    
    def get_queryset(self):
        now = timezone.now()
        return Product.objects.filter(
            is_active=True, 
            is_flash_sale=True,
            flash_sale_end__gt=now
        )[:10]


class ProductDetailView(generics.RetrieveAPIView):
    """Get product details by slug"""
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    
    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        
        # Track view count
        product = self.get_object()
        product.views_count = F('views_count') + 1
        product.save(update_fields=['views_count'])
        
        # Track recently viewed for authenticated users
        if request.user.is_authenticated:
            RecentlyViewedProduct.objects.update_or_create(
                user=request.user,
                product=product,
                defaults={'viewed_at': timezone.now()}
            )
        
        return response


class ProductReviewListView(generics.ListAPIView):
    """List reviews for a product"""
    serializer_class = ProductReviewSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        product = get_object_or_404(Product, slug=self.kwargs['slug'])
        return ProductReview.objects.filter(product=product, is_approved=True)


class ProductReviewCreateView(generics.CreateAPIView):
    """Create a review for a product"""
    serializer_class = ProductCreateReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        product = get_object_or_404(Product, slug=self.kwargs['slug'])
        # Check if user has purchased this product
        verified_purchase = OrderItem.objects.filter(
            order__user=self.request.user,
            product=product,
            order__status__in=['delivered', 'shipped']
        ).exists()
        
        serializer.save(
            product=product,
            user=self.request.user,
            verified_purchase=verified_purchase
        )


class RecentlyViewedView(generics.ListAPIView):
    """Get user's recently viewed products"""
    serializer_class = RecentlyViewedSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        return RecentlyViewedProduct.objects.filter(
            user=self.request.user
        ).select_related('product')[:20]


# ─────────────────────────────────────────────
#  CART VIEWS
# ─────────────────────────────────────────────

class CartView(generics.RetrieveAPIView):
    """Get or create cart for user/session"""
    serializer_class = CartSerializer
    permission_classes = [AllowAny]
    
    def get_object(self):
        cart = None
        
        if self.request.user.is_authenticated:
            cart, created = Cart.objects.get_or_create(user=self.request.user)
        else:
            session_key = self.request.session.session_key
            if not session_key:
                self.request.session.create()
                session_key = self.request.session.session_key
            cart, created = Cart.objects.get_or_create(session_key=session_key, user=None)
        
        return cart


class AddToCartView(APIView):
    """Add item to cart"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        cart = None
        
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            session_key = request.session.session_key
            if not session_key:
                request.session.create()
                session_key = request.session.session_key
            cart, _ = Cart.objects.get_or_create(session_key=session_key, user=None)
        
        product_id = request.data.get('product_id')
        variant_id = request.data.get('variant_id')
        quantity = request.data.get('quantity', 1)
        
        product = get_object_or_404(Product, id=product_id, is_active=True)
        
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            variant_id=variant_id if variant_id else None
        )
        
        if not created:
            cart_item.quantity += int(quantity)
        else:
            cart_item.quantity = int(quantity)
        cart_item.save()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateCartItemView(APIView):
    """Update cart item quantity"""
    permission_classes = [AllowAny]
    
    def put(self, request, item_id):
        cart_item = get_object_or_404(CartItem, id=item_id)
        
        # Check ownership
        if request.user.is_authenticated:
            if cart_item.cart.user != request.user:
                return Response({"detail": "Not authorized."}, status=403)
        else:
            session_key = request.session.session_key
            if cart_item.cart.session_key != session_key:
                return Response({"detail": "Not authorized."}, status=403)
        
        quantity = request.data.get('quantity')
        if quantity and int(quantity) > 0:
            cart_item.quantity = int(quantity)
            cart_item.save()
        else:
            cart_item.delete()
        
        cart = cart_item.cart
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
    def delete(self, request, item_id):
        cart_item = get_object_or_404(CartItem, id=item_id)
        cart = cart_item.cart
        cart_item.delete()
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class ClearCartView(APIView):
    """Clear all items from cart"""
    permission_classes = [AllowAny]
    
    def delete(self, request):
        if request.user.is_authenticated:
            cart = get_object_or_404(Cart, user=request.user)
        else:
            session_key = request.session.session_key
            if not session_key:
                return Response({"detail": "Cart is empty."}, status=400)
            cart = get_object_or_404(Cart, session_key=session_key, user=None)
        
        cart.items.all().delete()
        return Response({"detail": "Cart cleared."}, status=200)


# ─────────────────────────────────────────────
#  WISHLIST VIEWS
# ─────────────────────────────────────────────

class WishlistView(generics.ListCreateAPIView):
    """List and add to wishlist"""
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        product_id = self.request.data.get('product_id')
        product = get_object_or_404(Product, id=product_id)
        serializer.save(user=self.request.user, product=product)


class WishlistDeleteView(generics.DestroyAPIView):
    """Remove item from wishlist"""
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user)
    
    def delete(self, request, *args, **kwargs):
        item = get_object_or_404(WishlistItem, id=kwargs['pk'], user=request.user)
        item.delete()
        return Response({"detail": "Removed from wishlist."}, status=200)


# ─────────────────────────────────────────────
#  ORDER VIEWS
# ─────────────────────────────────────────────

class PlaceOrderView(APIView):
    """Place a new order from cart"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.data
        
        # Get user's cart
        cart = get_object_or_404(Cart, user=request.user)
        if not cart.items.exists():
            return Response({"detail": "Cart is empty."}, status=400)
        
        # Calculate totals
        subtotal = cart.total
        delivery_cost = 0
        
        if data['delivery_type'] == 'pickup':
            pickup_station = get_object_or_404(PickupStation, id=data['pickup_station_id'])
            delivery_cost = pickup_station.delivery_cost
        else:
            county = get_object_or_404(County, name=data['shipping_county'])
            delivery_cost = county.home_delivery_cost
        
        total = subtotal + delivery_cost
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            delivery_type=data['delivery_type'],
            pickup_station=pickup_station if data['delivery_type'] == 'pickup' else None,
            shipping_full_name=data.get('shipping_full_name', ''),
            shipping_phone=data.get('shipping_phone', ''),
            shipping_county=data.get('shipping_county', ''),
            shipping_town=data.get('shipping_town', ''),
            shipping_street=data.get('shipping_street', ''),
            shipping_building=data.get('shipping_building', ''),
            subtotal=subtotal,
            delivery_cost=delivery_cost,
            total=total,
            customer_note=data.get('customer_note', ''),
        )
        
        # Create order items from cart
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                variant=cart_item.variant,
                product_name=cart_item.product.name,
                variant_name=cart_item.variant.name if cart_item.variant else '',
                sku=cart_item.variant.sku if cart_item.variant else cart_item.product.sku,
                unit_price=cart_item.unit_price,
                quantity=cart_item.quantity,
                subtotal=cart_item.subtotal,
            )
        
        # Create payment record
        payment = Payment.objects.create(
            order=order,
            method=data['payment_method'],
            status='pending',
            amount=total,
            currency='KES'
        )
        
        # Create status history
        OrderStatusHistory.objects.create(
            order=order,
            status='pending',
            note='Order placed, awaiting payment.',
            created_by=request.user
        )
        
        # Clear cart
        cart.items.all().delete()
        
        # Return order data
        order_serializer = OrderSerializer(order)
        
        # If payment method is COD, mark as confirmed immediately
        if data['payment_method'] == 'cod':
            payment.status = 'success'
            payment.save()
            order.status = 'confirmed'
            order.save()
            OrderStatusHistory.objects.create(
                order=order,
                status='confirmed',
                note='Order confirmed (Cash on Delivery).',
                created_by=request.user
            )
        
        return Response({
            'order': order_serializer.data,
            'payment_id': str(payment.id)
        }, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    """List user's orders"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            'items', 'status_history', 'payment'
        )


class OrderDetailView(generics.RetrieveAPIView):
    """Get order details"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'order_number'
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            'items', 'status_history', 'payment', 'pickup_station'
        )


class CancelOrderView(APIView):
    """Cancel an order if it's still pending"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number, user=request.user)
        
        if order.status not in ['pending', 'confirmed']:
            return Response({"detail": "Order cannot be cancelled at this stage."}, status=400)
        
        order.status = 'cancelled'
        order.save()
        
        OrderStatusHistory.objects.create(
            order=order,
            status='cancelled',
            note=request.data.get('reason', 'Order cancelled by customer.'),
            created_by=request.user
        )
        
        return Response({"detail": "Order cancelled successfully."})


# ─────────────────────────────────────────────
#  PAYMENT VIEWS
# ─────────────────────────────────────────────

class MpesaInitiateView(APIView):
    """Initiate M-Pesa STK Push payment"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = MpesaInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order_id = serializer.validated_data['order_id']
        phone_number = serializer.validated_data['phone_number']
        
        order = get_object_or_404(Order, id=order_id, user=request.user)
        payment = get_object_or_404(Payment, order=order)
        
        if payment.status != 'pending':
            return Response({"detail": "Payment already processed."}, status=400)
        
        # Initialize M-Pesa API
        mpesa = MpesaAPI()
        response = mpesa.stk_push(
            phone_number=phone_number,
            amount=str(int(order.total)),
            account_reference=f"IKN{order.order_number[-8:]}",
            transaction_desc=f"Payment for order {order.order_number}"
        )
        
        if response.get('ResponseCode') == '0':
            # Create MpesaTransaction record
            mpesa_trans = MpesaTransaction.objects.create(
                payment=payment,
                phone_number=phone_number,
                checkout_request_id=response['CheckoutRequestID'],
                merchant_request_id=response.get('MerchantRequestID', ''),
                response_code=response['ResponseCode'],
                response_description=response.get('ResponseDescription', ''),
                customer_message=response.get('CustomerMessage', ''),
            )
            
            payment.status = 'processing'
            payment.save()
            
            # Start polling task
            poll_mpesa_transaction.delay(mpesa_trans.checkout_request_id)
            
            return Response({
                'checkout_request_id': mpesa_trans.checkout_request_id,
                'customer_message': response.get('CustomerMessage', ''),
                'response_code': response.get('ResponseCode')
            })
        
        return Response(response, status=400)


class MpesaCallbackView(APIView):
    """M-Pesa Daraja callback endpoint (public)"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        data = request.data
        checkout_request_id = data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')
        
        if checkout_request_id:
            mpesa_trans = get_object_or_404(MpesaTransaction, checkout_request_id=checkout_request_id)
            mpesa_trans.callback_received = True
            mpesa_trans.raw_callback = data
            mpesa_trans.save()
            
            # Update from callback
            callback_data = data.get('Body', {}).get('stkCallback', {})
            result_code = callback_data.get('ResultCode')
            result_desc = callback_data.get('ResultDesc')
            
            mpesa_trans.result_code = result_code
            mpesa_trans.result_description = result_desc
            
            if result_code == '0':
                # Payment successful
                mpesa_trans.is_confirmed = True
                mpesa_trans.mpesa_receipt_number = callback_data.get('CallbackMetadata', {}).get('Item', [{}])[0].get('Value', '')
                
                # Update payment and order
                payment = mpesa_trans.payment
                payment.status = 'success'
                payment.save()
                
                order = payment.order
                order.status = 'confirmed'
                order.save()
                
                OrderStatusHistory.objects.create(
                    order=order,
                    status='confirmed',
                    note=f'Payment confirmed via M-Pesa. Receipt: {mpesa_trans.mpesa_receipt_number}'
                )
            elif result_code == '1037':
                # User cancelled
                mpesa_trans.result_description = "User cancelled transaction"
                mpesa_trans.payment.status = 'failed'
                mpesa_trans.payment.save()
            
            mpesa_trans.save()
        
        return Response({"ResultCode": 0, "ResultDesc": "Success"})


class MpesaStatusView(APIView):
    """Poll M-Pesa transaction status"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, checkout_request_id):
        mpesa_trans = get_object_or_404(MpesaTransaction, checkout_request_id=checkout_request_id)
        
        # Check ownership via order
        if mpesa_trans.payment.order.user != request.user:
            return Response({"detail": "Not authorized."}, status=403)
        
        serializer = MpesaStatusSerializer(mpesa_trans)
        return Response(serializer.data)


class PaypalCreateOrderView(APIView):
    """Create PayPal order"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PaypalCreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order_id = serializer.validated_data['order_id']
        order = get_object_or_404(Order, id=order_id, user=request.user)
        payment = get_object_or_404(Payment, order=order)
        
        if payment.status != 'pending':
            return Response({"detail": "Payment already processed."}, status=400)
        
        paypal = PayPalAPI()
        paypal_order = paypal.create_order(
            amount=str(order.total),
            currency='KES',
            return_url=f"{settings.FRONTEND_URL}/order-confirmation/{order.order_number}",
            cancel_url=f"{settings.FRONTEND_URL}/checkout"
        )
        
        if paypal_order.get('id'):
            PaypalTransaction.objects.create(
                payment=payment,
                paypal_order_id=paypal_order['id'],
                status=paypal_order.get('status')
            )
            
            payment.status = 'processing'
            payment.save()
            
            # Find approval URL
            approval_url = None
            for link in paypal_order.get('links', []):
                if link.get('rel') == 'approve':
                    approval_url = link.get('href')
                    break
            
            return Response({
                'paypal_order_id': paypal_order['id'],
                'approval_url': approval_url
            })
        
        return Response(paypal_order, status=400)


class PaypalCaptureView(APIView):
    """Capture PayPal payment after approval"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PaypalCaptureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        paypal_order_id = serializer.validated_data['paypal_order_id']
        
        paypal_trans = get_object_or_404(PaypalTransaction, paypal_order_id=paypal_order_id)
        
        if paypal_trans.payment.order.user != request.user:
            return Response({"detail": "Not authorized."}, status=403)
        
        paypal = PayPalAPI()
        capture_response = paypal.capture_order(paypal_order_id)
        
        paypal_trans.raw_response = capture_response
        paypal_trans.status = capture_response.get('status')
        
        if capture_response.get('status') == 'COMPLETED':
            # Extract capture ID
            captures = capture_response.get('purchase_units', [{}])[0].get('payments', {}).get('captures', [])
            if captures:
                paypal_trans.paypal_capture_id = captures[0].get('id')
            
            # Update payment and order
            payment = paypal_trans.payment
            payment.status = 'success'
            payment.save()
            
            order = payment.order
            order.status = 'confirmed'
            order.save()
            
            OrderStatusHistory.objects.create(
                order=order,
                status='confirmed',
                note=f'Payment confirmed via PayPal. Transaction ID: {paypal_trans.paypal_capture_id}'
            )
        
        paypal_trans.save()
        
        return Response({
            'status': capture_response.get('status'),
            'paypal_capture_id': paypal_trans.paypal_capture_id
        })


# ─────────────────────────────────────────────
#  SEARCH VIEW
# ─────────────────────────────────────────────

class SearchView(generics.ListAPIView):
    """Global search endpoint"""
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)
        q = self.request.query_params.get('q', '')
        category = self.request.query_params.get('category')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        brand = self.request.query_params.get('brand')
        sort = self.request.query_params.get('sort', '-created_at')
        
        if q:
            queryset = queryset.filter(
                Q(name__icontains=q) |
                Q(description__icontains=q) |
                Q(brand__name__icontains=q) |
                Q(sku__icontains=q)
            )
        
        if category:
            queryset = queryset.filter(category__slug=category)
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        if brand:
            queryset = queryset.filter(brand__slug=brand)
        
        # Apply sorting
        if sort:
            if sort == 'price_low':
                queryset = queryset.order_by('price')
            elif sort == 'price_high':
                queryset = queryset.order_by('-price')
            elif sort == 'newest':
                queryset = queryset.order_by('-created_at')
            elif sort == 'popular':
                queryset = queryset.order_by('-sold_count')
            elif sort == 'rating':
                queryset = queryset.annotate(avg_rating=Avg('reviews__rating')).order_by('-avg_rating')
            else:
                queryset = queryset.order_by(sort)
        
        return queryset


# ─────────────────────────────────────────────
#  BANNER VIEWS
# ─────────────────────────────────────────────

class BannerListView(generics.ListAPIView):
    """List active banners"""
    queryset = Banner.objects.filter(is_active=True)
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]
    pagination_class = None
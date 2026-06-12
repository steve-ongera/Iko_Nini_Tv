"""
core/serializers.py
Iko Nini TV — DRF Serializers
"""

from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
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


# ─────────────────────────────────────────────
#  AUTH
# ─────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label="Confirm password")

    class Meta:
        model = User
        fields = ["email", "first_name", "last_name", "phone", "password", "password2"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data["email"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")
        data["user"] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "phone", "avatar",
                  "full_name", "date_joined", "email_verified"]
        read_only_fields = ["id", "email", "date_joined", "email_verified"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match."})
        return data


class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = ["id", "label", "full_name", "phone", "county", "town",
                  "street", "building", "is_default"]


# ─────────────────────────────────────────────
#  DELIVERY
# ─────────────────────────────────────────────

class PickupStationSerializer(serializers.ModelSerializer):
    county_name = serializers.ReadOnlyField(source="county.name")

    class Meta:
        model = PickupStation
        fields = ["id", "name", "slug", "county", "county_name", "address", "phone",
                  "latitude", "longitude", "delivery_cost", "operating_hours", "is_active"]


class CountySerializer(serializers.ModelSerializer):
    pickup_stations = PickupStationSerializer(many=True, read_only=True)

    class Meta:
        model = County
        fields = ["id", "name", "slug", "home_delivery_cost", "pickup_stations", "is_active"]


class DeliveryCalculateSerializer(serializers.Serializer):
    delivery_type = serializers.ChoiceField(choices=["pickup", "home"])
    pickup_station_id = serializers.IntegerField(required=False, allow_null=True)
    county_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        if data["delivery_type"] == "pickup" and not data.get("pickup_station_id"):
            raise serializers.ValidationError({"pickup_station_id": "Required for pickup delivery."})
        if data["delivery_type"] == "home" and not data.get("county_id"):
            raise serializers.ValidationError({"county_id": "Required for home delivery."})
        return data


# ─────────────────────────────────────────────
#  CATEGORIES & BRANDS
# ─────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent", "image", "description",
                  "meta_title", "meta_description", "children"]

    def get_children(self, obj):
        return CategorySerializer(obj.children.filter(is_active=True), many=True).data


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "logo"]


# ─────────────────────────────────────────────
#  PRODUCTS
# ─────────────────────────────────────────────

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "sort_order"]


class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariant
        fields = ["id", "name", "sku", "price", "effective_price", "stock",
                  "image", "attributes", "is_active"]


class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = ["id", "user_name", "rating", "title", "body",
                  "verified_purchase", "created_at"]
        read_only_fields = ["verified_purchase", "created_at"]

    def get_user_name(self, obj):
        name = obj.user.full_name
        # Partially mask: "John D."
        parts = name.split()
        if len(parts) >= 2:
            return f"{parts[0]} {parts[1][0]}."
        return name


class ProductCreateReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReview
        fields = ["rating", "title", "body"]


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product cards/grid."""
    primary_image = serializers.SerializerMethodField()
    category_name = serializers.ReadOnlyField(source="category.name")
    brand_name = serializers.ReadOnlyField(source="brand.name")
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()
    discount_percent = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "price", "compare_at_price", "discount_percent",
            "primary_image", "category_name", "brand_name", "in_stock",
            "average_rating", "review_count", "is_flash_sale", "flash_sale_end",
            "sold_count",
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(img.image.url)
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full product detail including images, variants, reviews."""
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()
    discount_percent = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "brand", "category",
            "description", "short_description",
            "price", "compare_at_price", "discount_percent",
            "stock", "track_stock", "in_stock",
            "images", "variants", "reviews",
            "average_rating", "review_count",
            "meta_title", "meta_description", "meta_keywords",
            "is_featured", "is_flash_sale", "flash_sale_end",
            "weight", "views_count", "sold_count",
            "created_at",
        ]

    def get_reviews(self, obj):
        qs = obj.reviews.filter(is_approved=True)[:10]
        return ProductReviewSerializer(qs, many=True).data


class RecentlyViewedSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = RecentlyViewedProduct
        fields = ["product", "viewed_at"]


# ─────────────────────────────────────────────
#  CART
# ─────────────────────────────────────────────

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    variant = ProductVariantSerializer(read_only=True)
    variant_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    unit_price = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_id", "variant", "variant_id",
                  "quantity", "unit_price", "subtotal"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()
    items_count = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ["id", "items", "total", "items_count", "updated_at"]


# ─────────────────────────────────────────────
#  WISHLIST
# ─────────────────────────────────────────────

class WishlistSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "product_id", "added_at"]


# ─────────────────────────────────────────────
#  ORDERS
# ─────────────────────────────────────────────

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "variant_name", "sku",
                  "unit_price", "quantity", "subtotal"]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ["status", "note", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    pickup_station = PickupStationSerializer(read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    payment_status = serializers.SerializerMethodField()
    payment_method = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "status", "delivery_type",
            "pickup_station",
            "shipping_full_name", "shipping_phone", "shipping_county",
            "shipping_town", "shipping_street", "shipping_building",
            "subtotal", "delivery_cost", "total",
            "customer_note", "items", "status_history",
            "payment_status", "payment_method",
            "created_at", "updated_at",
        ]

    def get_payment_status(self, obj):
        try:
            return obj.payment.status
        except Exception:
            return None

    def get_payment_method(self, obj):
        try:
            return obj.payment.method
        except Exception:
            return None


class PlaceOrderSerializer(serializers.Serializer):
    """Input for creating an order from cart."""
    delivery_type = serializers.ChoiceField(choices=["pickup", "home"])
    pickup_station_id = serializers.IntegerField(required=False, allow_null=True)

    # Home delivery fields
    shipping_full_name = serializers.CharField(required=False, max_length=150)
    shipping_phone = serializers.CharField(required=False, max_length=20)
    shipping_county = serializers.CharField(required=False, max_length=100)
    shipping_town = serializers.CharField(required=False, max_length=100)
    shipping_street = serializers.CharField(required=False, max_length=255)
    shipping_building = serializers.CharField(required=False, max_length=100, allow_blank=True)

    payment_method = serializers.ChoiceField(choices=["mpesa", "paypal", "cod"])
    customer_note = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data["delivery_type"] == "pickup" and not data.get("pickup_station_id"):
            raise serializers.ValidationError({"pickup_station_id": "Required for pickup."})
        if data["delivery_type"] == "home":
            required = ["shipping_full_name", "shipping_phone", "shipping_county",
                        "shipping_town", "shipping_street"]
            for field in required:
                if not data.get(field):
                    raise serializers.ValidationError({field: "Required for home delivery."})
        return data


# ─────────────────────────────────────────────
#  PAYMENTS
# ─────────────────────────────────────────────

class MpesaInitiateSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    phone_number = serializers.CharField(max_length=15,
                                         help_text="Format: 254XXXXXXXXX")

    def validate_phone_number(self, value):
        value = value.strip().replace(" ", "").replace("+", "")
        if not value.startswith("254") or len(value) != 12:
            raise serializers.ValidationError(
                "Phone number must be in format 254XXXXXXXXX (12 digits)."
            )
        return value


class MpesaStatusSerializer(serializers.ModelSerializer):
    order_number = serializers.ReadOnlyField(source="payment.order.order_number")

    class Meta:
        model = MpesaTransaction
        fields = [
            "checkout_request_id", "phone_number", "is_confirmed",
            "result_code", "result_description", "mpesa_receipt_number",
            "order_number", "callback_received",
        ]


class PaypalCreateOrderSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()


class PaypalCaptureSerializer(serializers.Serializer):
    paypal_order_id = serializers.CharField()


# ─────────────────────────────────────────────
#  BANNERS
# ─────────────────────────────────────────────

class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ["id", "title", "subtitle", "image", "link", "sort_order"]
"""
core/admin.py
Iko Nini TV — Django admin configuration.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Sum, Count
from django.utils.timezone import now

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
#  CUSTOM USER
# ─────────────────────────────────────────────

class UserAddressInline(admin.TabularInline):
    model = UserAddress
    extra = 0
    fields = ("label", "full_name", "phone", "county", "town", "street", "is_default")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "full_name", "is_active", "is_staff", "email_verified", "date_joined")
    list_filter = ("is_active", "is_staff", "email_verified")
    search_fields = ("email", "first_name", "last_name", "phone")
    ordering = ("-date_joined",)
    readonly_fields = ("date_joined", "last_login")
    inlines = [UserAddressInline]

    fieldsets = (
        ("Account", {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "phone", "avatar")}),
        ("Verification", {"fields": ("email_verified", "email_verification_token")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("date_joined", "last_login")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "password1", "password2"),
        }),
    )


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ("user", "label", "full_name", "county", "town", "is_default")
    list_filter = ("is_default", "county")
    search_fields = ("user__email", "full_name", "phone", "county", "town")
    raw_id_fields = ("user",)


# ─────────────────────────────────────────────
#  DELIVERY
# ─────────────────────────────────────────────

class PickupStationInline(admin.TabularInline):
    model = PickupStation
    extra = 0
    fields = ("name", "address", "delivery_cost", "operating_hours", "is_active")
    show_change_link = True


@admin.register(County)
class CountyAdmin(admin.ModelAdmin):
    list_display = ("name", "home_delivery_cost", "is_active", "station_count")
    list_filter = ("is_active",)
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [PickupStationInline]

    def station_count(self, obj):
        return obj.pickup_stations.count()
    station_count.short_description = "Stations"


@admin.register(PickupStation)
class PickupStationAdmin(admin.ModelAdmin):
    list_display = ("name", "county", "delivery_cost", "operating_hours", "is_active")
    list_filter = ("is_active", "county")
    search_fields = ("name", "county__name", "address")
    prepopulated_fields = {"slug": ("name",)}
    raw_id_fields = ("county",)


# ─────────────────────────────────────────────
#  CATEGORIES & BRANDS
# ─────────────────────────────────────────────

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "is_active", "sort_order", "product_count")
    list_filter = ("is_active", "parent")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("sort_order", "is_active")
    ordering = ("sort_order", "name")

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = "Products"


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "product_count", "logo_preview")
    list_filter = ("is_active",)
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = "Products"

    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" height="30" />', obj.logo.url)
        return "—"
    logo_preview.short_description = "Logo"


# ─────────────────────────────────────────────
#  PRODUCTS
# ─────────────────────────────────────────────

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "alt_text", "is_primary", "sort_order")
    readonly_fields = ("image_preview",)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" height="50" />', obj.image.url)
        return "—"
    image_preview.short_description = "Preview"


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    fields = ("name", "sku", "price", "stock", "attributes", "is_active")


class ProductReviewInline(admin.TabularInline):
    model = ProductReview
    extra = 0
    fields = ("user", "rating", "title", "is_approved", "verified_purchase", "created_at")
    readonly_fields = ("created_at",)
    raw_id_fields = ("user",)
    show_change_link = True


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name", "sku", "category", "brand", "price", "stock",
        "is_active", "is_featured", "is_flash_sale", "sold_count", "average_rating",
    )
    list_filter = ("is_active", "is_featured", "is_flash_sale", "category", "brand")
    search_fields = ("name", "sku", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at", "views_count", "sold_count", "discount_percent")
    raw_id_fields = ("category", "brand")
    list_editable = ("is_active", "is_featured", "is_flash_sale")
    inlines = [ProductImageInline, ProductVariantInline, ProductReviewInline]

    fieldsets = (
        ("Basic Info", {
            "fields": ("name", "slug", "sku", "brand", "category", "description", "short_description"),
        }),
        ("Pricing", {
            "fields": ("price", "compare_at_price", "cost_price", "discount_percent"),
        }),
        ("Stock", {
            "fields": ("stock", "low_stock_threshold", "track_stock"),
        }),
        ("SEO", {
            "classes": ("collapse",),
            "fields": ("meta_title", "meta_description", "meta_keywords"),
        }),
        ("Flags", {
            "fields": ("is_active", "is_featured", "is_flash_sale", "flash_sale_end"),
        }),
        ("Logistics & Stats", {
            "fields": ("weight", "views_count", "sold_count", "created_at", "updated_at"),
        }),
    )

    def average_rating(self, obj):
        r = obj.average_rating
        return f"{r} ★" if r else "—"
    average_rating.short_description = "Rating"


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "user", "rating", "title", "is_approved", "verified_purchase", "created_at")
    list_filter = ("is_approved", "rating", "verified_purchase")
    search_fields = ("product__name", "user__email", "title", "body")
    list_editable = ("is_approved",)
    raw_id_fields = ("product", "user")
    readonly_fields = ("created_at",)


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("product", "name", "sku", "price", "stock", "is_active")
    list_filter = ("is_active",)
    search_fields = ("product__name", "name", "sku")
    raw_id_fields = ("product",)


# ─────────────────────────────────────────────
#  CART
# ─────────────────────────────────────────────

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ("product", "variant", "quantity", "unit_price", "subtotal")
    readonly_fields = ("unit_price", "subtotal")
    raw_id_fields = ("product", "variant")

    def unit_price(self, obj):
        return obj.unit_price
    unit_price.short_description = "Unit Price"

    def subtotal(self, obj):
        return obj.subtotal
    subtotal.short_description = "Subtotal"


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "session_key", "items_count", "total", "created_at", "updated_at")
    search_fields = ("user__email", "session_key")
    readonly_fields = ("id", "total", "items_count", "created_at", "updated_at")
    raw_id_fields = ("user",)
    inlines = [CartItemInline]

    def items_count(self, obj):
        return obj.items_count
    items_count.short_description = "Items"

    def total(self, obj):
        return f"KES {obj.total:,.2f}"
    total.short_description = "Total"


# ─────────────────────────────────────────────
#  WISHLIST
# ─────────────────────────────────────────────

@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "added_at")
    search_fields = ("user__email", "product__name")
    raw_id_fields = ("user", "product")
    readonly_fields = ("added_at",)


# ─────────────────────────────────────────────
#  ORDERS
# ─────────────────────────────────────────────

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ("product_name", "variant_name", "sku", "unit_price", "quantity", "subtotal")
    readonly_fields = ("subtotal",)


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    fields = ("status", "note", "created_by", "created_at")
    readonly_fields = ("created_at",)
    raw_id_fields = ("created_by",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number", "user", "status", "delivery_type",
        "subtotal", "delivery_cost", "total", "created_at",
    )
    list_filter = ("status", "delivery_type")
    search_fields = ("order_number", "user__email", "shipping_full_name", "shipping_phone")
    readonly_fields = ("id", "order_number", "total", "created_at", "updated_at")
    raw_id_fields = ("user", "pickup_station")
    inlines = [OrderItemInline, OrderStatusHistoryInline]

    fieldsets = (
        ("Order Info", {
            "fields": ("id", "order_number", "user", "status", "customer_note"),
        }),
        ("Delivery", {
            "fields": (
                "delivery_type", "pickup_station",
                "shipping_full_name", "shipping_phone",
                "shipping_county", "shipping_town",
                "shipping_street", "shipping_building",
            ),
        }),
        ("Costs", {
            "fields": ("subtotal", "delivery_cost", "total"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
        }),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Auto-log status change
        if change:
            OrderStatusHistory.objects.create(
                order=obj,
                status=obj.status,
                created_by=request.user,
                note="Status updated via admin.",
            )


# ─────────────────────────────────────────────
#  PAYMENTS
# ─────────────────────────────────────────────

class MpesaTransactionInline(admin.StackedInline):
    model = MpesaTransaction
    extra = 0
    readonly_fields = (
        "phone_number", "checkout_request_id", "merchant_request_id",
        "response_code", "response_description", "customer_message",
        "result_code", "result_description", "mpesa_receipt_number",
        "transaction_date", "is_confirmed", "callback_received",
        "poll_count", "last_polled_at", "raw_callback", "created_at",
    )


class PaypalTransactionInline(admin.StackedInline):
    model = PaypalTransaction
    extra = 0
    readonly_fields = (
        "paypal_order_id", "paypal_capture_id", "payer_email",
        "payer_name", "status", "raw_response", "created_at",
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("order_link", "method", "status", "amount", "currency", "created_at")
    list_filter = ("method", "status", "currency")
    search_fields = ("order__order_number", "order__user__email")
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("order",)
    inlines = [MpesaTransactionInline, PaypalTransactionInline]

    def order_link(self, obj):
        url = reverse("admin:core_order_change", args=[obj.order.pk])
        return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
    order_link.short_description = "Order"


@admin.register(MpesaTransaction)
class MpesaTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "checkout_request_id", "phone_number", "is_confirmed",
        "callback_received", "mpesa_receipt_number", "poll_count", "created_at",
    )
    list_filter = ("is_confirmed", "callback_received")
    search_fields = ("checkout_request_id", "phone_number", "mpesa_receipt_number")
    readonly_fields = (
        "checkout_request_id", "merchant_request_id", "response_code",
        "response_description", "customer_message", "result_code",
        "result_description", "mpesa_receipt_number", "transaction_date",
        "raw_callback", "created_at", "last_polled_at",
    )
    raw_id_fields = ("payment",)


@admin.register(PaypalTransaction)
class PaypalTransactionAdmin(admin.ModelAdmin):
    list_display = ("paypal_order_id", "payer_email", "payer_name", "status", "created_at")
    search_fields = ("paypal_order_id", "paypal_capture_id", "payer_email")
    readonly_fields = ("paypal_order_id", "paypal_capture_id", "raw_response", "created_at")
    raw_id_fields = ("payment",)


# ─────────────────────────────────────────────
#  BANNER
# ─────────────────────────────────────────────

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "sort_order", "banner_preview", "created_at")
    list_filter = ("is_active",)
    search_fields = ("title", "subtitle")
    list_editable = ("is_active", "sort_order")
    ordering = ("sort_order",)

    def banner_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" height="40" />', obj.image.url)
        return "—"
    banner_preview.short_description = "Preview"
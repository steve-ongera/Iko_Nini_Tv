"""
core/models.py
Iko Nini TV — All models for the core store application.
"""

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils.text import slugify
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import random
import string


# ─────────────────────────────────────────────
#  CUSTOM USER
# ─────────────────────────────────────────────

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=64, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    class Meta:
        verbose_name = "User"
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class UserAddress(models.Model):
    """Saved delivery addresses on user account."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField(max_length=50, default="Home")  # Home, Work, etc.
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    county = models.CharField(max_length=100)
    town = models.CharField(max_length=100)
    street = models.CharField(max_length=255)
    building = models.CharField(max_length=100, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.user.email} — {self.label}"

    def save(self, *args, **kwargs):
        if self.is_default:
            # Unset other defaults for this user
            UserAddress.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────
#  DELIVERY — COUNTIES & PICKUP STATIONS
# ─────────────────────────────────────────────

class County(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    home_delivery_cost = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        help_text="Default home-delivery cost for this county (KES)"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Counties"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class PickupStation(models.Model):
    """
    Each county can have many pickup stations.
    Example — Mombasa: Shanzu, Bamburi, Majaoni, Likoni, Mtwapa
    Each station has its own delivery cost.
    """
    county = models.ForeignKey(County, on_delete=models.CASCADE, related_name="pickup_stations")
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    address = models.TextField(help_text="Physical address of the station")
    phone = models.CharField(max_length=20, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    delivery_cost = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        help_text="Delivery cost to this station (KES)"
    )
    operating_hours = models.CharField(max_length=100, default="Mon–Sat 8am–6pm")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["county", "name"]

    def __str__(self):
        return f"{self.county.name} — {self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.county.name}-{self.name}"
            self.slug = slugify(base)
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────
#  CATEGORIES & BRANDS
# ─────────────────────────────────────────────

class Category(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    description = models.TextField(blank=True)
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Brand(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────
#  PRODUCTS
# ─────────────────────────────────────────────

class Product(models.Model):
    """
    Main product model — SEO slugs, variants handled via ProductVariant.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True,
                            help_text="Auto-generated SEO-friendly URL segment")
    sku = models.CharField(max_length=100, unique=True, blank=True)
    brand = models.ForeignKey(Brand, null=True, blank=True, on_delete=models.SET_NULL, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="products")
    description = models.TextField()
    short_description = models.TextField(max_length=500, blank=True)

    # Pricing
    price = models.DecimalField(max_digits=12, decimal_places=2)
    compare_at_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                           help_text="Original price before discount (crossed out)")
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Stock
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    track_stock = models.BooleanField(default=True)

    # SEO
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    meta_keywords = models.CharField(max_length=255, blank=True)

    # Flags
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_flash_sale = models.BooleanField(default=False)
    flash_sale_end = models.DateTimeField(null=True, blank=True)

    # Logistics
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True,
                                 help_text="Weight in kg")

    # Stats
    views_count = models.PositiveIntegerField(default=0)
    sold_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["category"]),
            models.Index(fields=["is_active", "is_featured"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        if not self.sku:
            self.sku = "PRD-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
        super().save(*args, **kwargs)

    @property
    def discount_percent(self):
        if self.compare_at_price and self.compare_at_price > self.price:
            return int(((self.compare_at_price - self.price) / self.compare_at_price) * 100)
        return 0

    @property
    def average_rating(self):
        reviews = self.reviews.filter(is_approved=True)
        if reviews.exists():
            return round(reviews.aggregate(models.Avg("rating"))["rating__avg"], 1)
        return 0

    @property
    def review_count(self):
        return self.reviews.filter(is_approved=True).count()

    @property
    def in_stock(self):
        if not self.track_stock:
            return True
        return self.stock > 0


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "-is_primary"]

    def save(self, *args, **kwargs):
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class ProductVariant(models.Model):
    """
    e.g. Size: L / Color: Red  →  a specific SKU/price/stock.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    name = models.CharField(max_length=100, help_text="e.g. 'Red / XL'")
    sku = models.CharField(max_length=100, unique=True, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                help_text="Override product price if set")
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to="variants/", blank=True, null=True)
    attributes = models.JSONField(default=dict, help_text='{"color":"Red","size":"XL"}')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.product.name} — {self.name}"

    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = "VAR-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
        super().save(*args, **kwargs)

    @property
    def effective_price(self):
        return self.price if self.price else self.product.price


class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=100, blank=True)
    body = models.TextField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    verified_purchase = models.BooleanField(default=False)

    class Meta:
        unique_together = ("product", "user")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.name} — {self.rating}★ by {self.user.email}"


class RecentlyViewedProduct(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="recently_viewed")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "product")
        ordering = ["-viewed_at"]


# ─────────────────────────────────────────────
#  CART
# ─────────────────────────────────────────────

class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="cart", null=True, blank=True)
    session_key = models.CharField(max_length=64, blank=True, db_index=True,
                                   help_text="For anonymous/guest carts")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart {self.id}"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def items_count(self):
        return self.items.aggregate(total=models.Sum("quantity"))["total"] or 0


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, null=True, blank=True, on_delete=models.SET_NULL)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("cart", "product", "variant")

    @property
    def unit_price(self):
        if self.variant and self.variant.price:
            return self.variant.price
        return self.product.price

    @property
    def subtotal(self):
        return self.unit_price * self.quantity


# ─────────────────────────────────────────────
#  WISHLIST
# ─────────────────────────────────────────────

class WishlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wishlist")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "product")
        ordering = ["-added_at"]


# ─────────────────────────────────────────────
#  ORDERS
# ─────────────────────────────────────────────

def generate_order_number():
    return "IKN-" + "".join(random.choices(string.digits, k=8))


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        OUT_FOR_DELIVERY = "out_for_delivery", "Out for Delivery"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"
        REFUNDED = "refunded", "Refunded"

    class DeliveryType(models.TextChoices):
        PICKUP = "pickup", "Pickup Station"
        HOME = "home", "Home Delivery"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=20, unique=True, default=generate_order_number)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="orders")

    # Status & delivery
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    delivery_type = models.CharField(max_length=10, choices=DeliveryType.choices, default=DeliveryType.PICKUP)

    # Pickup station (if delivery_type == PICKUP)
    pickup_station = models.ForeignKey(
        PickupStation, null=True, blank=True, on_delete=models.SET_NULL, related_name="orders"
    )

    # Home delivery address (if delivery_type == HOME)
    shipping_full_name = models.CharField(max_length=150, blank=True)
    shipping_phone = models.CharField(max_length=20, blank=True)
    shipping_county = models.CharField(max_length=100, blank=True)
    shipping_town = models.CharField(max_length=100, blank=True)
    shipping_street = models.CharField(max_length=255, blank=True)
    shipping_building = models.CharField(max_length=100, blank=True)

    # Costs
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Notes
    customer_note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["order_number"]), models.Index(fields=["user", "status"])]

    def __str__(self):
        return self.order_number

    def save(self, *args, **kwargs):
        self.total = self.subtotal + self.delivery_cost
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    variant = models.ForeignKey(ProductVariant, null=True, blank=True, on_delete=models.SET_NULL)
    product_name = models.CharField(max_length=255)       # Snapshot
    variant_name = models.CharField(max_length=100, blank=True)
    sku = models.CharField(max_length=100, blank=True)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    status = models.CharField(max_length=20, choices=Order.Status.choices)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["created_at"]


# ─────────────────────────────────────────────
#  PAYMENTS
# ─────────────────────────────────────────────

class Payment(models.Model):
    class Method(models.TextChoices):
        MPESA = "mpesa", "M-Pesa"
        PAYPAL = "paypal", "PayPal"
        CASH_ON_DELIVERY = "cod", "Cash on Delivery"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="payment")
    method = models.CharField(max_length=10, choices=Method.choices)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=5, default="KES")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.order.order_number} — {self.method} — {self.status}"


class MpesaTransaction(models.Model):
    """
    Tracks an M-Pesa STK Push from initiation to confirmation.
    Frontend polls /api/payments/mpesa/status/{checkout_request_id}/ for live updates.
    """
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name="mpesa")

    # From STK Push request
    phone_number = models.CharField(max_length=15)
    checkout_request_id = models.CharField(max_length=100, unique=True, db_index=True)
    merchant_request_id = models.CharField(max_length=100, blank=True)
    response_code = models.CharField(max_length=10, blank=True)
    response_description = models.TextField(blank=True)
    customer_message = models.TextField(blank=True)

    # From callback / query
    result_code = models.CharField(max_length=10, blank=True, null=True)
    result_description = models.TextField(blank=True)
    mpesa_receipt_number = models.CharField(max_length=50, blank=True)
    transaction_date = models.CharField(max_length=30, blank=True)

    # Polling state
    is_confirmed = models.BooleanField(default=False)
    callback_received = models.BooleanField(default=False)
    poll_count = models.PositiveSmallIntegerField(default=0)
    last_polled_at = models.DateTimeField(null=True, blank=True)

    raw_callback = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"STK {self.checkout_request_id} — {self.phone_number}"


class PaypalTransaction(models.Model):
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name="paypal")
    paypal_order_id = models.CharField(max_length=100, unique=True)
    paypal_capture_id = models.CharField(max_length=100, blank=True)
    payer_email = models.EmailField(blank=True)
    payer_name = models.CharField(max_length=150, blank=True)
    status = models.CharField(max_length=30, blank=True)
    raw_response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# ─────────────────────────────────────────────
#  BANNER / PROMOTIONAL
# ─────────────────────────────────────────────

class Banner(models.Model):
    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to="banners/")
    link = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return self.title
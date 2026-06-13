"""
core/management/commands/seed_data.py
Iko Nini TV — Seed the database with realistic demo data for our
streetwear/apparel catalogue (hoodies, tees, sweatpants, socks, crop tops).

More product lines will be added later — the category/brand structure
below is intentionally kept generic so new categories can be appended
without breaking anything.

Images are pulled randomly from:
    D:/gadaf/Documents/iko_nini_product

Banners specifically use banner_1, banner_2, banner_3 (any extension)
from that same folder — everything else (brands, categories, products)
gets a random image from the folder.

Usage:
    python manage.py seed_data
    python manage.py seed_data --clear          # wipe existing data first
    python manage.py seed_data --image-dir "C:/some/other/path"
"""

import os
import random
import string
from decimal import Decimal
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.utils.text import slugify

from core.models import (
    Banner,
    Brand,
    Cart,
    CartItem,
    Category,
    County,
    Order,
    OrderItem,
    OrderStatusHistory,
    Payment,
    PickupStation,
    Product,
    ProductImage,
    ProductReview,
    ProductVariant,
    User,
    UserAddress,
    WishlistItem,
)

# ─────────────────────────────────────────────────────────────
#  STATIC SEED DATA
# ─────────────────────────────────────────────────────────────

COUNTIES = [
    ("Nairobi", 200),
    ("Mombasa", 350),
    ("Kisumu", 400),
    ("Nakuru", 300),
    ("Eldoret", 450),
    ("Thika", 250),
    ("Machakos", 300),
    ("Nyeri", 350),
    ("Meru", 400),
    ("Kisii", 450),
]

PICKUP_STATIONS = {
    "Nairobi": [
        ("CBD — GPO", "Haile Selassie Ave, Nairobi CBD", 100),
        ("Westlands", "Westlands Commercial Centre", 150),
        ("Kasarani", "Kasarani Shoppers Mall", 150),
        ("Langata", "Wilson Airport Rd, Langata", 150),
        ("Eastleigh", "1st Avenue, Eastleigh", 120),
    ],
    "Mombasa": [
        ("Shanzu", "Shanzu Rd, Shanzu", 200),
        ("Bamburi", "Bamburi Beach Rd", 200),
        ("Likoni", "Likoni Ferry Terminal Area", 220),
        ("Mtwapa", "Mtwapa Town Centre", 210),
        ("Majaoni", "Majaoni Junction", 230),
    ],
    "Kisumu": [
        ("Kondele", "Kondele Market Junction", 180),
        ("Milimani", "Milimani Rd, Kisumu", 180),
        ("Nyalenda", "Nyalenda Shopping Centre", 190),
    ],
    "Nakuru": [
        ("Nakuru Town", "Kenyatta Ave, Nakuru", 160),
        ("Lanet", "Lanet Barracks Rd", 170),
    ],
    "Eldoret": [
        ("Town Centre", "Uganda Rd, Eldoret CBD", 200),
        ("Huruma", "Huruma Estate, Eldoret", 210),
    ],
}

# ─────────────────────────────────────────────
#  CATEGORIES, BRANDS & PRODUCTS
# ─────────────────────────────────────────────

# Top-level catalogue. New ranges (electronics, beauty, etc.) can simply be
# appended here later — the seeding logic below doesn't assume anything
# clothing-specific beyond the PRICE_RANGES / SIZE lookups further down.
CATEGORIES = [
    ("Apparel", None, [
        "Hoodies",
        "T-Shirts",
        "Sweatpants",
        "Socks",
        "Crop Tops - Full",
        "Crop Tops - Half",
    ]),
]

BRANDS = [
    "Iko Nini Originals",
    "Mkurugenzi Merch",
    "Nairobi Streetwear Co.",
    "247 Apparel",
    "Daystar Threads",
    "Continental Fits",
]

# Price ranges (KES) per category — used to randomise each product's price.
PRICE_RANGES = {
    "Hoodies": (3500, 4500),
    "T-Shirts": (1500, 2500),
    "Sweatpants": (2500, 4000),
    "Socks": (500, 1200),
    "Crop Tops - Full": (800, 1500),
    "Crop Tops - Half": (800, 1500),
}

PRODUCTS_BY_CATEGORY = {
    "Hoodies": [
        "Oversized Pullover Hoodie",
        "Classic Crewneck Hoodie",
        "Zip-Up Hoodie",
        "Embroidered Logo Hoodie",
        "Tie-Dye Hoodie",
    ],
    "T-Shirts": [
        "Classic Cotton Tee",
        "Oversized Graphic Tee",
        "Ribbed Crew Neck Tee",
        "Long Sleeve Tee",
        "Tie-Dye Tee",
    ],
    "Sweatpants": [
        "Jogger Sweatpants",
        "Relaxed Fit Sweatpants",
        "Cargo Sweatpants",
        "Tapered Track Pants",
    ],
    "Socks": [
        "Crew Socks (3-Pack)",
        "Ankle Socks (3-Pack)",
        "Patterned Crew Socks",
        "No-Show Socks (5-Pack)",
    ],
    "Crop Tops - Full": [
        "Ribbed Full Crop Top",
        "Oversized Full Crop Top",
        "Graphic Full Crop Top",
    ],
    "Crop Tops - Half": [
        "Fitted Half Crop Top",
        "Tank Half Crop Top",
        "Long Sleeve Half Crop Top",
    ],
}

# Sizing — applied when generating ProductVariant rows.
CLOTHING_SIZES = ["S", "M", "L", "XL", "XXL"]
SOCK_SIZES = ["S/M (UK 3-7)", "L/XL (UK 8-12)"]
COLORS = ["Black", "White", "Grey Melange", "Navy", "Maroon", "Olive Green", "Beige"]

PRODUCT_DESCRIPTIONS = [
    "Premium streetwear cut for everyday comfort, trusted by shoppers all over Kenya.",
    "Soft, durable fabric built to last wash after wash. Ships nationwide via Iko Nini TV.",
    "A wardrobe staple — relaxed fit, clean finish, and true-to-size sizing.",
    "Designed in Nairobi for everyday wear. Pairs easily with anything in your closet.",
    "Heavyweight cotton blend for a premium feel at an unbeatable price. Free delivery to selected pickup stations countrywide.",
]

REVIEW_BODIES = [
    "Fabric quality is excellent, fits true to size. Delivery was fast, arrived within 2 days to Mombasa!",
    "Exactly as pictured. Great stitching and the colour didn't fade after washing.",
    "Good value for money. Packaging was secure and the item was in perfect condition.",
    "Super comfortable, wears well. Customer support was helpful when I had a question about sizing.",
    "Amazing! Beat my expectations. Recommended for anyone looking for quality streetwear at a fair price.",
    "Solid build quality. Already recommended it to three friends and they all ordered too.",
    "Arrived faster than expected and fits perfectly. Very happy with the overall experience.",
    "Top notch. Worn it weekly for a month now and it still looks brand new.",
]

FIRST_NAMES = ["Brian", "Faith", "Kevin", "Aisha", "Michael", "Grace", "Daniel", "Mercy",
               "James", "Winnie", "Victor", "Sharon", "Peter", "Carol", "John", "Esther"]
LAST_NAMES  = ["Kamau", "Odhiambo", "Mwangi", "Otieno", "Njoroge", "Akinyi", "Wanjiru",
               "Koech", "Mutua", "Chebet", "Omondi", "Wairimu", "Gitau", "Kimani"]


# ─────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"}


def collect_images(directory: str) -> list[Path]:
    """Return all image paths found recursively under *directory*."""
    root = Path(directory)
    if not root.exists():
        return []
    return [
        p for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    ]


def pick_image(images: list[Path]) -> Path | None:
    return random.choice(images) if images else None


def find_image_by_stem(images: list[Path], stem: str) -> Path | None:
    """
    Find an image whose filename (without extension) matches *stem*,
    case-insensitively — e.g. find_image_by_stem(images, "banner_1")
    will match "banner_1.png", "Banner_1.jpg", etc.
    """
    stem_lower = stem.lower()
    for p in images:
        if p.stem.lower() == stem_lower:
            return p
    return None


def open_image_file(path: Path | None):
    """Return an open Django File object or None."""
    if path is None or not path.exists():
        return None
    return File(open(path, "rb"), name=path.name)


def rand_phone():
    prefix = random.choice(["0712", "0722", "0733", "0745", "0756", "0768", "0798"])
    return prefix + "".join(random.choices(string.digits, k=6))


def rand_price(category_name: str) -> int:
    """Pick a randomised price (rounded to the nearest 50) for a category."""
    low, high = PRICE_RANGES.get(category_name, (1000, 2000))
    price = random.randint(low, high)
    return (price // 50) * 50


# ─────────────────────────────────────────────────────────────
#  COMMAND
# ─────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Seed the database with realistic Iko Nini TV demo data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing seeded data before inserting fresh records.",
        )
        parser.add_argument(
            "--image-dir",
            type=str,
            default=r"D:\gadaf\Documents\iko_nini_product",
            help="Directory to pull product/banner images from.",
        )
        parser.add_argument("--users",    type=int, default=12, help="Number of demo users to create.")
        parser.add_argument("--orders",   type=int, default=20, help="Number of demo orders to create.")

    # ──────────────────────────────────────────
    def handle(self, *args, **options):
        self.image_dir  = options["image_dir"]
        self.num_users  = options["users"]
        self.num_orders = options["orders"]

        self.images = collect_images(self.image_dir)
        if not self.images:
            self.stdout.write(self.style.WARNING(
                f"⚠  No images found in '{self.image_dir}'. "
                "Products will be created without images."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"📸  Found {len(self.images)} image(s) in '{self.image_dir}'"
            ))

        if options["clear"]:
            self._clear()

        self._seed_counties_and_stations()
        self._seed_brands()
        self._seed_categories()
        self._seed_products()
        self._seed_banners()
        users = self._seed_users()
        self._seed_orders(users)
        self._seed_carts(users)
        self._seed_wishlists(users)

        self.stdout.write(self.style.SUCCESS("\n✅  Seeding complete!"))

    # ──────────────────────────────────────────
    def _clear(self):
        self.stdout.write("🗑  Clearing existing data …")
        models_to_clear = [
            Banner, WishlistItem, CartItem, Cart,
            OrderStatusHistory, Payment, OrderItem, Order,
            ProductReview, ProductVariant, ProductImage, Product,
            Brand, Category, PickupStation, County,
            UserAddress, User,
        ]
        for model in models_to_clear:
            model.objects.all().delete()
        self.stdout.write("   Done.\n")

    # ──────────────────────────────────────────
    def _seed_counties_and_stations(self):
        self.stdout.write("📍  Seeding counties & pickup stations …")
        self.county_map = {}

        for name, home_cost in COUNTIES:
            county, _ = County.objects.get_or_create(
                name=name,
                defaults={"home_delivery_cost": Decimal(home_cost)},
            )
            self.county_map[name] = county

        for county_name, stations in PICKUP_STATIONS.items():
            county = self.county_map.get(county_name)
            if not county:
                continue
            for station_name, address, cost in stations:
                PickupStation.objects.get_or_create(
                    county=county,
                    name=station_name,
                    defaults={
                        "address": address,
                        "delivery_cost": Decimal(cost),
                        "phone": rand_phone(),
                    },
                )
        self.stdout.write(f"   {County.objects.count()} counties, {PickupStation.objects.count()} stations.")

    # ──────────────────────────────────────────
    def _seed_brands(self):
        self.stdout.write("🏷  Seeding brands …")
        self.brand_objects = []
        for name in BRANDS:
            img_path = pick_image(self.images)
            brand, created = Brand.objects.get_or_create(name=name)
            if created and img_path:
                img_file = open_image_file(img_path)
                if img_file:
                    brand.logo.save(img_path.name, img_file, save=True)
                    img_file.file.close()
            self.brand_objects.append(brand)
        self.stdout.write(f"   {len(self.brand_objects)} brands.")

    # ──────────────────────────────────────────
    def _seed_categories(self):
        self.stdout.write("📂  Seeding categories …")
        self.category_map: dict[str, Category] = {}

        for parent_name, _, children in CATEGORIES:
            img_path = pick_image(self.images)
            parent, created = Category.objects.get_or_create(
                name=parent_name,
                defaults={"description": f"Browse our {parent_name} collection."},
            )
            if created and img_path:
                img_file = open_image_file(img_path)
                if img_file:
                    parent.image.save(img_path.name, img_file, save=True)
                    img_file.file.close()
            self.category_map[parent_name] = parent

            for child_name in children:
                img_path2 = pick_image(self.images)
                child, created2 = Category.objects.get_or_create(
                    name=child_name,
                    defaults={"parent": parent},
                )
                if created2 and img_path2:
                    img_file2 = open_image_file(img_path2)
                    if img_file2:
                        child.image.save(img_path2.name, img_file2, save=True)
                        img_file2.file.close()
                self.category_map[child_name] = child

        self.stdout.write(f"   {Category.objects.count()} categories.")

    # ──────────────────────────────────────────
    def _seed_products(self):
        self.stdout.write("📦  Seeding products …")
        self.all_products = []

        for cat_name, items in PRODUCTS_BY_CATEGORY.items():
            category = self.category_map.get(cat_name)
            if not category:
                continue

            for product_name in items:
                brand = random.choice(self.brand_objects)

                price = rand_price(cat_name)
                # Compare-at price gives a "was" price for a discount badge.
                markup_pct = random.uniform(0.10, 0.30)
                compare_price = int(price * (1 + markup_pct))
                compare_price = (compare_price // 50) * 50
                cost_price = int(price * 0.55)

                product, created = Product.objects.get_or_create(
                    name=product_name,
                    defaults={
                        "brand": brand,
                        "category": category,
                        "description": random.choice(PRODUCT_DESCRIPTIONS),
                        "short_description": f"Top-quality {product_name} available now.",
                        "price": Decimal(price),
                        "compare_at_price": Decimal(compare_price),
                        "cost_price": Decimal(cost_price),
                        "stock": random.randint(10, 150),
                        "is_active": True,
                        "is_featured": random.random() < 0.3,
                        "is_flash_sale": random.random() < 0.15,
                        "weight": Decimal(str(round(random.uniform(0.1, 0.7), 2))),
                    },
                )

                if created:
                    # 2–4 product images
                    num_images = random.randint(2, 4)
                    for idx in range(num_images):
                        img_path = pick_image(self.images)
                        if img_path:
                            img_file = open_image_file(img_path)
                            if img_file:
                                pi = ProductImage(
                                    product=product,
                                    alt_text=product_name,
                                    is_primary=(idx == 0),
                                    sort_order=idx,
                                )
                                pi.image.save(img_path.name, img_file, save=True)
                                img_file.file.close()

                    # Size / colour variants
                    self._seed_variants_for_product(product, cat_name, price)

                self.all_products.append(product)

        self.stdout.write(f"   {Product.objects.count()} products.")

    # ──────────────────────────────────────────
    def _seed_variants_for_product(self, product: Product, cat_name: str, base_price: int):
        """Create size/colour variants appropriate to the product's category."""
        if cat_name == "Socks":
            # Socks: just size variants, no colour split.
            for size in SOCK_SIZES:
                ProductVariant.objects.get_or_create(
                    product=product,
                    name=size,
                    defaults={
                        "price": Decimal(base_price),
                        "stock": random.randint(10, 60),
                        "attributes": {"size": size},
                    },
                )
            return

        # All other apparel: pick a small colourway + a spread of sizes.
        num_colors = random.randint(1, 2)
        colors = random.sample(COLORS, k=num_colors)
        num_sizes = random.randint(3, len(CLOTHING_SIZES))
        sizes = random.sample(CLOTHING_SIZES, k=num_sizes)

        for color in colors:
            for size in sizes:
                variant_name = f"{color} / {size}"
                price_delta = random.choice([0, 0, 0, 100, -100, 200])
                ProductVariant.objects.get_or_create(
                    product=product,
                    name=variant_name,
                    defaults={
                        "price": Decimal(max(base_price + price_delta, 100)),
                        "stock": random.randint(2, 40),
                        "attributes": {"color": color, "size": size},
                    },
                )

    # ──────────────────────────────────────────
    def _seed_banners(self):
        self.stdout.write("🖼  Seeding banners …")
        banner_data = [
            ("New Drop: Hoodie & Sweatpants Sets", "Stay cozy this season. Shop the latest arrivals.", "/shop/hoodies/"),
            ("Tees & Crop Tops — Up to 30% Off", "Limited time. Mix and match your favourites.", "/shop/t-shirts/"),
            ("Free Delivery to Nairobi Pickup Stations", "On orders above KES 2,000.", "/shop/"),
        ]
        for idx, (title, subtitle, link) in enumerate(banner_data, start=1):
            # Use banner_1 / banner_2 / banner_3 specifically (any extension).
            img_path = find_image_by_stem(self.images, f"banner_{idx}") or pick_image(self.images)
            banner, created = Banner.objects.get_or_create(
                title=title,
                defaults={
                    "subtitle": subtitle,
                    "link": link,
                    "is_active": True,
                    "sort_order": idx - 1,
                },
            )
            if created and img_path:
                img_file = open_image_file(img_path)
                if img_file:
                    banner.image.save(img_path.name, img_file, save=True)
                    img_file.file.close()
        self.stdout.write(f"   {Banner.objects.count()} banners.")

    # ──────────────────────────────────────────
    def _seed_users(self) -> list[User]:
        self.stdout.write(f"👤  Seeding {self.num_users} users …")
        users = []

        # Superuser
        if not User.objects.filter(email="admin@ikonini.tv").exists():
            User.objects.create_superuser(
                email="admin@ikonini.tv",
                password="admin1234",
                first_name="Admin",
                last_name="IkoNini",
            )
        self.stdout.write("   Superuser: admin@ikonini.tv / admin1234")

        # Demo buyer
        demo, _ = User.objects.get_or_create(
            email="demo@ikonini.tv",
            defaults={
                "first_name": "Demo",
                "last_name": "Buyer",
                "phone": "0712345678",
                "email_verified": True,
                "is_active": True,
            },
        )
        if not demo.has_usable_password():
            demo.set_password("demo1234")
            demo.save()
        users.append(demo)
        self.stdout.write("   Demo buyer:  demo@ikonini.tv / demo1234")

        # Random users
        counties_list = list(self.county_map.keys())
        for i in range(self.num_users):
            fname = random.choice(FIRST_NAMES)
            lname = random.choice(LAST_NAMES)
            email = f"{fname.lower()}.{lname.lower()}{i}@example.com"
            if User.objects.filter(email=email).exists():
                user = User.objects.get(email=email)
            else:
                user = User.objects.create_user(
                    email=email,
                    password="password123",
                    first_name=fname,
                    last_name=lname,
                    phone=rand_phone(),
                    email_verified=True,
                )
                county_name = random.choice(counties_list)
                UserAddress.objects.create(
                    user=user,
                    label="Home",
                    full_name=f"{fname} {lname}",
                    phone=rand_phone(),
                    county=county_name,
                    town=county_name,
                    street=f"{random.randint(1, 999)} {random.choice(['Moi Ave', 'Kenyatta Rd', 'Tom Mboya St', 'Kimathi St'])}",
                    is_default=True,
                )
            users.append(user)

        # Seed some reviews while we have users & products
        self._seed_reviews(users)

        self.stdout.write(f"   {User.objects.count()} total users.")
        return users

    # ──────────────────────────────────────────
    def _seed_reviews(self, users: list[User]):
        self.stdout.write("⭐  Seeding product reviews …")
        reviewed = set()
        for _ in range(min(40, len(users) * len(self.all_products))):
            user    = random.choice(users)
            product = random.choice(self.all_products)
            key = (user.pk, product.pk)
            if key in reviewed:
                continue
            reviewed.add(key)
            ProductReview.objects.get_or_create(
                product=product,
                user=user,
                defaults={
                    "rating":            random.randint(3, 5),
                    "title":             random.choice(["Great!", "Highly Recommend", "Worth it", "Solid buy"]),
                    "body":              random.choice(REVIEW_BODIES),
                    "is_approved":       True,
                    "verified_purchase": random.random() < 0.6,
                },
            )
        self.stdout.write(f"   {len(reviewed)} reviews.")

    # ──────────────────────────────────────────
    def _seed_orders(self, users: list[User]):
        self.stdout.write(f"🧾  Seeding {self.num_orders} orders …")
        all_stations = list(PickupStation.objects.select_related("county").all())
        counties_list = list(self.county_map.keys())
        statuses = list(Order.Status.values)

        for _ in range(self.num_orders):
            user = random.choice(users)
            delivery_type = random.choice([Order.DeliveryType.PICKUP, Order.DeliveryType.HOME])

            order_kwargs = {
                "user":          user,
                "status":        random.choice(statuses),
                "delivery_type": delivery_type,
                "customer_note": random.choice(["", "Please call before delivery.", "Leave at reception."]),
            }

            if delivery_type == Order.DeliveryType.PICKUP and all_stations:
                station = random.choice(all_stations)
                order_kwargs["pickup_station"] = station
                order_kwargs["delivery_cost"]  = station.delivery_cost
            else:
                county_name = random.choice(counties_list)
                county      = self.county_map[county_name]
                order_kwargs["shipping_full_name"] = user.full_name
                order_kwargs["shipping_phone"]     = user.phone or rand_phone()
                order_kwargs["shipping_county"]    = county_name
                order_kwargs["shipping_town"]      = county_name
                order_kwargs["shipping_street"]    = f"{random.randint(1,999)} Demo Street"
                order_kwargs["delivery_cost"]      = county.home_delivery_cost

            # Items
            num_items = random.randint(1, 4)
            chosen    = random.sample(self.all_products, min(num_items, len(self.all_products)))
            subtotal  = Decimal("0")

            order = Order.objects.create(subtotal=Decimal("0"), **order_kwargs)

            for product in chosen:
                qty       = random.randint(1, 3)
                unit_price = product.price
                variant    = None
                if product.variants.exists():
                    variant    = product.variants.order_by("?").first()
                    unit_price = variant.effective_price

                item_sub = unit_price * qty
                subtotal += item_sub

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    variant=variant,
                    product_name=product.name,
                    variant_name=variant.name if variant else "",
                    sku=variant.sku if variant else product.sku,
                    unit_price=unit_price,
                    quantity=qty,
                    subtotal=item_sub,
                )

            order.subtotal = subtotal
            order.total    = subtotal + order.delivery_cost
            order.save()

            # Status history
            OrderStatusHistory.objects.create(order=order, status=Order.Status.PENDING)
            if order.status not in (Order.Status.PENDING, Order.Status.CANCELLED):
                OrderStatusHistory.objects.create(order=order, status=Order.Status.CONFIRMED)

            # Payment
            method = random.choice(list(Payment.Method.values))
            pay_status = (
                Payment.Status.SUCCESS
                if order.status in (Order.Status.SHIPPED, Order.Status.DELIVERED, Order.Status.PROCESSING)
                else Payment.Status.PENDING
            )
            Payment.objects.create(
                order=order,
                method=method,
                status=pay_status,
                amount=order.total,
            )

        self.stdout.write(f"   {Order.objects.count()} orders.")

    # ──────────────────────────────────────────
    def _seed_carts(self, users: list[User]):
        self.stdout.write("🛒  Seeding carts …")
        for user in random.sample(users, min(5, len(users))):
            cart, _ = Cart.objects.get_or_create(user=user)
            for product in random.sample(self.all_products, min(3, len(self.all_products))):
                CartItem.objects.get_or_create(
                    cart=cart,
                    product=product,
                    variant=None,
                    defaults={"quantity": random.randint(1, 2)},
                )
        self.stdout.write(f"   {Cart.objects.count()} carts.")

    # ──────────────────────────────────────────
    def _seed_wishlists(self, users: list[User]):
        self.stdout.write("❤️   Seeding wishlists …")
        for user in users:
            for product in random.sample(self.all_products, min(random.randint(0, 5), len(self.all_products))):
                WishlistItem.objects.get_or_create(user=user, product=product)
        self.stdout.write(f"   {WishlistItem.objects.count()} wishlist items.")
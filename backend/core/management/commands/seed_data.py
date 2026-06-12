"""
core/management/commands/seed_data.py
Iko Nini TV — Seed the database with realistic demo data.

Images are pulled randomly from:
    D:/gadaf/Documents/Mkurugenzi – Merch_files

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

CATEGORIES = [
    ("Electronics", None, [
        "Smartphones", "Laptops & Computers", "Tablets", "Audio & Headphones",
        "Cameras", "Smart Watches", "TV & Home Theatre",
    ]),
    ("Fashion", None, [
        "Men's Clothing", "Women's Clothing", "Kids' Clothing",
        "Shoes & Sneakers", "Bags & Wallets", "Accessories",
    ]),
    ("Home & Living", None, [
        "Kitchen & Dining", "Bedding & Mattresses", "Furniture",
        "Lighting", "Cleaning Supplies",
    ]),
    ("Sports & Fitness", None, [
        "Gym Equipment", "Sportswear", "Outdoor & Camping",
    ]),
    ("Beauty & Health", None, [
        "Skincare", "Hair Care", "Supplements & Vitamins",
    ]),
    ("Baby & Kids", None, [
        "Toys & Games", "Baby Clothing", "Baby Feeding",
    ]),
]

BRANDS = [
    "Samsung", "Apple", "Infinix", "Tecno", "Itel",
    "Sony", "LG", "HP", "Dell", "Lenovo",
    "Nike", "Adidas", "Puma", "Under Armour",
    "Nivea", "L'Oréal", "Dove", "Neutrogena",
    "Panasonic", "Hisense", "Ramtons", "Bruhm",
]

PRODUCTS_BY_CATEGORY = {
    "Smartphones": [
        ("Samsung Galaxy A55 5G", 45000, 52000),
        ("Infinix Hot 40 Pro", 18500, 21000),
        ("Tecno Camon 20 Pro", 22000, 25000),
        ("iPhone 14 128GB", 120000, 135000),
        ("Itel A70", 8500, 10000),
    ],
    "Laptops & Computers": [
        ("HP 15s Intel Core i5", 65000, 72000),
        ("Lenovo IdeaPad Slim 3", 58000, 65000),
        ("Dell Inspiron 15 3000", 75000, 83000),
    ],
    "Audio & Headphones": [
        ("Sony WH-1000XM5 Wireless Headphones", 32000, 38000),
        ("Samsung Galaxy Buds2 Pro", 18000, 22000),
        ("JBL Flip 6 Speaker", 12000, 14500),
    ],
    "Shoes & Sneakers": [
        ("Nike Air Max 270", 12000, 14000),
        ("Adidas Ultraboost 23", 15000, 18000),
        ("Puma RS-X", 8500, 10000),
    ],
    "Kitchen & Dining": [
        ("Ramtons 2-Slice Toaster", 2500, 3200),
        ("Bruhm 20L Microwave", 8500, 10000),
        ("Stainless Steel Cookware Set 5pcs", 4500, 5500),
    ],
    "Skincare": [
        ("Nivea Extra White Body Lotion 400ml", 650, 850),
        ("Neutrogena Hydro Boost Gel", 1800, 2200),
        ("L'Oréal Revitalift SPF 30 Cream", 2200, 2600),
    ],
    "Gym Equipment": [
        ("Adjustable Dumbbell Set 20kg", 5500, 6500),
        ("Resistance Bands Set", 1200, 1500),
        ("Yoga Mat 6mm Non-Slip", 2000, 2400),
    ],
    "Toys & Games": [
        ("LEGO Classic Bricks 500pcs", 3500, 4200),
        ("Remote Control Car 2.4GHz", 2800, 3500),
        ("Kids Wooden Puzzle Set", 1200, 1500),
    ],
}

PRODUCT_DESCRIPTIONS = [
    "Experience premium quality with this top-rated product, trusted by thousands of Kenyan shoppers.",
    "Built for performance and durability. This item ships across all 47 counties via Iko Nini TV.",
    "Authentic product with full manufacturer warranty. Available for same-day dispatch in Nairobi.",
    "A customer favourite. Combines sleek design with superior functionality at an unbeatable price.",
    "Engineered to last. Get yours today and enjoy free delivery to selected pickup stations countrywide.",
]

REVIEW_BODIES = [
    "Very impressed with the quality. Delivery was fast, arrived within 2 days to Mombasa!",
    "Excellent product, exactly as described. Will definitely order again from Iko Nini TV.",
    "Good value for money. Packaging was secure and the item was in perfect condition.",
    "Works perfectly. Customer support was helpful when I had a question about my order.",
    "Amazing! Beat my expectations. Recommended for anyone looking for quality at a fair price.",
    "Solid build quality. Already recommended it to three friends and they all ordered too.",
    "Arrived faster than expected. Very happy with the overall experience.",
    "Top notch. Used for two weeks now and no issues whatsoever.",
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


def open_image_file(path: Path | None):
    """Return an open Django File object or None."""
    if path is None or not path.exists():
        return None
    return File(open(path, "rb"), name=path.name)


def rand_phone():
    prefix = random.choice(["0712", "0722", "0733", "0745", "0756", "0768", "0798"])
    return prefix + "".join(random.choices(string.digits, k=6))


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
            default=r"D:\gadaf\Documents\Mkurugenzi – Merch_files",
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

            for product_name, price, compare_price in items:
                brand = random.choice(self.brand_objects)

                product, created = Product.objects.get_or_create(
                    name=product_name,
                    defaults={
                        "brand": brand,
                        "category": category,
                        "description": random.choice(PRODUCT_DESCRIPTIONS),
                        "short_description": f"Top-quality {product_name} available now.",
                        "price": Decimal(price),
                        "compare_at_price": Decimal(compare_price),
                        "cost_price": Decimal(int(price * 0.65)),
                        "stock": random.randint(5, 120),
                        "is_active": True,
                        "is_featured": random.random() < 0.3,
                        "is_flash_sale": random.random() < 0.15,
                        "weight": Decimal(str(round(random.uniform(0.3, 5.0), 2))),
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

                    # 0–2 variants (e.g. colours / sizes) for relevant categories
                    if cat_name in ("Shoes & Sneakers", "Smartphones", "Laptops & Computers"):
                        colours = ["Black", "White", "Blue", "Silver"]
                        sizes   = ["S", "M", "L", "XL", "UK 8", "UK 9", "UK 10"]
                        for _ in range(random.randint(1, 2)):
                            attr = (
                                {"size": random.choice(sizes)}
                                if cat_name == "Shoes & Sneakers"
                                else {"color": random.choice(colours)}
                            )
                            variant_name = list(attr.values())[0]
                            ProductVariant.objects.get_or_create(
                                product=product,
                                name=variant_name,
                                defaults={
                                    "price": Decimal(price + random.randint(-500, 2000)),
                                    "stock": random.randint(2, 30),
                                    "attributes": attr,
                                },
                            )

                self.all_products.append(product)

        self.stdout.write(f"   {Product.objects.count()} products.")

    # ──────────────────────────────────────────
    def _seed_banners(self):
        self.stdout.write("🖼  Seeding banners …")
        banner_data = [
            ("Flash Sale — Up to 60% Off Electronics!", "Limited time. Shop now.", "/shop/electronics/"),
            ("New Arrivals in Fashion", "Fresh styles just landed.", "/shop/fashion/"),
            ("Free Delivery to Nairobi Pickup Stations", "On orders above KES 2,000.", "/shop/"),
        ]
        for idx, (title, subtitle, link) in enumerate(banner_data):
            img_path = pick_image(self.images)
            banner, created = Banner.objects.get_or_create(
                title=title,
                defaults={
                    "subtitle": subtitle,
                    "link": link,
                    "is_active": True,
                    "sort_order": idx,
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
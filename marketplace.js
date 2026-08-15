/* =====================================================
   MATCHCONNECT MARKETPLACE
===================================================== */


/* =====================================================
   SAMPLE PRODUCTS
   -----------------------------------------------------
   This gives the marketplace working content immediately.
   Later we can replace this with Firestore products.
===================================================== */

const products = [

    {
        id: 1,
        name: "iPhone 15 Pro",
        price: 520,
        currency: "$",
        category: "phones",
        seller: "Tech Store",
        location: "Tripoli",
        image: "https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=800&q=80",
        description:
            "iPhone 15 Pro in excellent condition. Available for purchase from a verified seller.",
        date: 10
    },

    {
        id: 2,
        name: "Wireless Headphones",
        price: 45,
        currency: "$",
        category: "electronics",
        seller: "Sound Hub",
        location: "Tripoli",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        description:
            "High quality wireless headphones with excellent sound and comfortable design.",
        date: 9
    },

    {
        id: 3,
        name: "Men's Casual Shirt",
        price: 25,
        currency: "$",
        category: "fashion",
        seller: "Fashion House",
        location: "Benghazi",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
        description:
            "Comfortable men's casual shirt suitable for everyday wear.",
        date: 8
    },

    {
        id: 4,
        name: "Modern Sofa",
        price: 350,
        currency: "$",
        category: "home",
        seller: "Home Design",
        location: "Tripoli",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        description:
            "Modern comfortable sofa for living rooms and apartments.",
        date: 7
    },

    {
        id: 5,
        name: "Toyota Corolla",
        price: 12500,
        currency: "$",
        category: "vehicles",
        seller: "Auto Market",
        location: "Misrata",
        image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
        description:
            "Well maintained Toyota Corolla available for sale.",
        date: 6
    },

    {
        id: 6,
        name: "Samsung Galaxy S24",
        price: 650,
        currency: "$",
        category: "phones",
        seller: "Mobile World",
        location: "Tripoli",
        image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
        description:
            "Samsung Galaxy S24 with excellent performance and premium display.",
        date: 5
    },

    {
        id: 7,
        name: "Skin Care Set",
        price: 35,
        currency: "$",
        category: "beauty",
        seller: "Beauty Store",
        location: "Tripoli",
        image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=80",
        description:
            "Complete skincare set for everyday personal care.",
        date: 4
    },

    {
        id: 8,
        name: "Laptop Computer",
        price: 750,
        currency: "$",
        category: "electronics",
        seller: "Computer Zone",
        location: "Benghazi",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        description:
            "Reliable laptop suitable for work, school and business.",
        date: 3
    }

];


/* =====================================================
   STATE
===================================================== */

let displayedProducts = [...products];

let selectedCategory = "all";

let currentProduct = null;

let currentSort = "default";


/* =====================================================
   DOM ELEMENTS
===================================================== */

const productsGrid =
    document.getElementById("productsGrid");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const clearSearch =
    document.getElementById("clearSearch");

const cartCount =
    document.getElementById("cartCount");

const productModal =
    document.getElementById("productModal");

const modalProductImage =
    document.getElementById("modalProductImage");

const modalProductCategory =
    document.getElementById("modalProductCategory");

const modalProductName =
    document.getElementById("modalProductName");

const modalProductPrice =
    document.getElementById("modalProductPrice");

const modalProductDescription =
    document.getElementById("modalProductDescription");

const modalSeller =
    document.getElementById("modalSeller");

const modalLocation =
    document.getElementById("modalLocation");

const modalAddCart =
    document.getElementById("modalAddCart");

const sortMenu =
    document.getElementById("sortMenu");

const toast =
    document.getElementById("toast");


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =====================================================
   FORMAT PRICE
===================================================== */

function formatPrice(product) {

    return (
        product.currency +
        Number(product.price)
            .toLocaleString()
    );

}


/* =====================================================
   CATEGORY NAME
===================================================== */

function categoryName(category) {

    const names = {

        electronics: "Electronics",

        fashion: "Fashion",

        home: "Home",

        vehicles: "Vehicles",

        phones: "Phones",

        beauty: "Beauty",

        other: "Other"

    };

    return names[category] || "Product";

}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts(list = displayedProducts) {

    productsGrid.innerHTML = "";

    if (!list.length) {

        emptyState.classList.remove("hidden");

        return;

    }

    emptyState.classList.add("hidden");


    list.forEach(product => {

        const card =
            document.createElement("article");

        card.className = "product-card";

        card.dataset.id = product.id;


        card.innerHTML = `

            <div class="product-image-wrapper">

                <img
                    class="product-image"
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy"
                >

                <button
                    class="favorite-btn"
                    aria-label="Favorite product"
                    data-favorite="${product.id}"
                >

                    <i class="far fa-heart"></i>

                </button>

            </div>


            <div class="product-info">

                <div class="product-name">
                    ${escapeHTML(product.name)}
                </div>

                <div class="product-price">
                    ${formatPrice(product)}
                </div>

                <div class="product-seller">

                    <i class="fas fa-user"></i>

                    <span>
                        ${escapeHTML(product.seller)}
                    </span>

                </div>

                <div class="product-location">

                    <i class="fas fa-location-dot"></i>

                    ${escapeHTML(product.location)}

                </div>

            </div>

        `;


        card.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        ".favorite-btn"
                    )
                ) {

                    return;

                }

                openProduct(product.id);

            }
        );


        const favoriteButton =
            card.querySelector(
                ".favorite-btn"
            );


        favoriteButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleFavorite(
                    product.id,
                    favoriteButton
                );

            }
        );


        productsGrid.appendChild(card);

    });

}


/* =====================================================
   OPEN PRODUCT
===================================================== */

function openProduct(productId) {

    const product =
        products.find(
            item => item.id === productId
        );

    if (!product) {
        return;
    }

    currentProduct = product;


    modalProductImage.src =
        product.image;

    modalProductImage.alt =
        product.name;

    modalProductCategory.textContent =
        categoryName(product.category);

    modalProductName.textContent =
        product.name;

    modalProductPrice.textContent =
        formatPrice(product);

    modalProductDescription.textContent =
        product.description;

    modalSeller.textContent =
        product.seller;

    modalLocation.textContent =
        product.location;


    modalAddCart.onclick =
        function () {

            addToCart(product);

        };


    productModal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE PRODUCT MODAL
===================================================== */

function closeProductModal() {

    productModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


/* =====================================================
   ADD TO CART
===================================================== */

function addToCart(product) {

    let cart =
        JSON.parse(
            localStorage.getItem(
                "matchconnectCart"
            )
        ) || [];


    const existing =
        cart.find(
            item => item.id === product.id
        );


    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({

            id: product.id,

            name: product.name,

            price: product.price,

            currency: product.currency,

            image: product.image,

            seller: product.seller,

            quantity: 1

        });

    }


    localStorage.setItem(
        "matchconnectCart",
        JSON.stringify(cart)
    );


    updateCartCount();


    showToast(
        "Product added to cart"
    );


    closeProductModal();

}


/* =====================================================
   CART COUNT
===================================================== */

function updateCartCount() {

    const cart =
        JSON.parse(
            localStorage.getItem(
                "matchconnectCart"
            )
        ) || [];


    const total =
        cart.reduce(
            (sum, item) =>
                sum + Number(item.quantity || 0),
            0
        );


    cartCount.textContent =
        total;

}


/* =====================================================
   OPEN CART
===================================================== */

function openCart() {

    window.location.href =
        "cart.html";

}


/* =====================================================
   FAVORITES
===================================================== */

function toggleFavorite(
    productId,
    button
) {

    let favorites =
        JSON.parse(
            localStorage.getItem(
                "matchconnectFavorites"
            )
        ) || [];


    const index =
        favorites.indexOf(productId);


    if (index === -1) {

        favorites.push(productId);

        button.classList.add("active");

        button.innerHTML =
            '<i class="fas fa-heart"></i>';

        showToast(
            "Added to favorites"
        );

    } else {

        favorites.splice(
            index,
            1
        );

        button.classList.remove(
            "active"
        );

        button.innerHTML =
            '<i class="far fa-heart"></i>';

        showToast(
            "Removed from favorites"
        );

    }


    localStorage.setItem(
        "matchconnectFavorites",
        JSON.stringify(favorites)
    );

}


/* =====================================================
   SEARCH
===================================================== */

searchInput.addEventListener(
    "input",
    filterProducts
);


function filterProducts() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    clearSearch.style.display =
        search ? "block" : "none";


    displayedProducts =
        products.filter(product => {

            const matchesSearch =
                !search ||
                product.name
                    .toLowerCase()
                    .includes(search) ||

                product.seller
                    .toLowerCase()
                    .includes(search) ||

                product.location
                    .toLowerCase()
                    .includes(search);


            const matchesCategory =
                selectedCategory === "all" ||
                product.category ===
                    selectedCategory;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    applySort(false);

    renderProducts();

}


/* =====================================================
   CLEAR SEARCH
===================================================== */

clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        filterProducts();

        searchInput.focus();

    }
);


/* =====================================================
   CATEGORY FILTER
===================================================== */

document
    .querySelectorAll(".category")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".category"
                    )
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                selectedCategory =
                    button.dataset.category;


                filterProducts();

            }
        );

    });


/* =====================================================
   SORT MENU
===================================================== */

function toggleSort() {

    sortMenu.classList.toggle(
        "hidden"
    );

}


function sortProducts(type) {

    currentSort = type;

    applySort();

    sortMenu.classList.add(
        "hidden"
    );

    renderProducts();

}


/* =====================================================
   APPLY SORT
===================================================== */

function applySort(
    render = true
) {

    if (currentSort === "low") {

        displayedProducts.sort(
            (a, b) =>
                a.price - b.price
        );

    }

    else if (currentSort === "high") {

        displayedProducts.sort(
            (a, b) =>
                b.price - a.price
        );

    }

    else if (currentSort === "new") {

        displayedProducts.sort(
            (a, b) =>
                b.date - a.date
        );

    }

    else {

        displayedProducts.sort(
            (a, b) =>
                a.id - b.id
        );

    }


    if (render) {

        renderProducts();

    }

}


/* =====================================================
   RESET MARKETPLACE
===================================================== */

function resetMarketplace() {

    searchInput.value = "";

    selectedCategory = "all";

    currentSort = "default";


    document
        .querySelectorAll(".category")
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });


    document
        .querySelector(
            '.category[data-category="all"]'
        )
        .classList.add(
            "active"
        );


    displayedProducts =
        [...products];


    renderProducts();

}


/* =====================================================
   QUICK ACTIONS
===================================================== */

function sellProduct() {

    window.location.href =
        "add-product.html";

}


function showMyProducts() {

    window.location.href =
        "my-products.html";

}


function openOrders() {

    window.location.href =
        "orders.html";

}


function openCategories() {

    window.location.href =
        "categories.html";

}


/* =====================================================
   TOAST
===================================================== */

let toastTimer;


function showToast(message) {

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =====================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
===================================================== */

productModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            productModal
        ) {

            closeProductModal();

        }

    }
);


/* =====================================================
   ESCAPE KEY
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeProductModal();

            sortMenu.classList.add(
                "hidden"
            );

        }

    }
);


/* =====================================================
   ADVERTISEMENT
   -----------------------------------------------------
   Placeholder until your Firebase ad system is connected.
===================================================== */

function loadAdvertisement() {

    const adImage =
        document.getElementById(
            "adImage"
        );

    const adLink =
        document.getElementById(
            "adLink"
        );


    /*
       When you have an advertisement,
       replace these values with the
       Firebase advertisement data.
    */

    const advertisement = {

        image: "",

        link: "#"

    };


    if (
        advertisement.image
    ) {

        adImage.src =
            advertisement.image;

        adLink.href =
            advertisement.link;

        adImage.style.display =
            "block";

    }

}


/* =====================================================
   LOAD FAVORITES
===================================================== */

function loadFavorites() {

    const favorites =
        JSON.parse(
            localStorage.getItem(
                "matchconnectFavorites"
            )
        ) || [];
  

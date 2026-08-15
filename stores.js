/* =====================================================
   MATCHCONNECT STORES
===================================================== */


/* SAMPLE STORE DATA
   Firebase will be connected later.
===================================================== */

const stores = [

    {
        id: 1,
        name: "TechWorld Store",
        category: "electronics",
        categoryName: "Electronics",
        location: "Tripoli",
        rating: 4.9,
        reviews: 185,
        products: 246,
        verified: true,
        featured: true,
        owner: "TechWorld Libya",
        phone: "+218 91 000 0000",
        description:
            "Official electronics store offering smartphones, computers, accessories and other technology products.",
        cover: "",
        logo: "",
        icon: "fa-mobile-screen",
        created: 1
    },

    {
        id: 2,
        name: "Fashion House",
        category: "fashion",
        categoryName: "Fashion",
        location: "Benghazi",
        rating: 4.8,
        reviews: 132,
        products: 410,
        verified: true,
        featured: true,
        owner: "Fashion House",
        phone: "+218 92 000 0000",
        description:
            "Fashion store offering clothing, shoes, bags and accessories for men and women.",
        cover: "",
        logo: "",
        icon: "fa-shirt",
        created: 2
    },

    {
        id: 3,
        name: "Beauty World",
        category: "beauty",
        categoryName: "Beauty",
        location: "Tripoli",
        rating: 4.6,
        reviews: 97,
        products: 188,
        verified: true,
        featured: false,
        owner: "Beauty World",
        phone: "+218 93 000 0000",
        description:
            "Beauty store offering cosmetics, skincare products, fragrances and personal-care items.",
        cover: "",
        logo: "",
        icon: "fa-spa",
        created: 3
    },

    {
        id: 4,
        name: "Fresh Market",
        category: "food",
        categoryName: "Food",
        location: "Misrata",
        rating: 4.7,
        reviews: 76,
        products: 325,
        verified: false,
        featured: true,
        owner: "Fresh Market",
        phone: "+218 94 000 0000",
        description:
            "Online food store providing groceries, fresh food and household essentials.",
        cover: "",
        logo: "",
        icon: "fa-basket-shopping",
        created: 4
    },

    {
        id: 5,
        name: "HomeStyle",
        category: "home",
        categoryName: "Home & Furniture",
        location: "Tripoli",
        rating: 4.5,
        reviews: 54,
        products: 156,
        verified: false,
        featured: false,
        owner: "HomeStyle Libya",
        phone: "+218 95 000 0000",
        description:
            "Home and furniture store offering household products, furniture and decorations.",
        cover: "",
        logo: "",
        icon: "fa-house",
        created: 5
    },

    {
        id: 6,
        name: "Daily Shopping Store",
        category: "general",
        categoryName: "General Store",
        location: "Benghazi",
        rating: 4.4,
        reviews: 41,
        products: 290,
        verified: false,
        featured: false,
        owner: "Daily Shopping",
        phone: "+218 96 000 0000",
        description:
            "General online store offering a wide range of everyday products.",
        cover: "",
        logo: "",
        icon: "fa-store",
        created: 6
    }

];


/* =====================================================
   STATE
===================================================== */

let displayedStores =
    [...stores];

let selectedCategory =
    "all";

let selectedFilter =
    "all";

let currentSort =
    "rating";


/* =====================================================
   DOM
===================================================== */

const storeList =
    document.getElementById(
        "storeList"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const clearSearch =
    document.getElementById(
        "clearSearch"
    );

const storeModal =
    document.getElementById(
        "storeModal"
    );

const storeDetails =
    document.getElementById(
        "storeDetails"
    );

const sortMenu =
    document.getElementById(
        "sortMenu"
    );

const toast =
    document.getElementById(
        "toast"
    );


/* =====================================================
   ESCAPE
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
   STARS
===================================================== */

function getStars(rating) {

    const full =
        Math.floor(rating);

    let html = "";

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        html +=
            i < full
            ? '<i class="fas fa-star"></i>'
            : '<i class="far fa-star"></i>';

    }

    return html;

}


/* =====================================================
   RENDER
===================================================== */

function renderStores() {

    storeList.innerHTML = "";


    if (!displayedStores.length) {

        storeList.classList.add(
            "hidden"
        );

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    storeList.classList.remove(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );


    displayedStores.forEach(
        store => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "store-card";


            const coverHTML =
                store.cover

                ? `
                    <img
                        src="${escapeHTML(
                            store.cover
                        )}"
                        alt="${escapeHTML(
                            store.name
                        )}"
                    >
                `

                : `
                    <i class="fas ${escapeHTML(
                        store.icon
                    )}"></i>
                `;


            const logoHTML =
                store.logo

                ? `
                    <img
                        src="${escapeHTML(
                            store.logo
                        )}"
                        alt="Store logo"
                    >
                `

                : `
                    <i class="fas ${escapeHTML(
                        store.icon
                    )}"></i>
                `;


            card.innerHTML = `

                <div class="store-cover">

                    ${coverHTML}


                    ${
                        store.featured

                        ? `
                            <span class="featured-badge">

                                <i class="fas fa-star"></i>

                                Featured

                            </span>
                        `

                        : ""
                    }


                    <div class="store-logo">

                        ${logoHTML}

                    </div>

                </div>


                <div class="store-info">

                    <div class="store-name-row">

                        <div class="store-name">

                            ${escapeHTML(
                                store.name
                            )}

                        </div>


                        ${
                            store.verified

                            ? `
                                <i
                                    class="fas fa-circle-check verified"
                                    title="Verified Store"
                                ></i>
                            `

                            : ""
                        }

                    </div>


                    <div class="store-category">

                        ${escapeHTML(
                            store.categoryName
                        )}

                    </div>


                    <div class="store-location">

                        <i class="fas fa-location-dot"></i>

                        ${escapeHTML(
                            store.location
                        )}

                    </div>


                    <div class="store-rating">

                        <span class="stars">

                            ${getStars(
                                store.rating
                            )}

                        </span>

                        <strong>
                            ${store.rating}
                        </strong>

                        <span>
                            (${store.reviews})
                        </span>

                    </div>


                    <div class="store-footer">

                        <span class="store-products">

                            <i class="fas fa-box"></i>

                            ${store.products}
                            products

                        </span>


                        <span class="visit-store">

                            Visit Store

                            <i class="fas fa-chevron-right"></i>

                        </span>

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () =>
                    openStore(
                        store.id
                    )
            );


            storeList.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   OPEN STORE
===================================================== */

function openStore(storeId) {

    const store =
        stores.find(
            item =>
                item.id ===
                storeId
        );


    if (!store) {
        return;
    }


    const coverHTML =
        store.cover

        ? `
            <img
                src="${escapeHTML(
                    store.cover
                )}"
                alt="${escapeHTML(
                    store.name
                )}"
            >
        `

        : `
            <i class="fas ${escapeHTML(
                store.icon
            )}"></i>
        `;


    const logoHTML =
        store.logo

        ? `
            <img
                src="${escapeHTML(
                    store.logo
                )}"
                alt="Store logo"
            >
        `

        : `
            <i class="fas ${escapeHTML(
                store.icon
            )}"></i>
        `;


    storeDetails.innerHTML = `

        <div class="details-cover">

            ${coverHTML}

        </div>


        <div class="details-logo">

            ${logoHTML}

        </div>


        <h2 class="details-name">

            ${escapeHTML(
                store.name
            )}

            ${
                store.verified

                ? `
                    <i
                        class="fas fa-circle-check verified"
                    ></i>
                `

                : ""
            }

        </h2>


        <div class="details-category">

            ${escapeHTML(
                store.categoryName
            )}

            ·

            ${store.rating} ★

        </div>


        <div class="details-row">

            <i class="fas fa-location-dot"></i>

            <span>
                ${escapeHTML(
                    store.location
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-box"></i>

            <span>
                ${store.products} products
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-star"></i>

            <span>
                ${store.rating}
                (${store.reviews} reviews)
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-phone"></i>

            <span>
                ${escapeHTML(
                    store.phone
                )}
            </span>

        </div>


        <div class="details-description">

            ${escapeHTML(
                store.description
            )}

        </div>


        <div class="action-buttons">

            <button
                class="action-button visit-button"
                onclick="visitStore(${store.id})"
            >

                <i class="fas fa-store"></i>

                Visit Store

            </button>


            <button
                class="action-button save-button"
                onclick="saveStore(${store.id})"
            >

                <i class="fas fa-bookmark"></i>

                Save

            </button>

        </div>

    `;


    storeModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE STORE
===================================================== */

function closeStore() {

    storeModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


/* =====================================================
   SEARCH
===================================================== */

searchInput.addEventListener(
    "input",
    applyFilters
);


function applyFilters() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    clearSearch.style.display =
        search
        ? "block"
        : "none";


    displayedStores =
        stores.filter(
            store => {

                const matchesSearch =
                    !search ||

                    store.name
                        .toLowerCase()
                        .includes(search) ||

                    store.categoryName
                        .toLowerCase()
                        .includes(search) ||

                    store.location
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    selectedCategory ===
                    "all" ||

                    store.category ===
                    selectedCategory;


                let matchesFilter =
                    true;


                if (
                    selectedFilter ===
                    "verified"
                ) {

                    matchesFilter =
                        store.verified;

                }

                else if (
                    selectedFilter ===
                    "featured"
                ) {

                    matchesFilter =
                        store.featured;

                }


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesFilter
                );

            }
        );


    sortCurrent();

    renderStores();

}


/* =====================================================
   CLEAR SEARCH
===================================================== */

clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        applyFilters();

        searchInput.focus();

    }
);


/* =====================================================
   CATEGORY
===================================================== */

document
    .querySelectorAll(
        ".category"
    )
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


                applyFilters();

            }
        );

    });


/* =====================================================
   FILTERS
===================================================== */

document
    .querySelectorAll(
        ".filter-btn"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".filter-btn"
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


                selectedFilter =
                    button.dataset.filter;


                applyFilters();

            }
        );

    });


/* =====================================================
   SORT
===================================================== */

function toggleSort() {

    sortMenu.classList.toggle(
        "hidden"
    );

}


function sortStores(type) {

    currentSort =
        type;

    sortCurrent();

    renderStores();

    sortMenu.classList.add(
        "hidden"
    );

}


function sortCurrent() {

    if (
        currentSort ===
        "rating"
    ) {

        displayedStores.sort(
            (a, b) =>
                b.rating -
                a.rating
        );

    }

    else if (
        currentSort ===
        "name"
    ) {

        displayedStores.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        );

    }

    else {

        displayedStores.sort(
            (a, b) =>
                a.created -
                b.created
        );

    }

}


/* =====================================================
   SAVE STORE
===================================================== */

function saveStore(storeId) {

    let saved =
        JSON.parse(
            localStorage.getItem(
                "matchconnectSavedStores"
            )
        ) || [];


    if (
        !saved.includes(
            storeId
        )
    ) {

        saved.push(
            storeId
        );


        localStorage.setItem(
            "matchconnectSavedStores",
            JSON.stringify(saved)
        );


        showToast(
            "Store saved"
        );

    }

    else {

        showToast(
            "Store already saved"
        );

    }

}


/* =====================================================
   VISIT STORE
===================================================== */

function visitStore(storeId) {

    /*
       Later this will open the
       real store page.

       Example:
       store.html?id=123
    */

    showToast(
        "Store page will be connected later"
    );

}


/* =====================================================
   QUICK ACTIONS
===================================================== */

function openStoreRegistration() {

    window.location.href =
        "create-store.html";

}


function openMyStore() {

    window.location.href =
        "my-store.html";

}


function openSavedStores() {

    window.location.href =
        "saved-stores.html";

}


function openStoreOrders() {

    window.location.href =
        "orders.html";

}


/* ==================================

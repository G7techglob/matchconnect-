/* =====================================================
   MATCHCONNECT BUSINESS DIRECTORY
===================================================== */


/* SAMPLE DATA
   Later this will come from Firebase.
===================================================== */

const businesses = [

    {
        id: 1,
        name: "Al Noor Restaurant",
        category: "restaurant",
        categoryName: "Restaurant",
        location: "Tripoli",
        rating: 4.8,
        reviews: 124,
        verified: true,
        open: true,
        owner: "Al Noor Group",
        phone: "+218 91 000 0000",
        description:
            "A modern restaurant offering local and international meals, family dining and takeaway services.",
        icon: "fa-utensils",
        image: "",
        created: 1
    },

    {
        id: 2,
        name: "Libya Tech Solutions",
        category: "technology",
        categoryName: "Technology",
        location: "Tripoli",
        rating: 4.7,
        reviews: 86,
        verified: true,
        open: true,
        owner: "Libya Tech",
        phone: "+218 92 000 0000",
        description:
            "Technology company providing software development, IT support and digital business solutions.",
        icon: "fa-laptop-code",
        image: "",
        created: 2
    },

    {
        id: 3,
        name: "City Fashion Store",
        category: "shop",
        categoryName: "Shop",
        location: "Benghazi",
        rating: 4.5,
        reviews: 64,
        verified: false,
        open: true,
        owner: "City Fashion",
        phone: "+218 93 000 0000",
        description:
            "Fashion store offering clothing, shoes, accessories and everyday fashion products.",
        icon: "fa-shirt",
        image: "",
        created: 3
    },

    {
        id: 4,
        name: "HealthCare Medical Center",
        category: "health",
        categoryName: "Health",
        location: "Tripoli",
        rating: 4.9,
        reviews: 201,
        verified: true,
        open: false,
        owner: "HealthCare Group",
        phone: "+218 94 000 0000",
        description:
            "Professional healthcare center offering medical consultations and healthcare services.",
        icon: "fa-heart-pulse",
        image: "",
        created: 4
    },

    {
        id: 5,
        name: "BuildPro Construction",
        category: "construction",
        categoryName: "Construction",
        location: "Misrata",
        rating: 4.4,
        reviews: 42,
        verified: true,
        open: true,
        owner: "BuildPro",
        phone: "+218 95 000 0000",
        description:
            "Construction company providing building, renovation and property development services.",
        icon: "fa-hammer",
        image: "",
        created: 5
    },

    {
        id: 6,
        name: "FastWay Transport",
        category: "transport",
        categoryName: "Transport",
        location: "Tripoli",
        rating: 4.6,
        reviews: 73,
        verified: false,
        open: true,
        owner: "FastWay",
        phone: "+218 96 000 0000",
        description:
            "Transportation and delivery company serving businesses and individuals.",
        icon: "fa-truck",
        image: "",
        created: 6
    }

];


/* =====================================================
   STATE
===================================================== */

let displayedBusinesses =
    [...businesses];

let selectedCategory =
    "all";

let selectedFilter =
    "all";

let currentSort =
    "rating";


/* =====================================================
   DOM
===================================================== */

const businessList =
    document.getElementById(
        "businessList"
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

const businessModal =
    document.getElementById(
        "businessModal"
    );

const businessDetails =
    document.getElementById(
        "businessDetails"
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
   ICON
===================================================== */

function getIcon(business) {

    return business.icon ||
        "fa-building";

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

function renderBusinesses() {

    businessList.innerHTML = "";


    if (
        !displayedBusinesses.length
    ) {

        businessList.classList.add(
            "hidden"
        );

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    businessList.classList.remove(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );


    displayedBusinesses.forEach(
        business => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "business-card";


            const logo =
                business.image

                ? `
                    <img
                        src="${escapeHTML(
                            business.image
                        )}"
                        alt="${escapeHTML(
                            business.name
                        )}"
                    >
                `

                : `
                    <i class="fas ${getIcon(
                        business
                    )}"></i>
                `;


            card.innerHTML = `

                <div class="business-logo">

                    ${logo}

                </div>


                <div class="business-info">

                    <div class="business-name-row">

                        <div class="business-name">

                            ${escapeHTML(
                                business.name
                            )}

                        </div>


                        ${
                            business.verified

                            ? `
                                <i
                                    class="fas fa-circle-check verified"
                                    title="Verified"
                                ></i>
                            `

                            : ""
                        }


                        ${
                            business.open

                            ? `
                                <span class="open-status">
                                    Open
                                </span>
                            `

                            : `
                                <span class="closed-status">
                                    Closed
                                </span>
                            `
                        }

                    </div>


                    <div class="business-category">

                        ${escapeHTML(
                            business.categoryName
                        )}

                    </div>


                    <div class="business-location">

                        <i class="fas fa-location-dot"></i>

                        ${escapeHTML(
                            business.location
                        )}

                    </div>


                    <div class="business-rating">

                        <span class="stars">

                            ${getStars(
                                business.rating
                            )}

                        </span>

                        <strong>
                            ${business.rating}
                        </strong>

                        <span>
                            (${business.reviews})
                        </span>

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () =>
                    openBusiness(
                        business.id
                    )
            );


            businessList.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   OPEN BUSINESS
===================================================== */

function openBusiness(
    businessId
) {

    const business =
        businesses.find(
            item =>
                item.id ===
                businessId
        );


    if (!business) {
        return;
    }


    const logo =
        business.image

        ? `
            <img
                src="${escapeHTML(
                    business.image
                )}"
                alt="${escapeHTML(
                    business.name
                )}"
            >
        `

        : `
            <i class="fas ${getIcon(
                business
            )}"></i>
        `;


    businessDetails.innerHTML = `

        <div class="details-logo">

            ${logo}

        </div>


        <h2 class="details-name">

            ${escapeHTML(
                business.name
            )}

            ${
                business.verified
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
                business.categoryName
            )}

            ·

            ${business.rating}
            ★

        </div>


        <div class="details-row">

            <i class="fas fa-location-dot"></i>

            <span>
                ${escapeHTML(
                    business.location
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-clock"></i>

            <span>

                ${
                    business.open
                    ? "Open Now"
                    : "Closed Now"
                }

            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-star"></i>

            <span>

                ${business.rating}

                (${business.reviews} reviews)

            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-user"></i>

            <span>
                ${escapeHTML(
                    business.owner
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-phone"></i>

            <span>
                ${escapeHTML(
                    business.phone
                )}
            </span>

        </div>


        <div class="details-description">

            ${escapeHTML(
                business.description
            )}

        </div>


        <div class="action-buttons">

            <button
                class="action-button contact-button"
                onclick="contactBusiness(${business.id})"
            >

                <i class="fas fa-comment"></i>

                Contact

            </button>


            <button
                class="action-button save-button"
                onclick="saveBusiness(${business.id})"
            >

                <i class="fas fa-bookmark"></i>

                Save

            </button>

        </div>

    `;


    businessModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE
===================================================== */

function closeBusiness() {

    businessModal.classList.add(
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


    displayedBusinesses =
        businesses.filter(
            business => {

                const matchesSearch =
                    !search ||

                    business.name
                        .toLowerCase()
                        .includes(search) ||

                    business.categoryName
                        .toLowerCase()
                        .includes(search) ||

                    business.location
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    selectedCategory ===
                    "all" ||

                    business.category ===
                    selectedCategory;


                let matchesFilter =
                    true;


                if (
                    selectedFilter ===
                    "verified"
                ) {

                    matchesFilter =
                        business.verified;

                }

                else if (
                    selectedFilter ===
                    "open"
                ) {

                    matchesFilter =
                        business.open;

                }


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesFilter
                );

            }
        );


    sortCurrent();

    renderBusinesses();

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
   FILTER
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


function sortBusinesses(
    type
) {

    currentSort =
        type;

    sortCurrent();

    renderBusinesses();

    sortMenu.classList.add(
        "hidden"
    );

}


function sortCurrent() {

    if (
        currentSort ===
        "rating"
    ) {

        displayedBusinesses.sort(
            (a, b) =>
                b.rating -
                a.rating
        );

    }

    else if (
        currentSort ===
        "name"
    ) {

        displayedBusinesses.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        );

    }

    else {

        displayedBusinesses.sort(
            (a, b) =>
                a.created -
                b.created
        );

    }

}


/* =====================================================
   SAVE
===================================================== */

function saveBusiness(
    businessId
) {

    let saved =
        JSON.parse(
            localStorage.getItem(
                "matchconnectSavedBusinesses"
            )
        ) || [];


    if (
        !saved.includes(
            businessId
        )
    ) {

        saved.push(
            businessId
        );


        localStorage.setItem(
            "matchconnectSavedBusinesses",
            JSON.stringify(saved)
        );


        showToast(
            "Business saved"
        );

    }

    else {

        showToast(
            "Business already saved"
        );

    }

}


/* =====================================================
   CONTACT
===================================================== */

function contactBusiness(
    businessId
) {

    showToast(
        "Contact feature will be connected later"
    );

}


/* =====================================================
   QUICK ACTIONS
===================================================== */

function registerBusiness() {

    window.location.href =
        "register-business.html";

}


function myBusinesses() {

    window.location.href =
        "my-businesses.html";

}


function savedBusinesses() {

    window.location.href =
        "saved-businesses.html";

}


function businessRequests() {

    window.location.href =
        "business-requests.html";

}


/* =====================================================
   RESET
===================================================== */

function resetBusinesses() {

    searchInput.value = "";

    selectedCategory =
        "all";

    selectedFilter =
        "all";

    currentSort =
        "rating";


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


    document
        .querySelector(
            '.category[data-category="all"]'
        )
        .classList.add(
            "active"
        );


    document
        .querySelectorAll(
            ".filter-btn"
        )
        .forEach(
            item =>
                item.classList.remove(
                    "active"
          

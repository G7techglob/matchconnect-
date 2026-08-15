/* =====================================================
   MATCHCONNECT REAL ESTATE
===================================================== */


/* =====================================================
   SAMPLE PROPERTIES
===================================================== */

const properties = [

    {
        id: 1,
        title: "Modern Family House",
        type: "house",
        purpose: "sale",
        location: "Tripoli",
        price: 185000,
        currency: "$",
        bedrooms: 4,
        bathrooms: 3,
        area: "280 m²",
        owner: "Ahmed Properties",
        posted: 1,
        image: "",
        description:
            "Beautiful modern family house in a convenient location. The property includes four bedrooms, three bathrooms, a spacious living room and a private outdoor area."
    },

    {
        id: 2,
        title: "Luxury Apartment",
        type: "apartment",
        purpose: "rent",
        location: "Tripoli",
        price: 900,
        currency: "$",
        bedrooms: 3,
        bathrooms: 2,
        area: "150 m²",
        owner: "City Homes",
        posted: 2,
        image: "",
        description:
            "Comfortable apartment suitable for families or professionals. Located close to shops, transportation and other important facilities."
    },

    {
        id: 3,
        title: "Residential Land",
        type: "land",
        purpose: "sale",
        location: "Misrata",
        price: 75000,
        currency: "$",
        bedrooms: 0,
        bathrooms: 0,
        area: "600 m²",
        owner: "Libya Land Estate",
        posted: 3,
        image: "",
        description:
            "Residential land suitable for building a family home, apartments or other approved developments."
    },

    {
        id: 4,
        title: "Business Office",
        type: "office",
        purpose: "rent",
        location: "Benghazi",
        price: 1200,
        currency: "$",
        bedrooms: 0,
        bathrooms: 1,
        area: "110 m²",
        owner: "Business Space",
        posted: 4,
        image: "",
        description:
            "Professional office space suitable for companies, agencies, startups and other businesses."
    },

    {
        id: 5,
        title: "Commercial Shop",
        type: "shop",
        purpose: "sale",
        location: "Tripoli",
        price: 95000,
        currency: "$",
        bedrooms: 0,
        bathrooms: 1,
        area: "85 m²",
        owner: "Commercial Properties",
        posted: 5,
        image: "",
        description:
            "Commercial shop in a busy area with good visibility and access. Suitable for retail or other approved businesses."
    },

    {
        id: 6,
        title: "Three Bedroom Apartment",
        type: "apartment",
        purpose: "sale",
        location: "Benghazi",
        price: 115000,
        currency: "$",
        bedrooms: 3,
        bathrooms: 2,
        area: "140 m²",
        owner: "Home Connect",
        posted: 6,
        image: "",
        description:
            "Spacious three-bedroom apartment with modern facilities and convenient access to local services."
    }

];


/* =====================================================
   STATE
===================================================== */

let displayedProperties =
    [...properties];

let selectedType =
    "all";

let selectedPurpose =
    "all";

let currentSort =
    "new";


/* =====================================================
   DOM
===================================================== */

const propertyList =
    document.getElementById(
        "propertyList"
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

const propertyModal =
    document.getElementById(
        "propertyModal"
    );

const propertyDetails =
    document.getElementById(
        "propertyDetails"
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
   FORMAT PRICE
===================================================== */

function formatPrice(property) {

    return (
        property.currency +
        Number(property.price)
            .toLocaleString()
    );

}


/* =====================================================
   PROPERTY ICON
===================================================== */

function getPropertyIcon(type) {

    const icons = {

        house:
            "fa-house",

        apartment:
            "fa-building",

        land:
            "fa-mountain",

        office:
            "fa-briefcase",

        shop:
            "fa-shop"

    };

    return (
        icons[type] ||
        "fa-house"
    );

}


/* =====================================================
   RENDER
===================================================== */

function renderProperties() {

    propertyList.innerHTML = "";


    if (!displayedProperties.length) {

        propertyList.classList.add(
            "hidden"
        );

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    propertyList.classList.remove(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );


    displayedProperties.forEach(
        property => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "property-card";


            const imageHTML =
                property.image

                ? `
                    <img
                        src="${escapeHTML(
                            property.image
                        )}"
                        alt="${escapeHTML(
                            property.title
                        )}"
                    >
                `

                : `
                    <i class="fas ${getPropertyIcon(
                        property.type
                    )}"></i>
                `;


            card.innerHTML = `

                <div class="property-image">

                    ${imageHTML}

                </div>


                <div class="property-info">

                    <span class="property-purpose">

                        ${
                            property.purpose ===
                            "sale"
                            ? "FOR SALE"
                            : "FOR RENT"
                        }

                    </span>


                    <div class="property-title">

                        ${escapeHTML(
                            property.title
                        )}

                    </div>


                    <div class="property-location">

                        <i class="fas fa-location-dot"></i>

                        ${escapeHTML(
                            property.location
                        )}

                    </div>


                    <div class="property-meta">

                        ${
                            property.bedrooms
                            ? `
                                <span class="meta">
                                    <i class="fas fa-bed"></i>
                                    ${property.bedrooms} Beds
                                </span>
                            `
                            : ""
                        }


                        ${
                            property.bathrooms
                            ? `
                                <span class="meta">
                                    <i class="fas fa-bath"></i>
                                    ${property.bathrooms} Baths
                                </span>
                            `
                            : ""
                        }


                        <span class="meta">

                            <i class="fas fa-ruler-combined"></i>

                            ${escapeHTML(
                                property.area
                            )}

                        </span>

                    </div>


                    <div class="property-price">

                        ${formatPrice(property)}

                    </div>


                    <div class="property-footer">

                        <span class="property-owner">

                            ${escapeHTML(
                                property.owner
                            )}

                        </span>


                        <span class="view-property">

                            View Property

                            <i class="fas fa-chevron-right"></i>

                        </span>

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () =>
                    openProperty(
                        property.id
                    )
            );


            propertyList.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   OPEN PROPERTY
===================================================== */

function openProperty(propertyId) {

    const property =
        properties.find(
            item =>
                item.id ===
                propertyId
        );


    if (!property) {
        return;
    }


    const imageHTML =
        property.image

        ? `
            <img
                src="${escapeHTML(
                    property.image
                )}"
                alt="${escapeHTML(
                    property.title
                )}"
            >
        `

        : `
            <i class="fas ${getPropertyIcon(
                property.type
            )}"></i>
        `;


    propertyDetails.innerHTML = `

        <div class="details-image">

            ${imageHTML}

        </div>


        <h2 class="details-title">

            ${escapeHTML(
                property.title
            )}

        </h2>


        <div class="details-price">

            ${formatPrice(property)}

        </div>


        <div class="details-row">

            <i class="fas fa-location-dot"></i>

            <span>
                ${escapeHTML(
                    property.location
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-house"></i>

            <span>

                ${
                    property.purpose ===
                    "sale"
                    ? "For Sale"
                    : "For Rent"
                }

            </span>

        </div>


        ${
            property.bedrooms
            ? `
                <div class="details-row">

                    <i class="fas fa-bed"></i>

                    <span>
                        ${property.bedrooms}
                        Bedrooms
                    </span>

                </div>
            `
            : ""
        }


        ${
            property.bathrooms
            ? `
                <div class="details-row">

                    <i class="fas fa-bath"></i>

                    <span>
                        ${property.bathrooms}
                        Bathrooms
                    </span>

                </div>
            `
            : ""
        }


        <div class="details-row">

            <i class="fas fa-ruler-combined"></i>

            <span>
                ${escapeHTML(
                    property.area
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-user"></i>

            <span>
                ${escapeHTML(
                    property.owner
                )}
            </span>

        </div>


        <div class="details-description">

            ${escapeHTML(
                property.description
            )}

        </div>


        <div class="action-buttons">

            <button
                class="action-button contact-button"
                onclick="contactOwner(${property.id})"
            >

                <i class="fas fa-comment"></i>

                Contact

            </button>


            <button
                class="action-button save-button"
                onclick="saveProperty(${property.id})"
            >

                <i class="fas fa-bookmark"></i>

                Save

            </button>

        </div>

    `;


    propertyModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE
===================================================== */

function closeProperty() {

    propertyModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


/* =====================================================
   SEARCH + FILTER
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


    displayedProperties =
        properties.filter(
            property => {

                const matchesSearch =
                    !search ||

                    property.title
                        .toLowerCase()
                        .includes(search) ||

                    property.location
                        .toLowerCase()
                        .includes(search) ||

                    property.owner
                        .toLowerCase()
                        .includes(search);


                const matchesType =
                    selectedType ===
                    "all" ||

                    property.type ===
                    selectedType;


                const matchesPurpose =
                    selectedPurpose ===
                    "all" ||

                    property.purpose ===
                    selectedPurpose;


                return (
                    matchesSearch &&
                    matchesType &&
                    matchesPurpose
                );

            }
        );


    sortCurrent();

    renderProperties();

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
   PROPERTY TYPE
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


                selectedType =
                    button.dataset.type;


                applyFilters();

            }
        );

    });


/* =====================================================
   PURPOSE
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


                selectedPurpose =
                    button.dataset.purpose;


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


function sortProperties(type) {

    currentSort =
        type;

    sortCurrent();

    renderProperties();

    sortMenu.classList.add(
        "hidden"
    );

}


function sortCurrent() {

    if (
        currentSort ===
        "low"
    ) {

        displayedProperties.sort(
            (a, b) =>
                a.price -
                b.price
        );

    }

    else if (
        currentSort ===
        "high"
    ) {

        displayedProperties.sort(
            (a, b) =>
                b.price -
                a.price
        );

    }

    else {

        displayedProperties.sort(
            (a, b) =>
                a.posted -
                b.posted
        );

    }

}


/* =====================================================
   SAVE PROPERTY
===================================================== */

function saveProperty(propertyId) {

    let saved =
        JSON.parse(
            localStorage.getItem(
                "matchconnectSavedProperties"
            )
        ) || [];


    if (
        !saved.includes(
            propertyId
        )
    ) {

        saved.push(
            propertyId
        );

        localStorage.setItem(
            "matchconnectSavedProperties",
            JSON.stringify(saved)
        );

        showToast(
            "Property saved"
        );

    }

    else {

        showToast(
            "Property already saved"
        );

    }

}


/* =====================================================
   CONTACT
===================================================== */

function contactOwner(propertyId) {

    const property =
        properties.find(
            item =>
                item.id ===
                propertyId
        );


    if (!property) {
        return;
    }


    showToast(
        "Contact feature will be connected later"
    );

}


/* =====================================================
   QUICK ACTIONS
===================================================== */

function listProperty() {

    window.location.href =
        "list-property.html";

}


function myProperties() {

    window.location.href =
        "my-properties.html";

}


function savedProperties() {

    window.location.href =
        "saved-properties.html";

}


function myRequests() {

    window.location.href =
        "property-requests.html";

}


/* =====================================================
   RESET
===================================================== */

function resetProperties() {

    searchInput.value = "";

    selectedType =
        "all";

    selectedPurpose =
        "all";

    currentSort =
        "new";


    document
        .querySelectorAll(
            ".category"
        )
        .forEach(
            button =>
                button.classList.remove(
                    "active"
           

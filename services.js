/* =====================================================
   MATCHCONNECT SERVICES
===================================================== */


/* =====================================================
   SAMPLE SERVICES
===================================================== */

const services = [

    {
        id: 1,
        name: "Home Cleaning",
        provider: "CleanPro Services",
        location: "Tripoli",
        category: "cleaning",
        price: 40,
        currency: "$",
        unit: "per visit",
        remote: false,
        rating: 4.9,
        reviews: 32,
        posted: 1,
        description:
            "Professional home and apartment cleaning service. We provide reliable cleaning for homes, offices and apartments."
    },

    {
        id: 2,
        name: "Website Development",
        provider: "Tech Creators",
        location: "Remote",
        category: "technology",
        price: 250,
        currency: "$",
        unit: "starting from",
        remote: true,
        rating: 4.8,
        reviews: 21,
        posted: 2,
        description:
            "Professional website development for businesses, organizations and personal brands."
    },

    {
        id: 3,
        name: "AC Repair & Maintenance",
        provider: "CoolFix",
        location: "Tripoli",
        category: "repair",
        price: 30,
        currency: "$",
        unit: "service",
        remote: false,
        rating: 4.7,
        reviews: 18,
        posted: 3,
        description:
            "Air conditioner repair, maintenance, installation and troubleshooting."
    },

    {
        id: 4,
        name: "Graphic Design",
        provider: "Creative Hub",
        location: "Remote",
        category: "technology",
        price: 35,
        currency: "$",
        unit: "project",
        remote: true,
        rating: 4.9,
        reviews: 44,
        posted: 4,
        description:
            "Professional logos, social media designs, flyers, banners and business branding."
    },

    {
        id: 5,
        name: "Hair & Beauty",
        provider: "Beauty Point",
        location: "Benghazi",
        category: "beauty",
        price: 25,
        currency: "$",
        unit: "appointment",
        remote: false,
        rating: 4.6,
        reviews: 15,
        posted: 5,
        description:
            "Professional hair styling, beauty treatments and personal grooming services."
    },

    {
        id: 6,
        name: "English Tutoring",
        provider: "Learn English",
        location: "Remote",
        category: "education",
        price: 15,
        currency: "$",
        unit: "per hour",
        remote: true,
        rating: 4.9,
        reviews: 27,
        posted: 6,
        description:
            "One-on-one English lessons for beginners, students and professionals."
    },

    {
        id: 7,
        name: "Delivery Service",
        provider: "Fast Delivery",
        location: "Misrata",
        category: "transport",
        price: 10,
        currency: "$",
        unit: "delivery",
        remote: false,
        rating: 4.5,
        reviews: 11,
        posted: 7,
        description:
            "Fast and reliable local delivery for products, documents and packages."
    },

    {
        id: 8,
        name: "Business Consulting",
        provider: "Business Experts",
        location: "Remote",
        category: "business",
        price: 100,
        currency: "$",
        unit: "session",
        remote: true,
        rating: 4.8,
        reviews: 19,
        posted: 8,
        description:
            "Business strategy, marketing, planning and growth consulting for entrepreneurs."
    }

];


/* =====================================================
   STATE
===================================================== */

let displayedServices =
    [...services];

let selectedCategory =
    "all";

let selectedLocation =
    "all";

let currentSort =
    "new";


/* =====================================================
   DOM
===================================================== */

const servicesList =
    document.getElementById(
        "servicesList"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const serviceSearch =
    document.getElementById(
        "serviceSearch"
    );

const clearSearch =
    document.getElementById(
        "clearSearch"
    );

const serviceModal =
    document.getElementById(
        "serviceModal"
    );

const serviceDetails =
    document.getElementById(
        "serviceDetails"
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

function escapeHTML(
    value = ""
) {

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

function formatPrice(service) {

    return (
        service.currency +
        Number(service.price)
            .toLocaleString()
    );

}


/* =====================================================
   RENDER SERVICES
===================================================== */

function renderServices() {

    servicesList.innerHTML = "";


    if (!displayedServices.length) {

        servicesList.classList.add(
            "hidden"
        );

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    servicesList.classList.remove(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );


    displayedServices.forEach(
        service => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "service-card";


            card.innerHTML = `

                <div class="service-top">

                    <div class="service-icon">

                        <i class="fas ${getIcon(
                            service.category
                        )}"></i>

                    </div>


                    <div class="service-main">

                        <div class="service-name">

                            ${escapeHTML(
                                service.name
                            )}

                        </div>


                        <div class="provider-name">

                            ${escapeHTML(
                                service.provider
                            )}

                        </div>


                        <div class="service-location">

                            <i class="fas fa-location-dot"></i>

                            ${escapeHTML(
                                service.location
                            )}

                        </div>

                    </div>

                </div>


                <div class="service-meta">

                    <span class="service-tag service-price">

                        ${formatPrice(service)}

                    </span>


                    <span class="service-tag">

                        ${escapeHTML(
                            service.unit
                        )}

                    </span>


                    ${
                        service.remote
                        ? `
                            <span class="service-tag">
                                Remote
                            </span>
                        `
                        : ""
                    }

                </div>


                <div class="service-bottom">

                    <span class="rating">

                        <i class="fas fa-star"></i>

                        ${service.rating}

                        <span>
                            (${service.reviews})
                        </span>

                    </span>


                    <span class="view-service">

                        View Service

                        <i class="fas fa-chevron-right"></i>

                    </span>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    openService(
                        service.id
                    );

                }
            );


            servicesList.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   ICON
===================================================== */

function getIcon(category) {

    const icons = {

        cleaning:
            "fa-broom",

        repair:
            "fa-screwdriver-wrench",

        technology:
            "fa-laptop-code",

        beauty:
            "fa-scissors",

        education:
            "fa-graduation-cap",

        transport:
            "fa-truck",

        business:
            "fa-chart-line"

    };


    return (
        icons[category] ||
        "fa-tools"
    );

}


/* =====================================================
   OPEN SERVICE
===================================================== */

function openService(serviceId) {

    const service =
        services.find(
            item =>
                item.id ===
                serviceId
        );


    if (!service) {
        return;
    }


    serviceDetails.innerHTML = `

        <div class="details-header">

            <h2>
                ${escapeHTML(
                    service.name
                )}
            </h2>

            <div class="details-provider">

                ${escapeHTML(
                    service.provider
                )}

            </div>

        </div>


        <div class="details-row">

            <i class="fas fa-location-dot"></i>

            <span>
                ${escapeHTML(
                    service.location
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-tag"></i>

            <span>
                ${formatPrice(service)}
                ${escapeHTML(
                    " " +
                    service.unit
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-star"></i>

            <span>
                ${service.rating}
                (${service.reviews} reviews)
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-laptop"></i>

            <span>
                ${
                    service.remote
                    ? "Remote Available"
                    : "On-site Service"
                }
            </span>

        </div>


        <div class="details-description">

            ${escapeHTML(
                service.description
            )}

        </div>


        <button
            class="book-button"
            onclick="bookService(${service.id})"
        >

            <i class="fas fa-calendar-check"></i>

            Book Service

        </button>

    `;


    serviceModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeServiceModal() {

    serviceModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


/* =====================================================
   BOOK SERVICE
===================================================== */

function bookService(serviceId) {

    const service =
        services.find(
            item =>
                item.id ===
                serviceId
        );


    if (!service) {
        return;
    }


    let bookings =
        JSON.parse(
            localStorage.getItem(
                "matchconnectBookings"
            )
        ) || [];


    bookings.push({

        id:
            Date.now().toString(),

        serviceId:
            service.id,

        serviceName:
            service.name,

        provider:
            service.provider,

        price:
            service.price,

        currency:
            service.currency,

        status:
            "pending",

        createdAt:
            new Date().toISOString()

    });


    localStorage.setItem(
        "matchconnectBookings",
        JSON.stringify(
            bookings
        )
    );


    showToast(
        "Service booking request sent"
    );


    closeServiceModal();

}


/* =====================================================
   SEARCH
===================================================== */

serviceSearch.addEventListener(
    "input",
    filterServices
);


function filterServices() {

    const search =
        serviceSearch.value
            .trim()
            .toLowerCase();


    clearSearch.style.display =
        search
        ? "block"
        : "none";


    displayedServices =
        services.filter(
            service => {

                const matchesSearch =
                    !search ||

                    service.name
                        .toLowerCase()
                        .includes(search) ||

                    service.provider
                        .toLowerCase()
                        .includes(search) ||

                    service.location
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    selectedCategory ===
                    "all" ||

                    service.category ===
                    selectedCategory;


                const matchesLocation =
                    selectedLocation ===
                    "all" ||

                    (
                        selectedLocation ===
                        "remote" &&
                        service.remote
                    ) ||

                    (
                        selectedLocation ===
                        "nearby" &&
                        !service.remote
                    );


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesLocation
                );

            }
        );


    sortCurrentServices();

    renderServices();

}


/* =====================================================
   CLEAR SEARCH
===================================================== */

clearSearch.addEventListener(
    "click",
    () => {

        serviceSearch.value = "";

        filterServices();

        serviceSearch.focus();

    }
);


/* =====================================================
   CATEGORY FILTER
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


                filterServices();

            }
        );

    });


/* =====================================================
   LOCATION FILTER
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


                selectedLocation =
                    button.dataset.location;


                filterServices();

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


function sortServices(type) {

    currentSort =
        type;

    sortCurrentServices();

    renderServices();

    sortMenu.classList.add(
        "hidden"
    );

}


function sortCurrentServices() {

    if (
        currentSort ===
        "price-high"
    ) {

        displayedServices.sort(
            (a, b) =>
                b.price -
                a.price
        );

    }

    else if (
        currentSort ===
        "price-low"
    ) {

        displayedServices.sort(
            (a, b) =>
                a.price -
                b.price
        );

    }

    else {

        displayedServices.sort(
            (a, b) =>
                a.posted -
                b.posted
        );

    }

}


/* =====================================================
   RESET
===================================================== */

function resetServices() {

    serviceSearch.value = "";

    selectedCategory =
        "all";

    selectedLocation =
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
            button =>
                button.classList.remove(
                    "active"
                )
        );


    document
        .querySelector(
            '.filter-btn[data-location="all"]'
        )
        .classList.add(
            "active"
        );


    displayedServices =
        [...services];


    sortCurrentServices();

    renderServices();

}


/* =====================================================
   QUICK ACTIONS
===================================================== */

function offerService() {

    window.location.href =
        "offer-service.html";

}


function myServices() {

    window.location.href =
        "my-services.html";

}


function savedServices() {

    window.location.href =
        "saved-services.html";

}


function myBookings() {

    window.location.href =
        "bookings.html";

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
   MODAL OUTSIDE CLICK
===================================================== */

serviceModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            serv

/* =====================================================
   MATCHCONNECT VEHICLES
===================================================== */


/* =====================================================
   SAMPLE VEHICLES
===================================================== */

const vehicles = [

    {
        id: 1,
        title: "Toyota Camry",
        type: "car",
        purpose: "sale",
        location: "Tripoli",
        price: 18500,
        currency: "$",
        year: 2021,
        mileage: "52,000 km",
        transmission: "Automatic",
        fuel: "Petrol",
        owner: "Tripoli Auto",
        posted: 1,
        image: "",
        description:
            "A clean and reliable Toyota Camry in excellent condition. Comfortable interior, automatic transmission and suitable for everyday driving."
    },

    {
        id: 2,
        title: "Toyota Land Cruiser",
        type: "car",
        purpose: "sale",
        location: "Tripoli",
        price: 48000,
        currency: "$",
        year: 2022,
        mileage: "35,000 km",
        transmission: "Automatic",
        fuel: "Petrol",
        owner: "Premium Motors",
        posted: 2,
        image: "",
        description:
            "Luxury SUV with excellent performance and spacious interior. Suitable for family and long-distance travel."
    },

    {
        id: 3,
        title: "Honda Motorcycle",
        type: "motorcycle",
        purpose: "sale",
        location: "Misrata",
        price: 6200,
        currency: "$",
        year: 2023,
        mileage: "8,500 km",
        transmission: "Manual",
        fuel: "Petrol",
        owner: "Moto Center",
        posted: 3,
        image: "",
        description:
            "Reliable motorcycle with excellent fuel economy and comfortable handling."
    },

    {
        id: 4,
        title: "Mercedes Delivery Van",
        type: "van",
        purpose: "rent",
        location: "Benghazi",
        price: 850,
        currency: "$",
        year: 2020,
        mileage: "92,000 km",
        transmission: "Automatic",
        fuel: "Diesel",
        owner: "Business Transport",
        posted: 4,
        image: "",
        description:
            "Spacious delivery van available for business and commercial transportation."
    },

    {
        id: 5,
        title: "Isuzu Truck",
        type: "truck",
        purpose: "sale",
        location: "Tripoli",
        price: 32000,
        currency: "$",
        year: 2019,
        mileage: "115,000 km",
        transmission: "Manual",
        fuel: "Diesel",
        owner: "Commercial Motors",
        posted: 5,
        image: "",
        description:
            "Heavy-duty commercial truck suitable for transportation and business operations."
    },

    {
        id: 6,
        title: "Toyota Coaster Bus",
        type: "bus",
        purpose: "sale",
        location: "Benghazi",
        price: 41000,
        currency: "$",
        year: 2018,
        mileage: "130,000 km",
        transmission: "Manual",
        fuel: "Diesel",
        owner: "Transport Hub",
        posted: 6,
        image: "",
        description:
            "Reliable passenger bus suitable for schools, companies, tours and transportation businesses."
    }

];


/* =====================================================
   STATE
===================================================== */

let displayedVehicles =
    [...vehicles];

let selectedType =
    "all";

let selectedPurpose =
    "all";

let currentSort =
    "new";


/* =====================================================
   DOM
===================================================== */

const vehicleList =
    document.getElementById(
        "vehicleList"
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

const vehicleModal =
    document.getElementById(
        "vehicleModal"
    );

const vehicleDetails =
    document.getElementById(
        "vehicleDetails"
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

function formatPrice(vehicle) {

    return (
        vehicle.currency +
        Number(vehicle.price)
            .toLocaleString()
    );

}


/* =====================================================
   VEHICLE ICON
===================================================== */

function getVehicleIcon(type) {

    const icons = {

        car:
            "fa-car",

        motorcycle:
            "fa-motorcycle",

        truck:
            "fa-truck",

        bus:
            "fa-bus",

        van:
            "fa-van-shuttle"

    };

    return (
        icons[type] ||
        "fa-car"
    );

}


/* =====================================================
   RENDER VEHICLES
===================================================== */

function renderVehicles() {

    vehicleList.innerHTML = "";


    if (!displayedVehicles.length) {

        vehicleList.classList.add(
            "hidden"
        );

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    vehicleList.classList.remove(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );


    displayedVehicles.forEach(
        vehicle => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "vehicle-card";


            const imageHTML =
                vehicle.image

                ? `
                    <img
                        src="${escapeHTML(
                            vehicle.image
                        )}"
                        alt="${escapeHTML(
                            vehicle.title
                        )}"
                    >
                `

                : `
                    <i class="fas ${getVehicleIcon(
                        vehicle.type
                    )}"></i>
                `;


            card.innerHTML = `

                <div class="vehicle-image">

                    ${imageHTML}

                </div>


                <div class="vehicle-info">

                    <span class="vehicle-purpose">

                        ${
                            vehicle.purpose ===
                            "sale"
                            ? "FOR SALE"
                            : "FOR RENT"
                        }

                    </span>


                    <div class="vehicle-title">

                        ${escapeHTML(
                            vehicle.title
                        )}

                    </div>


                    <div class="vehicle-location">

                        <i class="fas fa-location-dot"></i>

                        ${escapeHTML(
                            vehicle.location
                        )}

                    </div>


                    <div class="vehicle-meta">

                        <span class="meta">

                            <i class="fas fa-calendar"></i>

                            ${vehicle.year}

                        </span>


                        <span class="meta">

                            <i class="fas fa-road"></i>

                            ${escapeHTML(
                                vehicle.mileage
                            )}

                        </span>


                        <span class="meta">

                            <i class="fas fa-gears"></i>

                            ${escapeHTML(
                                vehicle.transmission
                            )}

                        </span>

                    </div>


                    <div class="vehicle-price">

                        ${formatPrice(vehicle)}

                    </div>


                    <div class="vehicle-footer">

                        <span class="vehicle-owner">

                            ${escapeHTML(
                                vehicle.owner
                            )}

                        </span>


                        <span class="view-vehicle">

                            View Vehicle

                            <i class="fas fa-chevron-right"></i>

                        </span>

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () =>
                    openVehicle(
                        vehicle.id
                    )
            );


            vehicleList.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   OPEN VEHICLE
===================================================== */

function openVehicle(vehicleId) {

    const vehicle =
        vehicles.find(
            item =>
                item.id ===
                vehicleId
        );


    if (!vehicle) {
        return;
    }


    const imageHTML =
        vehicle.image

        ? `
            <img
                src="${escapeHTML(
                    vehicle.image
                )}"
                alt="${escapeHTML(
                    vehicle.title
                )}"
            >
        `

        : `
            <i class="fas ${getVehicleIcon(
                vehicle.type
            )}"></i>
        `;


    vehicleDetails.innerHTML = `

        <div class="details-image">

            ${imageHTML}

        </div>


        <h2 class="details-title">

            ${escapeHTML(
                vehicle.title
            )}

        </h2>


        <div class="details-price">

            ${formatPrice(vehicle)}

        </div>


        <div class="details-row">

            <i class="fas fa-location-dot"></i>

            <span>
                ${escapeHTML(
                    vehicle.location
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-car"></i>

            <span>

                ${
                    vehicle.purpose ===
                    "sale"
                    ? "For Sale"
                    : "For Rent"
                }

            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-calendar"></i>

            <span>
                ${vehicle.year}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-road"></i>

            <span>
                ${escapeHTML(
                    vehicle.mileage
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-gears"></i>

            <span>
                ${escapeHTML(
                    vehicle.transmission
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-gas-pump"></i>

            <span>
                ${escapeHTML(
                    vehicle.fuel
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-user"></i>

            <span>
                ${escapeHTML(
                    vehicle.owner
                )}
            </span>

        </div>


        <div class="details-description">

            ${escapeHTML(
                vehicle.description
            )}

        </div>


        <div class="action-buttons">

            <button
                class="action-button contact-button"
                onclick="contactSeller(${vehicle.id})"
            >

                <i class="fas fa-comment"></i>

                Contact

            </button>


            <button
                class="action-button save-button"
                onclick="saveVehicle(${vehicle.id})"
            >

                <i class="fas fa-bookmark"></i>

                Save

            </button>

        </div>

    `;


    vehicleModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE VEHICLE
===================================================== */

function closeVehicle() {

    vehicleModal.classList.add(
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


    displayedVehicles =
        vehicles.filter(
            vehicle => {

                const matchesSearch =
                    !search ||

                    vehicle.title
                        .toLowerCase()
                        .includes(search) ||

                    vehicle.location
                        .toLowerCase()
                        .includes(search) ||

                    vehicle.owner
                        .toLowerCase()
                        .includes(search);


                const matchesType =
                    selectedType ===
                    "all" ||

                    vehicle.type ===
                    selectedType;


                const matchesPurpose =
                    selectedPurpose ===
                    "all" ||

                    vehicle.purpose ===
                    selectedPurpose;


                return (
                    matchesSearch &&
                    matchesType &&
                    matchesPurpose
                );

            }
        );


    sortCurrent();

    renderVehicles();

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
   TYPE FILTER
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
   SALE / RENT FILTER
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


function sortVehicles(type) {

    currentSort =
        type;

    sortCurrent();

    renderVehicles();

    sortMenu.classList.add(
        "hidden"
    );

}


function sortCurrent() {

    if (
        currentSort ===
        "low"
    ) {

        displayedVehicles.sort(
            (a, b) =>
                a.price -
                b.price
        );

    }

    else if (
        currentSort ===
        "high"
    ) {

        displayedVehicles.sort(
            (a, b) =>
                b.price -
                a.price
        );

    }

    else if (
        currentSort ===
        "year"
    ) {

        displayedVehicles.sort(
            (a, b) =>
                b.year -
                a.year
        );

    }

    else {

        displayedVehicles.sort(
            (a, b) =>
                a.posted -
                b.posted
        );

    }

}


/* =====================================================
   SAVE VEHICLE
===================================================== */

function saveVehicle(vehicleId) {

    let saved =
        JSON.parse(
            localStorage.getItem(
                "matchconnectSavedVehicles"
            )
        ) || [];


    if (
        !saved.includes(
            vehicleId
        )
    ) {

        saved.push(
            vehicleId
        );


        localStorage.setItem(
            "matchconnectSavedVehicles",
            JSON.stringify(saved)
        );


        showToast(
            "Vehicle saved"
        );

    }

    else {

        showToast(
            "Vehicle already saved"
        );

    }

}


/* =====================================================
   CONTACT SELLER
===================================================== */

function contactSeller(vehicleId) {

    const vehicle =
        vehicles.find(
            item =>
                item.id ===
                vehicleId
        );


    if (!vehicle) {
        return;
    }


    showToast(
        "Contact feature will be connected later"
    );

}


/* =====================================================
   QUICK ACTIONS
===================================================== */

function sellVehicle() {

    window.location.href =
        "sell-vehicle.html";

}


function myVehicles() {

    window.location.href =
        "my-vehicles.html";

}


function savedVehicles() {

    window.location.href =
        "saved-vehicles.html";

}


function vehicleRequests() {

    window.location.href =
        "vehicle-requests.html";

}


/* =====================================================
   RESET
===================================================== */

function resetVehicles() {

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
                )
        );


    document
        .querySelector(
            '.category[data-type="all"]'
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
                button.classList.re

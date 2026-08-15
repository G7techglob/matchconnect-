/* =====================================================
   MATCHCONNECT BOOKINGS
===================================================== */


/* =====================================================
   SAMPLE BOOKINGS
===================================================== */

let bookings = [

    {
        id: "MC-BOOK-1001",

        service:
            "Hair Salon Appointment",

        provider:
            "Premium Beauty Salon",

        date:
            "20 Aug 2026",

        time:
            "10:00 AM",

        status:
            "confirmed",

        notes:
            "Regular appointment."

    },

    {
        id: "MC-BOOK-1002",

        service:
            "Car Service",

        provider:
            "AutoCare Services",

        date:
            "24 Aug 2026",

        time:
            "02:00 PM",

        status:
            "upcoming",

        notes:
            "Vehicle inspection."

    }

];


/* =====================================================
   STATE
===================================================== */

let currentStatus =
    "all";


/* =====================================================
   DOM
===================================================== */

const bookingsContainer =
    document.getElementById(
        "bookingsContainer"
    );

const emptyBookings =
    document.getElementById(
        "emptyBookings"
    );

const bookingModal =
    document.getElementById(
        "bookingModal"
    );

const detailsModal =
    document.getElementById(
        "detailsModal"
    );

const infoModal =
    document.getElementById(
        "infoModal"
    );

const bookingDetails =
    document.getElementById(
        "bookingDetails"
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
   RENDER BOOKINGS
===================================================== */

function renderBookings() {

    const filtered =
        bookings.filter(
            booking => {

                return (
                    currentStatus === "all" ||
                    booking.status ===
                    currentStatus
                );

            }
        );


    bookingsContainer.innerHTML =
        "";


    if (
        filtered.length === 0
    ) {

        emptyBookings.style.display =
            "block";

        return;

    }


    emptyBookings.style.display =
        "none";


    filtered.forEach(
        booking => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "booking-card";


            card.innerHTML = `

                <div class="booking-top">

                    <div>

                        <div class="booking-title">

                            ${escapeHTML(
                                booking.service
                            )}

                        </div>

                        <div class="booking-id">

                            ${escapeHTML(
                                booking.id
                            )}

                        </div>

                    </div>


                    <span
                        class="
                            status
                            ${escapeHTML(
                                booking.status
                            )}
                        "
                    >

                        ${escapeHTML(
                            booking.status
                        )}

                    </span>

                </div>


                <div class="booking-info">

                    <div class="info-item">

                        <i class="fas fa-building"></i>

                        <div>

                            <small>
                                Provider
                            </small>

                            <strong>
                                ${escapeHTML(
                                    booking.provider
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="info-item">

                        <i class="fas fa-calendar"></i>

                        <div>

                            <small>
                                Date
                            </small>

                            <strong>
                                ${escapeHTML(
                                    booking.date
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="info-item">

                        <i class="fas fa-clock"></i>

                        <div>

                            <small>
                                Time
                            </small>

                            <strong>
                                ${escapeHTML(
                                    booking.time
                                )}
                            </strong>

                        </div>

                    </div>

                </div>


                <div class="booking-bottom">

                    <button
                        onclick="viewBooking('${escapeHTML(
                            booking.id
                        )}')"
                    >

                        <i class="fas fa-eye"></i>

                        View

                    </button>


                    ${
                        booking.status !==
                        "cancelled" &&
                        booking.status !==
                        "completed"

                        ? `

                            <button
                                class="cancel-btn"
                                onclick="cancelBooking('${escapeHTML(
                                    booking.id
                                )}')"
                            >

                                Cancel

                            </button>

                        `

                        : ""

                    }

                </div>

            `;


            bookingsContainer.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   FILTERS
===================================================== */

document
    .querySelectorAll(".filter-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".filter-btn"
                    )
                    .forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                currentStatus =
                    button.dataset.status;


                renderBookings();

            }
        );

    });


/* =====================================================
   OPEN FORM
===================================================== */

function openBookingForm() {

    bookingModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CREATE BOOKING
===================================================== */

function createBooking() {

    const service =
        document.getElementById(
            "serviceInput"
        ).value.trim();


    const date =
        document.getElementById(
            "dateInput"
        ).value;


    const time =
        document.getElementById(
            "timeInput"
        ).value;


    const notes =
        document.getElementById(
            "notesInput"
        ).value.trim();


    if (!service) {

        showToast(
            "Enter the service"
        );

        return;

    }


    if (!date) {

        showToast(
            "Select a date"
        );

        return;

    }


    if (!time) {

        showToast(
            "Select a time"
        );

        return;

    }


    const newBooking = {

        id:
            "MC-BOOK-" +
            Date.now(),

        service:
            service,

        provider:
            "Service Provider",

        date:
            date,

        time:
            time,

        status:
            "upcoming",

        notes:
            notes || "No additional notes."

    };


    bookings.unshift(
        newBooking
    );


    closeBookingModal();

    renderBookings();


    showToast(
        "Booking created successfully"
    );


    document.getElementById(
        "serviceInput"
    ).value = "";


    document.getElementById(
        "dateInput"
    ).value = "";


    document.getElementById(
        "timeInput"
    ).value = "";


    document.getElementById(
        "notesInput"
    ).value = "";

}


/* =====================================================
   VIEW BOOKING
===================================================== */

function viewBooking(id) {

    const booking =
        bookings.find(
            item =>
                item.id === id
        );


    if (!booking) {

        showToast(
            "Booking not found"
        );

        return;

    }


    bookingDetails.innerHTML = `

        <h2>
            Booking Details
        </h2>


        <div class="details-row">

            <span>
                Booking ID
            </span>

            <strong>
                ${escapeHTML(
                    booking.id
                )}
            </strong>

        </div>


        <div class="details-row">

            <span>
                Service
            </span>

            <strong>
                ${escapeHTML(
                    booking.service
                )}
            </strong>

        </div>


        <div class="details-row">

            <span>
                Provider
            </span>

            <strong>
                ${escapeHTML(
                    booking.provider
                )}
            </strong>

        </div>


        <div class="details-row">

            <span>
                Date
            </span>

            <strong>
                ${escapeHTML(
                    booking.date
                )}
            </strong>

        </div>


        <div class="details-row">

            <span>
                Time
            </span>

            <strong>
                ${escapeHTML(
                    booking.time
                )}
            </strong>

        </div>


        <div class="details-row">

            <span>
                Status
            </span>

            <strong>
                ${escapeHTML(
                    booking.status
                )}
            </strong>

        </div>


        <div class="details-row">

            <span>
                Notes
            </span>

            <strong>
                ${escapeHTML(
                    booking.notes
                )}
            </strong>

        </div>


        <div class="details-actions">

            <button
                class="secondary-btn"
                onclick="closeDetailsModal()"
            >
                Close
            </button>

        </div>

    `;


    detailsModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CANCEL BOOKING
===================================================== */

function cancelBooking(id) {

    const booking =
        bookings.find(
            item =>
                item.id === id
        );


    if (!booking) {

        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to cancel this booking?"
        );


    if (!confirmed) {

        return;

    }


    booking.status =
        "cancelled";


    renderBookings();


    showToast(
        "Booking cancelled"
    );

}


/* =====================================================
   CLOSE MODALS
===================================================== */

function closeBookingModal() {

    bookingModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


function closeDetailsModal() {

    detailsModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


function showBookingInfo() {

    infoModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


function closeInfoModal() {

    infoModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


/* =====================================================
   MODAL BACKGROUND
===================================================== */

bookingModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            bookingModal
        ) {

            closeBookingModal();

        }

    }
);


detailsModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            detailsModal
        ) {

            closeDetailsModal();

        }

    }
);


infoModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            infoModal
        ) {

            closeInfoModal();

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
            event.key ===
            "Escape"
        ) {

            closeBookingModal();

            closeDetailsModal();

            closeInfoModal();

        }

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

renderBookings();

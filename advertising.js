/* =====================================================
   MATCHCONNECT ADVERTISING
===================================================== */


/* =====================================================
   SAMPLE ADVERTISEMENTS
===================================================== */

let advertisements = [

    {
        id: "MC-AD-1001",

        title:
            "New Fashion Collection",

        description:
            "Discover our latest fashion collection and special offers.",

        image:
            "https://via.placeholder.com/300x200",

        destination:
            "#",

        budget:
            5000,

        duration:
            30,

        status:
            "active",

        impressions:
            1240,

        clicks:
            86
    },

    {
        id: "MC-AD-1002",

        title:
            "Premium Business Services",

        description:
            "Professional services for businesses and entrepreneurs.",

        image:
            "https://via.placeholder.com/300x200",

        destination:
            "#",

        budget:
            3000,

        duration:
            14,

        status:
            "pending",

        impressions:
            0,

        clicks:
            0
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

const adsContainer =
    document.getElementById(
        "adsContainer"
    );

const emptyAds =
    document.getElementById(
        "emptyAds"
    );

const adModal =
    document.getElementById(
        "adModal"
    );

const detailsModal =
    document.getElementById(
        "detailsModal"
    );

const infoModal =
    document.getElementById(
        "infoModal"
    );

const adDetails =
    document.getElementById(
        "adDetails"
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
   NUMBER FORMAT
===================================================== */

function formatNumber(number) {

    return new Intl.NumberFormat(
        "en-US"
    ).format(number);

}


/* =====================================================
   RENDER
===================================================== */

function renderAdvertisements() {

    const filtered =
        advertisements.filter(
            ad => {

                return (
                    currentStatus === "all" ||
                    ad.status ===
                    currentStatus
                );

            }
        );


    adsContainer.innerHTML =
        "";


    if (
        filtered.length === 0
    ) {

        emptyAds.style.display =
            "block";

        updateStats();

        return;

    }


    emptyAds.style.display =
        "none";


    filtered.forEach(
        ad => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "ad-card";


            const actionButton =
                ad.status === "paused"

                    ? `

                        <button
                            class="resume-btn"
                            onclick="toggleAdvertisement('${escapeHTML(
                                ad.id
                            )}')"
                        >

                            <i class="fas fa-play"></i>

                            Resume

                        </button>

                    `

                    : ad.status === "active"

                    ? `

                        <button
                            class="pause-btn"
                            onclick="toggleAdvertisement('${escapeHTML(
                                ad.id
                            )}')"
                        >

                            <i class="fas fa-pause"></i>

                            Pause

                        </button>

                    `

                    : "";


            card.innerHTML = `

                <div class="ad-top">

                    <div>

                        <div class="ad-title">

                            ${escapeHTML(
                                ad.title
                            )}

                        </div>

                        <div class="ad-id">

                            ${escapeHTML(
                                ad.id
                            )}

                        </div>

                    </div>


                    <span
                        class="
                            status
                            ${escapeHTML(
                                ad.status
                            )}
                        "
                    >

                        ${escapeHTML(
                            ad.status
                        )}

                    </span>

                </div>


                <div class="ad-content">

                    <img
                        class="ad-preview"
                        src="${escapeHTML(
                            ad.image
                        )}"
                        alt="Advertisement"
                    >


                    <div class="ad-description">

                        ${escapeHTML(
                            ad.description
                        )}

                    </div>

                </div>


                <div class="ad-metrics">

                    <div class="metric">

                        <span>
                            Impressions
                        </span>

                        <strong>

                            ${formatNumber(
                                ad.impressions
                            )}

                        </strong>

                    </div>


                    <div class="metric">

                        <span>
                            Clicks
                        </span>

                        <strong>

                            ${formatNumber(
                                ad.clicks
                            )}

                        </strong>

                    </div>


                    <div class="metric">

                        <span>
                            Daily Budget
                        </span>

                        <strong>

                            ₦${formatNumber(
                                ad.budget
                            )}

                        </strong>

                    </div>

                </div>


                <div class="ad-actions">

                    <button
                        class="view-btn"
                        onclick="viewAdvertisement('${escapeHTML(
                            ad.id
                        )}')"
                    >

                        <i class="fas fa-eye"></i>

                        View

                    </button>


                    ${actionButton}

                </div>

            `;


            adsContainer.appendChild(
                card
            );

        }
    );


    updateStats();

}


/* =====================================================
   UPDATE STATS
===================================================== */

function updateStats() {

    const active =
        advertisements.filter(
            ad =>
                ad.status === "active"
        );


    const impressions =
        advertisements.reduce(
            (total, ad) =>
                total + ad.impressions,
            0
        );


    const clicks =
        advertisements.reduce(
            (total, ad) =>
                total + ad.clicks,
            0
        );


    document.getElementById(
        "activeAds"
    ).textContent =
        active.length;


    document.getElementById(
        "impressions"
    ).textContent =
        formatNumber(
            impressions
        );


    document.getElementById(
        "clicks"
    ).textContent =
        formatNumber(
            clicks
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


                renderAdvertisements();

            }
        );

    });


/* =====================================================
   OPEN FORM
===================================================== */

function openAdForm() {

    adModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CREATE ADVERTISEMENT
===================================================== */

function createAdvertisement() {

    const title =
        document.getElementById(
            "adTitle"
        ).value.trim();


    const description =
        document.getElementById(
            "adDescription"
        ).value.trim();


    const image =
        document.getElementById(
            "adImageUrl"
        ).value.trim();


    const destination =
        document.getElementById(
            "adDestination"
        ).value.trim();


    const budget =
        Number(
            document.getElementById(
                "adBudget"
            ).value
        );


    const duration =
        Number(
            document.getElementById(
                "adDuration"
            ).value
        );


    if (!title) {

        showToast(
            "Enter an advertisement title"
        );

        return;

    }


    if (!description) {

        showToast(
            "Enter a description"
        );

        return;

    }


    if (!budget || budget <= 0) {

        showToast(
            "Enter a valid budget"
        );

        return;

    }


    const newAd = {

        id:
            "MC-AD-" +
            Date.now(),

        title:
            title,

        description:
            description,

        image:
            image ||
            "https://via.placeholder.com/300x200",

        destination:
            destination ||
            "#",

        budget:
            budget,

        duration:
            duration,

        status:
            "pending",

        impressions:
            0,

        clicks:
            0

    };


    advertisements.unshift(
        newAd
    );


    closeAdModal();

    renderAdvertisements();


    showToast(
        "Advertisement submitted for review"
    );


    clearAdForm();

}


/* =====================================================
   CLEAR FORM
===================================================== */

function clearAdForm() {

    document.getElementById(
        "adTitle"
    ).value = "";


    document.getElementById(
        "adDescription"
    ).value = "";


    document.getElementById(
        "adImageUrl"
    ).value = "";


    document.getElementById(
        "adDestination"
    ).value = "";


    document.getElementById(
        "adBudget"
    ).value = "";


    document.getElementById(
        "adDuration"
    ).value = "7";

}


/* =====================================================
   VIEW ADVERTISEMENT
===================================================== */

function viewAdvertisement(id) {

    const ad =
        advertisements.find(
            item =>
                item.id === id
        );


    if (!ad) {

        showToast(
            "Advertisement not found"
        );

        return;

    }


    adDetails.innerHTML = `

        <h2>
            Advertisement Details
        </h2>


        <div class="details-row">

            <span>
                Advertisement ID
            </span>

            <strong>
                ${escapeHTML(
                    ad.id
                )}
            </strong>

        </div>


        <div class="details-row">

            <span>
                Title
            </span>

            <strong>
                ${escapeHTML(
                    ad.title
                )}
            </strong>

        </div>


        <div class="details-row">

            <span>
                Status
            </span>

            <strong>
                ${escapeHTML(
                    ad.status
                )}
            </strong>

        </div>


        <div class="details-row">

            <span>
                Daily Budget
            </span>

            <strong>
                ₦${formatNumber(
                    ad.budget
                )}
            </strong>

        </div>


        <div class="details-row">

            <span>
                Duration
            </span>

            <strong>
                ${ad.duration} Days
            </strong>

        </div>


        <div class="details-row">

            <span>
                Impressions
            </span>

            <strong>
                ${formatNumber(
                    ad.impressions
                )}
            </strong>

        </div>


        <div class="details-row">

            <span>
                Clicks
            </span>

            <strong>
                ${formatNumber(
                    ad.clicks
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
   PAUSE / RESUME
===================================================== */

function toggleAdvertisement(id) {

    const ad =
        advertisements.find(
            item =>
                item.id === id
        );


    if (!ad) {

        return;

    }


    if (
        ad.status === "active"
    ) {

        ad.status =
            "paused";

        showToast(
            "Advertisement paused"
        );

    }

    else if (
        ad.status === "paused"
    ) {

        ad.status =
            "active";

        showToast(
            "Advertisement resumed"
        );

    }


    renderAdvertisements();

}


/* =====================================================
   CLOSE MODALS
===================================================== */

function closeAdModal() {

    adModal.classList.add(
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


function showAdvertisingInfo() {

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

adModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            adModal
        ) {

            closeAdModal();

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
            event.key === "Escape"
        ) {

            closeAdModal();

            closeDetailsModal();

            closeInfoModal();

        }

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

renderAdvertisements();

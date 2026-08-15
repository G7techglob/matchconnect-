/* =====================================================
   MATCHCONNECT ORDERS
===================================================== */


/* =====================================================
   STATE
===================================================== */

let orders = [];

let selectedStatus = "all";


/* =====================================================
   DOM
===================================================== */

const ordersList =
    document.getElementById("ordersList");

const emptyOrders =
    document.getElementById("emptyOrders");

const orderModal =
    document.getElementById("orderModal");

const orderDetails =
    document.getElementById("orderDetails");

const toast =
    document.getElementById("toast");


/* =====================================================
   LOAD ORDERS
===================================================== */

function loadOrders() {

    orders =
        JSON.parse(
            localStorage.getItem(
                "matchconnectOrders"
            )
        ) || [];

    renderOrders();

}


/* =====================================================
   RENDER
===================================================== */

function renderOrders() {

    ordersList.innerHTML = "";

    let filteredOrders;


    if (selectedStatus === "all") {

        filteredOrders =
            [...orders];

    } else {

        filteredOrders =
            orders.filter(
                order =>
                    order.status ===
                    selectedStatus
            );

    }


    if (!filteredOrders.length) {

        ordersList.classList.add(
            "hidden"
        );

        emptyOrders.classList.remove(
            "hidden"
        );

        return;

    }


    ordersList.classList.remove(
        "hidden"
    );

    emptyOrders.classList.add(
        "hidden"
    );


    filteredOrders.forEach(
        order => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "order-card";


            card.innerHTML = `

                <div class="order-top">

                    <span class="order-number">
                        ${escapeHTML(
                            order.orderNumber
                        )}
                    </span>

                    <span class="order-date">
                        ${formatDate(
                            order.createdAt
                        )}
                    </span>

                </div>


                <div class="order-product">

                    <img
                        class="order-image"
                        src="${escapeHTML(
                            order.image
                        )}"
                        alt="${escapeHTML(
                            order.productName
                        )}"
                    >


                    <div class="order-info">

                        <div class="order-name">
                            ${escapeHTML(
                                order.productName
                            )}
                        </div>

                        <div class="order-price">
                            ${formatPrice(order)}
                        </div>

                        <div class="order-seller">
                            Seller:
                            ${escapeHTML(
                                order.seller
                            )}
                        </div>

                    </div>

                </div>


                <div class="order-bottom">

                    <span
                        class="status ${escapeHTML(
                            order.status
                        )}"
                    >
                        ${capitalize(
                            order.status
                        )}
                    </span>


                    <button
                        class="view-order"
                        onclick="viewOrder('${escapeHTML(
                            order.id
                        )}')"
                    >

                        View Details

                        <i class="fas fa-chevron-right"></i>

                    </button>

                </div>

            `;


            ordersList.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   VIEW ORDER
===================================================== */

function viewOrder(orderId) {

    const order =
        orders.find(
            item =>
                String(item.id) ===
                String(orderId)
        );


    if (!order) {

        showToast(
            "Order not found"
        );

        return;

    }


    orderDetails.innerHTML = `

        <div class="detail-row">

            <span class="detail-label">
                Order Number
            </span>

            <span class="detail-value">
                ${escapeHTML(
                    order.orderNumber
                )}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Product
            </span>

            <span class="detail-value">
                ${escapeHTML(
                    order.productName
                )}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Seller
            </span>

            <span class="detail-value">
                ${escapeHTML(
                    order.seller
                )}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Price
            </span>

            <span class="detail-value">
                ${formatPrice(order)}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Quantity
            </span>

            <span class="detail-value">
                ${order.quantity}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Status
            </span>

            <span class="detail-value">
                ${capitalize(
                    order.status
                )}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Location
            </span>

            <span class="detail-value">
                ${escapeHTML(
                    order.location ||
                    "Not provided"
                )}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Ordered
            </span>

            <span class="detail-value">
                ${formatDate(
                    order.createdAt
                )}
            </span>

        </div>

    `;


    orderModal.classList.remove(
        "hidden"
    );

}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeOrderModal() {

    orderModal.classList.add(
        "hidden"
    );

}


/* =====================================================
   FILTER
===================================================== */

document
    .querySelectorAll(".order-tab")
    .forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".order-tab"
                    )
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                tab.classList.add(
                    "active"
                );


                selectedStatus =
                    tab.dataset.status;


                renderOrders();

            }
        );

    });


/* =====================================================
   GO TO MARKETPLACE
===================================================== */

function goToMarketplace() {

    window.location.href =
        "marketplace.html";

}


/* =====================================================
   FORMAT PRICE
===================================================== */

function formatPrice(order) {

    return (
        order.currency || "$"
    ) +
    Number(
        order.price || 0
    ).toLocaleString();

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(date) {

    if (!date) {
        return "Unknown date";
    }


    const d =
        new Date(date);


    if (Number.isNaN(
        d.getTime()
    )) {

        return "Unknown date";

    }


    return d.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


/* =====================================================
   CAPITALIZE
===================================================== */

function capitalize(value) {

    if (!value) {
        return "";
    }

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


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
   CLOSE MODAL OUTSIDE
===================================================== */

orderModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            orderModal
        ) {

            closeOrderModal();

        }

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

loadOrders();

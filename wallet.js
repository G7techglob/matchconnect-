
import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
/* =====================================================
   MATCHCONNECT WALLET
===================================================== */


/* =====================================================
   WALLET DATA
===================================================== */

let wallet = {

    balance: 0,

    walletId: "",

    userId: "",

    currency: "MCC"

};


/* =====================================================
   TRANSACTIONS
===================================================== */

let transactions = [];


/* =====================================================
   DOM
===================================================== */

const balanceAmount =
    document.getElementById(
        "balanceAmount"
    );

const walletId =
    document.getElementById(
        "walletId"
    );

const transactionsContainer =
    document.getElementById(
        "transactions"
    );

const emptyTransactions =
    document.getElementById(
        "emptyTransactions"
    );

const paymentModal =
    document.getElementById(
        "paymentModal"
    );

const modalContent =
    document.getElementById(
        "modalContent"
    );

const toast =
    document.getElementById(
        "toast"
    );


/* =====================================================
   BALANCE VISIBILITY
===================================================== */

let balanceVisible = true;


function toggleBalanceVisibility() {

    balanceVisible =
        !balanceVisible;


    if (balanceVisible) {

        balanceAmount.textContent =
            formatMoney(
                wallet.balance
            );

        document.querySelector(
            "#toggleBalance i"
        ).className =
            "fas fa-eye";

    }

    else {

        balanceAmount.textContent =
            "••••••";

        document.querySelector(
            "#toggleBalance i"
        ).className =
            "fas fa-eye-slash";

    }

}


/* =====================================================
   MONEY FORMAT
===================================================== */

function formatMoney(amount) {

    return `${Number(amount).toLocaleString("en-US")} MCC`;

}
/* =====================================================
   LOAD WALLET FROM FIRESTORE
===================================================== */

async function loadWallet() {

    try {

        const user = auth.currentUser;

        if (!user) {

            console.log("No logged-in user.");

            return;

        }


        const walletRef =
            doc(
                db,
                "wallets",
                user.uid
            );


        const walletSnap =
            await getDoc(
                walletRef
            );


        if (!walletSnap.exists()) {

            console.error(
                "Wallet document not found."
            );

            showToast(
                "Wallet not found"
            );

            return;

        }


        const data =
            walletSnap.data();


        wallet.balance =
            Number(
                data.balanceMCC || 0
            );


        wallet.walletId =
            data.walletId || "";


        wallet.userId =
            data.userId || user.uid;


        wallet.currency =
            data.defaultCurrency || "MCC";


        renderWallet();

await loadTransactions();

        console.log(
            "Wallet loaded:",
            wallet
        );

    }

    catch (error) {

        console.error(
            "Error loading wallet:",
            error
        );

        showToast(
            "Unable to load wallet"
        );

    }

}

/* =====================================================
   LOAD TRANSACTIONS FROM FIRESTORE
===================================================== */

async function loadTransactions() {

    try {

        const user = auth.currentUser;

        if (!user) {

            console.log("No logged-in user.");

            return;

        }


        const transactionsRef =
            collection(
                db,
                "walletTransactions"
            );


        const transactionsQuery =
            query(
                transactionsRef,
                where(
                    "userId",
                    "==",
                    user.uid
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                transactionsQuery
            );


        transactions = [];


        snapshot.forEach(
            document => {

                const data =
                    document.data();


                transactions.push({

                    id:
                        document.id,

                    type:
                        data.type,

                    amount:
                        Number(
                            data.amount || 0
                        ),

                    currency:
                        data.currency ||
                        "MCC",

                    title:
                        data.description ||
                        "Transaction",

                    date:
                        data.createdAt
                            ? data.createdAt
                                .toDate()
                                .toLocaleString()
                            : "",

                    status:
                        data.status,

                    reference:
                        data.reference

                });

            }
        );


        renderTransactions();


        console.log(
            "Transactions loaded:",
            transactions
        );

    }

    catch (error) {

        console.error(
            "Error loading transactions:",
            error
        );

    }

}
/* =====================================================
   RENDER BALANCE
===================================================== */

function renderWallet() {

    walletId.textContent =
        wallet.walletId;


    if (balanceVisible) {

        balanceAmount.textContent =
            formatMoney(
                wallet.balance
            );

    }

}


/* =====================================================
   TRANSACTIONS
===================================================== */

function renderTransactions() {

    transactionsContainer.innerHTML =
        "";


    if (
        !transactions.length
    ) {

        emptyTransactions.style.display =
            "block";

        return;

    }


    emptyTransactions.style.display =
        "none";


    transactions.forEach(
        transaction => {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "transaction";


            const isCredit =
                transaction.type ===
                "credit";


            element.innerHTML = `

                <div
                    class="transaction-icon"
                    style="
                        background:
                        ${isCredit
                            ? "#e7f7ed"
                            : "#fff0ed"};
                        color:
                        ${isCredit
                            ? "#20a05a"
                            : "#e04b35"};
                    "
                >

                    <i class="fas ${
                        isCredit
                        ? "fa-arrow-down"
                        : "fa-arrow-up"
                    }"></i>

                </div>


                <div class="transaction-info">

                    <strong>
                        ${escapeHTML(
                            transaction.title
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            transaction.date
                        )}
                    </small>

                </div>


                <div
                    class="
                        transaction-amount
                        ${
                            isCredit
                            ? "credit"
                            : "debit"
                        }
                    "
                >

                    ${
                        isCredit
                        ? "+"
                        : "-"
                    }

                    ${formatMoney(
                        transaction.amount
                    )}

                </div>

            `;


            transactionsContainer.appendChild(
                element
            );

        }
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
   DEPOSIT
===================================================== */

function openDeposit() {

    modalContent.innerHTML = `

        <h2 class="modal-title">
            Add Money
        </h2>


        <div class="form-group">

            <label>
                Amount
            </label>

            <input
                id="depositAmount"
                type="number"
                min="1"
                placeholder="Enter amount"
            >

        </div>


        <div class="form-group">

            <label>
                Payment Method
            </label>

            <select id="depositMethod">

                <option value="bank">
                    Bank Transfer
                </option>

                <option value="card">
                    Bank Card
                </option>

            </select>

        </div>


        <button
            class="modal-action"
            onclick="processDeposit()"
        >
            Continue
        </button>

    `;


    openPaymentModal();

}


/* =====================================================
   PROCESS DEPOSIT
===================================================== */

function processDeposit() {

    const input =
        document.getElementById(
            "depositAmount"
        );


    const amount =
        Number(
            input.value
        );


    if (
        !amount ||
        amount <= 0
    ) {

        showToast(
            "Enter a valid amount"
        );

        return;

    }


    /*
       Payment gateway will be connected here later.
    */

    showToast(
        "Payment system will be connected later"
    );

}


/* =====================================================
   WITHDRAW
===================================================== */

function openWithdraw() {

    modalContent.innerHTML = `

        <h2 class="modal-title">
            Withdraw Money
        </h2>


        <div class="form-group">

            <label>
                Amount
            </label>

            <input
                id="withdrawAmount"
                type="number"
                min="1"
                placeholder="Enter amount"
            >

        </div>


        <div class="form-group">

            <label>
                Bank Account
            </label>

            <input
                id="withdrawAccount"
                type="text"
                placeholder="Account number"
            >

        </div>


        <button
            class="modal-action"
            onclick="processWithdraw()"
        >
            Withdraw
        </button>

    `;


    openPaymentModal();

}


/* =====================================================
   PROCESS WITHDRAW
===================================================== */

function processWithdraw() {

    const amount =
        Number(
            document.getElementById(
                "withdrawAmount"
            ).value
        );


    if (
        !amount ||
        amount <= 0
    ) {

        showToast(
            "Enter a valid amount"
        );

        return;

    }


    if (
        amount >
        wallet.balance
    ) {

        showToast(
            "Insufficient balance"
        );

        return;

    }


    showToast(
        "Withdrawal system will be connected later"
    );

}


/* =====================================================
   SEND
===================================================== */

function openSendMoney() {

    modalContent.innerHTML = `

        <h2 class="modal-title">
            Send Money
        </h2>


        <div class="form-group">

            <label>
                Recipient
            </label>

            <input
                id="recipient"
                type="text"
                placeholder="Username or wallet ID"
            >

        </div>


        <div class="form-group">

            <label>
                Amount
            </label>

            <input
                id="sendAmount"
                type="number"
                min="1"
                placeholder="Enter amount"
            >

        </div>


        <button
            class="modal-action"
            onclick="processSend()"
        >
            Send Money
        </button>

    `;


    openPaymentModal();

}


function processSend() {

    const recipient =
        document.getElementById(
            "recipient"
        ).value.trim();


    const amount =
        Number(
            document.getElementById(
                "sendAmount"
            ).value
        );


    if (!recipient) {

        showToast(
            "Enter recipient"
        );

        return;

    }


    if (
        !amount ||
        amount <= 0
    ) {

        showToast(
            "Enter a valid amount"
        );

        return;

    }


    if (
        amount >
        wallet.balance
    ) {

        showToast(
            "Insufficient balance"
        );

        return;

    }


    showToast(
        "Transfer system will be connected later"
    );

}


/* =====================================================
   RECEIVE
===================================================== */

function openReceiveMoney() {

    modalContent.innerHTML = `

        <h2 class="modal-title">
            Receive Money
        </h2>


        <div class="wallet-number"
             style="
                background:#f4f6fb;
                color:#222;
                padding:15px;
                border:none;
                border-radius:8px;
                margin-bottom:15px;
             "
        >

            <span>
                Wallet ID
            </span>

            <strong>
                ${escapeHTML(
                    wallet.walletId
                )}
            </strong>

            <button
                style="color:#1877f2"
                onclick="copyWalletId()"
            >
                <i class="fas fa-copy"></i>
            </button>

        </div>


        <p
            style="
                font-size:12px;
                color:#777;
                line-height:1.6;
            "
        >
            Give your Wallet ID to another
            MatchConnect user to receive money.
        </p>

    `;


    openPaymentModal();

}


/* =====================================================
   QUICK PAYMENT
===================================================== */

function openPayment(type) {

    const names = {

        marketplace:
            "Marketplace Payment",

        orders:
            "Order Payment",

        services:
            "Services Payment",

        advertising:
            "Advertising Payment"

    };


    modalContent.innerHTML = `

        <h2 class="modal-title">
            ${escapeHTML(
                names[type] ||
                "Payment"
            )}
        </h2>


        <div class="form-group">

            <label>
                Amount
            </label>

            <input
                id="quickPaymentAmount"
                type="number"
                min="1"
                placeholder="Enter amount"
            >

        </div>


        <button
            class="modal-action"
            onclick="processQuickPayment('${type}')"
        >
            Continue
        </button>

    `;


    openPaymentModal();

}


function processQuickPayment(type) {

    const amount =
        Number(
            document.getElementById(
                "quickPaymentAmount"
            ).value
        );


    if (
        !amount ||
        amount <= 0
    ) {

        showToast(
            "Enter a valid amount"
        );

        return;

    }


    if (
        amount >
        wallet.balance
    ) {

        showToast(
            "Insufficient balance"
        );

        return;

    }


    showToast(
        "Payment system will be connected later"
    );

}


/* =====================================================
   TRANSACTION HISTORY
===================================================== */

function openTransactionHistory() {

    window.location.href =
        "transactions.html";

}


/* =====================================================
   COPY WALLET ID
===================================================== */

function copyWalletId() {

    navigator.clipboard
        .writeText(
            wallet.walletId
        )
        .then(
            () =>
                showToast(
                    "Wallet ID copied"
                )
        )
        .catch(
            () =>
                showToast(
                    "Unable to copy"
                )
        );

}


/* =====================================================
   MODAL
===================================================== */

function openPaymentModal() {

    paymentModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


function closePaymentModal() {

    paymentModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

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
   MODAL BACKGROUND
===================================================== */

paymentModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            paymentModal
        ) {

            closePaymentModal();

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

            closePaymentModal();

        }

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

auth.onAuthStateChanged(async (user) => {

    if (!user) {

        console.log("No user logged in.");

        return;

    }

    await loadWallet();

});

/* =====================================================
   EXPOSE WALLET FUNCTIONS TO HTML
===================================================== */

window.toggleBalanceVisibility =
    toggleBalanceVisibility;

window.copyWalletId =
    copyWalletId;

window.openDeposit =
    openDeposit;

window.processDeposit =
    processDeposit;

window.openWithdraw =
    openWithdraw;

window.processWithdraw =
    processWithdraw;

window.openSendMoney =
    openSendMoney;

window.processSend =
    processSend;

window.openReceiveMoney =
    openReceiveMoney;

window.openPayment =
    openPayment;

window.processQuickPayment =
    processQuickPayment;

window.openTransactionHistory =
    openTransactionHistory;

window.closePaymentModal =
    closePaymentModal;

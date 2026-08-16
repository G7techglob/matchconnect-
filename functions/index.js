const { onCall, HttpsError } =
    require("firebase-functions/v2/https");

const { initializeApp } =
    require("firebase-admin/app");

const {
    getFirestore,
    FieldValue
} =
    require("firebase-admin/firestore");


// =====================================================
// INITIALIZE FIREBASE ADMIN
// =====================================================

initializeApp();

const db = getFirestore();


// =====================================================
// SECURE MCC WITHDRAWAL
// =====================================================

exports.withdrawMCC = onCall(
    async (request) => {

        // =================================================
        // 1. REQUIRE AUTHENTICATION
        // =================================================

        if (!request.auth) {

            throw new HttpsError(
                "unauthenticated",
                "You must be logged in to withdraw MCC."
            );

        }


        // =================================================
        // 2. GET USER UID FROM FIREBASE AUTH
        // =================================================

        const uid =
            request.auth.uid;


        // =================================================
        // 3. READ REQUEST DATA
        // =================================================

        const amount =
            Number(
                request.data?.amount
            );

        const account =
            String(
                request.data?.account || ""
            ).trim();


        // =================================================
        // 4. VALIDATE AMOUNT
        // =================================================

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            throw new HttpsError(
                "invalid-argument",
                "Enter a valid withdrawal amount."
            );

        }


        // =================================================
        // 5. VALIDATE ACCOUNT
        // =================================================

        if (!account) {

            throw new HttpsError(
                "invalid-argument",
                "Bank account is required."
            );

        }


        // =================================================
        // 6. PREVENT DECIMAL MCC WITHDRAWALS
        // =================================================

        if (
            !Number.isInteger(amount)
        ) {

            throw new HttpsError(
                "invalid-argument",
                "Withdrawal amount must be a whole number of MCC."
            );

        }


        // =================================================
        // 7. GET USER WALLET
        // =================================================

        const walletRef =
            db.collection("wallets")
              .doc(uid);


        const transactionRef =
            db.collection(
                "walletTransactions"
            )
            .doc();


        // =================================================
        // 8. ATOMIC FIRESTORE TRANSACTION
        // =================================================

        await db.runTransaction(
            async (transaction) => {

                const walletSnap =
                    await transaction.get(
                        walletRef
                    );


                // -----------------------------------------
                // WALLET MUST EXIST
                // -----------------------------------------

                if (
                    !walletSnap.exists
                ) {

                    throw new HttpsError(
                        "not-found",
                        "Wallet not found."
                    );

                }


                const walletData =
                    walletSnap.data();


                // -----------------------------------------
                // CHECK WALLET OWNERSHIP
                // -----------------------------------------

                if (
                    walletData.userId !== uid
                ) {

                    throw new HttpsError(
                        "permission-denied",
                        "This wallet does not belong to you."
                    );

                }


                // -----------------------------------------
                // CURRENT BALANCE
                // -----------------------------------------

                const currentBalance =
                    Number(
                        walletData.balanceMCC || 0
                    );


                // -----------------------------------------
                // CHECK SUFFICIENT BALANCE
                // -----------------------------------------

                if (
                    amount >
                    currentBalance
                ) {

                    throw new HttpsError(
                        "failed-precondition",
                        "Insufficient MCC balance."
                    );

                }


                // -----------------------------------------
                // NEW BALANCE
                // -----------------------------------------

                const newBalance =
                    currentBalance -
                    amount;


                // -----------------------------------------
                // UPDATE WALLET
                // -----------------------------------------

                transaction.update(
                    walletRef,
                    {

                        balanceMCC:
                            newBalance,

                        updatedAt:
                            FieldValue.serverTimestamp()

                    }
                );


                // -----------------------------------------
                // CREATE PERMANENT TRANSACTION
                // -----------------------------------------

                transaction.set(
                    transactionRef,
                    {

                        userId:
                            uid,

                        walletId:
                            walletData.walletId ||
                            "",

                        type:
                            "debit",

                        amount:
                            amount,

                        currency:
                            "MCC",

                        description:
                            "Wallet Withdrawal",

                        method:
                            "bank",

                        account:
                            account,

                        status:
                            "completed",

                        reference:
                            "WDR-" +
                            Date.now() +
                            "-" +
                            Math.random()
                                .toString(36)
                                .substring(2, 7)
                                .toUpperCase(),

                        createdAt:
                            FieldValue.serverTimestamp()

                    }
                );

            }
        );


        // =================================================
        // 9. RETURN SUCCESS
        // =================================================

        return {

            success:
                true,

            amount:
                amount,

            currency:
                "MCC",

            message:
                "Withdrawal completed successfully."

        };

    }
);

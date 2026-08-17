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

// =====================================================
// SECURE MCC USER-TO-USER TRANSFER
// =====================================================

exports.transferMCC = onCall(
    async (request) => {

        // =================================================
        // 1. REQUIRE AUTHENTICATION
        // =================================================

        if (!request.auth) {

            throw new HttpsError(
                "unauthenticated",
                "You must be logged in to send MCC."
            );

        }

        const senderUid =
            request.auth.uid;


        // =================================================
        // 2. READ REQUEST DATA
        // =================================================

        const recipientWalletId =
            String(
                request.data?.recipientWalletId || ""
            ).trim();

        const amount =
            Number(
                request.data?.amount
            );


        // =================================================
        // 3. VALIDATE RECIPIENT
        // =================================================

        if (!recipientWalletId) {

            throw new HttpsError(
                "invalid-argument",
                "Recipient Wallet ID is required."
            );

        }


        // =================================================
        // 4. VALIDATE AMOUNT
        // =================================================

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            throw new HttpsError(
                "invalid-argument",
                "Enter a valid MCC amount."
            );

        }


        // =================================================
        // 5. MCC MUST BE WHOLE NUMBER
        // =================================================

        if (
            !Number.isInteger(amount)
        ) {

            throw new HttpsError(
                "invalid-argument",
                "MCC amount must be a whole number."
            );

        }


        // =================================================
        // 6. GET SENDER WALLET
        // =================================================

        const senderWalletRef =
            db.collection("wallets")
              .doc(senderUid);


        // =================================================
        // 7. FIND RECIPIENT WALLET
        // =================================================

        const recipientQuery =
            db.collection("wallets")
              .where(
                  "walletId",
                  "==",
                  recipientWalletId
              )
              .limit(1);


        // =================================================
        // 8. TRANSACTION
        // =================================================

        const transferReference =
            "TRF-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();


        await db.runTransaction(
            async (transaction) => {

                // -----------------------------------------
                // READ SENDER
                // -----------------------------------------

                const senderSnap =
                    await transaction.get(
                        senderWalletRef
                    );


                if (
                    !senderSnap.exists
                ) {

                    throw new HttpsError(
                        "not-found",
                        "Your wallet was not found."
                    );

                }


                const senderData =
                    senderSnap.data();


                // -----------------------------------------
                // VERIFY SENDER WALLET
                // -----------------------------------------

                if (
                    senderData.userId !== senderUid
                ) {

                    throw new HttpsError(
                        "permission-denied",
                        "This wallet does not belong to you."
                    );

                }


                // -----------------------------------------
                // FIND RECIPIENT
                // -----------------------------------------

                const recipientSnap =
                    await transaction.get(
                        recipientQuery
                    );


                if (
                    recipientSnap.empty
                ) {

                    throw new HttpsError(
                        "not-found",
                        "Recipient wallet was not found."
                    );

                }


                const recipientDoc =
                    recipientSnap.docs[0];


                const recipientWalletRef =
                    recipientDoc.ref;


                const recipientData =
                    recipientDoc.data();


                const recipientUid =
                    recipientData.userId;


                // -----------------------------------------
                // PREVENT SELF TRANSFER
                // -----------------------------------------

                if (
                    recipientUid === senderUid
                ) {

                    throw new HttpsError(
                        "failed-precondition",
                        "You cannot send MCC to yourself."
                    );

                }


                // -----------------------------------------
                // SENDER BALANCE
                // -----------------------------------------

                const senderBalance =
                    Number(
                        senderData.balanceMCC || 0
                    );


                const senderLocked =
                    Number(
                        senderData.lockedMCC || 0
                    );


                const availableBalance =
                    senderBalance -
                    senderLocked;


                // -----------------------------------------
                // CHECK BALANCE
                // -----------------------------------------

                if (
                    amount >
                    availableBalance
                ) {

                    throw new HttpsError(
                        "failed-precondition",
                        "Insufficient available MCC balance."
                    );

                }


                // -----------------------------------------
                // RECIPIENT BALANCE
                // -----------------------------------------

                const recipientBalance =
                    Number(
                        recipientData.balanceMCC || 0
                    );


                // -----------------------------------------
                // CALCULATE NEW BALANCES
                // -----------------------------------------

                const newSenderBalance =
                    senderBalance -
                    amount;


                const newRecipientBalance =
                    recipientBalance +
                    amount;


                // -----------------------------------------
                // UPDATE SENDER
                // -----------------------------------------

                transaction.update(
                    senderWalletRef,
                    {

                        balanceMCC:
                            newSenderBalance,

                        updatedAt:
                            FieldValue.serverTimestamp()

                    }
                );


                // -----------------------------------------
                // UPDATE RECIPIENT
                // -----------------------------------------

                transaction.update(
                    recipientWalletRef,
                    {

                        balanceMCC:
                            newRecipientBalance,

                        updatedAt:
                            FieldValue.serverTimestamp()

                    }
                );


                // -----------------------------------------
                // SENDER TRANSACTION
                // -----------------------------------------

                const senderTransactionRef =
                    db.collection(
                        "walletTransactions"
                    ).doc();


                transaction.set(
                    senderTransactionRef,
                    {

                        userId:
                            senderUid,

                        walletId:
                            senderData.walletId ||
                            "",

                        type:
                            "debit",

                        amount:
                            amount,

                        currency:
                            "MCC",

                        description:
                            "MCC Transfer Sent",

                        method:
                            "wallet",

                        recipientUserId:
                            recipientUid,

                        recipientWalletId:
                            recipientWalletId,

                        status:
                            "completed",

                        reference:
                            transferReference,

                        createdAt:
                            FieldValue.serverTimestamp()

                    }
                );


                // -----------------------------------------
                // RECIPIENT TRANSACTION
                // -----------------------------------------

                const recipientTransactionRef =
                    db.collection(
                        "walletTransactions"
                    ).doc();


                transaction.set(
                    recipientTransactionRef,
                    {

                        userId:
                            recipientUid,

                        walletId:
                            recipientWalletId,

                        type:
                            "credit",

                        amount:
                            amount,

                        currency:
                            "MCC",

                        description:
                            "MCC Transfer Received",

                        method:
                            "wallet",

                        senderUserId:
                            senderUid,

                        senderWalletId:
                            senderData.walletId ||
                            "",

                        status:
                            "completed",

                        reference:
                            transferReference,

                        createdAt:
                            FieldValue.serverTimestamp()

                    }
                );

            }
        );


        // =================================================
        // SUCCESS
        // =================================================

        return {

            success:
                true,

            amount:
                amount,

            currency:
                "MCC",

            recipientWalletId:
                recipientWalletId,

            reference:
                transferReference,

            message:
                "MCC transfer completed successfully."

        };

    }
);

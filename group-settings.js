import { auth, db, storage } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =========================
// ELEMENTS
// =========================

const groupName =
    document.getElementById("groupName");

const groupPhoto =
    document.getElementById("groupPhoto");

const addMembersBtn =
    document.getElementById("addMembersBtn");

const viewMembersBtn =
    document.getElementById("viewMembersBtn");

const reportGroupBtn =
    document.getElementById("reportGroupBtn");

const leaveGroupBtn =
    document.getElementById("leaveGroupBtn");

const pinGroupBtn =
    document.getElementById("pinGroupBtn");

const pinGroupText =
    document.getElementById("pinGroupText");

const changePhotoBtn =
    document.getElementById("changePhotoBtn");

const groupPhotoInput =
    document.getElementById("groupPhotoInput");

const changeNameBtn =
    document.getElementById("changeNameBtn");


// =========================
// MUTE
// =========================

const muteGroupBtn =
    document.getElementById("muteGroupBtn");

const muteGroupText =
    document.getElementById("muteGroupText");


// =========================
// JOIN GROUP
// =========================

const joinGroupBtn =
    document.getElementById("joinGroupBtn");


// =========================
// URL
// =========================

const params =
    new URLSearchParams(window.location.search);

const groupId =
    params.get("groupId");


// =========================
// CURRENT USER
// =========================

let currentUser;


// =========================
// GROUP SETTINGS DOCUMENT
// =========================

function getSettingsRef() {

    return doc(
        db,
        "groupSettings",
        currentUser.uid + "_" + groupId
    );

}


// =========================
// AUTH
// =========================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";
        return;

    }

    currentUser = user;


    if (!groupId) {

        alert("Group not found");
        return;

    }


    const groupRef =
        doc(db, "groups", groupId);


    const groupSnap =
        await getDoc(groupRef);


    if (!groupSnap.exists()) {

        alert("Group does not exist");
        return;

    }


    const group =
        groupSnap.data();


    // =========================
    // GROUP NAME
    // =========================

    if (groupName) {

        groupName.textContent =
            group.name || "Group";

    }


    // =========================
    // GROUP PHOTO
    // =========================

    if (groupPhoto) {

        groupPhoto.src =
            group.photoURL ||
            "images/default-avatar.png";

    }


    // =========================
    // UPDATE SETTINGS
    // =========================

    await updatePinGroupButton();

    await updateMuteGroupButton();

    await updateJoinGroupButton();

});


// =====================================================
// PIN GROUP
// =====================================================

async function updatePinGroupButton() {

    if (!currentUser || !groupId) return;


    const settingsRef =
        getSettingsRef();


    const settingsSnap =
        await getDoc(settingsRef);


    const pinned =
        settingsSnap.exists() &&
        settingsSnap.data().pinned === true;


    if (pinGroupText) {

        pinGroupText.textContent =
            pinned
                ? "Unpin Group"
                : "Pin Group";

    }

}


if (pinGroupBtn) {

    pinGroupBtn.onclick = async () => {

        if (!currentUser) return;


        try {

            const settingsRef =
                getSettingsRef();


            const settingsSnap =
                await getDoc(settingsRef);


            const currentlyPinned =
                settingsSnap.exists() &&
                settingsSnap.data().pinned === true;


            const newPinnedState =
                !currentlyPinned;


            await setDoc(
                settingsRef,
                {
                    pinned: newPinnedState
                },
                {
                    merge: true
                }
            );


            if (pinGroupText) {

                pinGroupText.textContent =
                    newPinnedState
                        ? "Unpin Group"
                        : "Pin Group";

            }


            alert(
                newPinnedState
                    ? "Group pinned successfully."
                    : "Group unpinned successfully."
            );


        } catch (error) {

            console.error(
                "Pin group error:",
                error
            );

            alert(
                "Unable to update group pin."
            );

        }

    };

}


// =====================================================
// MUTE NOTIFICATIONS
// =====================================================

async function updateMuteGroupButton() {

    if (!currentUser || !groupId) return;


    const settingsRef =
        getSettingsRef();


    const settingsSnap =
        await getDoc(settingsRef);


    const muted =
        settingsSnap.exists() &&
        settingsSnap.data().muted === true;


    if (muteGroupText) {

        muteGroupText.textContent =
            muted
                ? "Unmute Notifications"
                : "Mute Notifications";

    }

}


if (muteGroupBtn) {

    muteGroupBtn.onclick = async () => {

        if (!currentUser) return;


        try {

            const settingsRef =
                getSettingsRef();


            const settingsSnap =
                await getDoc(settingsRef);


            const currentlyMuted =
                settingsSnap.exists() &&
                settingsSnap.data().muted === true;


            const newMutedState =
                !currentlyMuted;


            await setDoc(
                settingsRef,
                {
                    muted: newMutedState
                },
                {
                    merge: true
                }
            );


            if (muteGroupText) {

                muteGroupText.textContent =
                    newMutedState
                        ? "Unmute Notifications"
                        : "Mute Notifications";

            }


            alert(
                newMutedState
                    ? "Group notifications muted 🔕"
                    : "Group notifications unmuted 🔔"
            );


        } catch (error) {

            console.error(
                "Mute group error:",
                error
            );

            alert(
                "Unable to change notification settings."
            );

        }

    };

}
// =====================================================
// JOIN GROUP
// =====================================================

async function updateJoinGroupButton() {

    if (!currentUser || !groupId) return;


    const groupRef =
        doc(db, "groups", groupId);


    const groupSnap =
        await getDoc(groupRef);


    if (!groupSnap.exists()) return;


    const group =
        groupSnap.data();


    const members =
        Array.isArray(group.members)
            ? group.members
            : [];


    const alreadyMember =
        members.includes(currentUser.uid);


    if (!joinGroupBtn) return;


    const span =
        joinGroupBtn.querySelector("span");


    if (alreadyMember) {

        if (span) {

            span.textContent =
                "Joined Group";

        }


        joinGroupBtn.disabled =
            true;

        joinGroupBtn.style.opacity =
            "0.6";

    } else {

        if (span) {

            span.textContent =
                "Join Group";

        }


        joinGroupBtn.disabled =
            false;

        joinGroupBtn.style.opacity =
            "1";

    }

}


if (joinGroupBtn) {

    joinGroupBtn.onclick =
        async () => {

            if (!currentUser) {

                alert(
                    "Please login first."
                );

                return;

            }


            try {

                const groupRef =
                    doc(
                        db,
                        "groups",
                        groupId
                    );


                const groupSnap =
                    await getDoc(groupRef);


                if (!groupSnap.exists()) {

                    alert(
                        "Group does not exist."
                    );

                    return;

                }


                const group =
                    groupSnap.data();


                const members =
                    Array.isArray(
                        group.members
                    )
                        ? group.members
                        : [];


                // =========================
                // ALREADY A MEMBER
                // =========================

                if (
                    members.includes(
                        currentUser.uid
                    )
                ) {

                    alert(
                        "You are already a member of this group."
                    );

                    await updateJoinGroupButton();

                    return;

                }


                // =========================
                // JOIN GROUP
                // =========================
                //
                // Add user back to members
                // AND remove them from
                // formerMembers.
                //

                await updateDoc(
                    groupRef,
                    {

                        members:
                            arrayUnion(
                                currentUser.uid
                            ),

                        formerMembers:
                            arrayRemove(
                                currentUser.uid
                            )

                    }
                );


                // =========================
                // UPDATE BUTTON
                // =========================

                await updateJoinGroupButton();


                alert(
                    "You joined the group successfully! 🎉"
                );


            } catch (error) {

                console.error(
                    "Join group error:",
                    error
                );


                alert(
                    "Unable to join group. Please try again."
                );

            }

        };

}
            

// =====================================================
// ADD MEMBERS
// =====================================================

if (addMembersBtn) {

    addMembersBtn.onclick = () => {

        location.href =
            `add-group-members.html?groupId=${groupId}`;

    };

}


// =====================================================
// VIEW MEMBERS
// =====================================================

if (viewMembersBtn) {

    viewMembersBtn.onclick = () => {

        location.href =
            `group-members.html?groupId=${groupId}`;

    };

}


// =====================================================
// REPORT GROUP
// =====================================================

if (reportGroupBtn) {

    reportGroupBtn.onclick = async () => {

        const reason =
            prompt(
                "Why are you reporting this group?"
            );


        if (!reason) return;


        try {

            await addDoc(
                collection(db, "reports"),
                {

                    type: "group",

                    groupId: groupId,

                    reporterId:
                        currentUser.uid,

                    reason:
                        reason.trim(),

                    createdAt:
                        serverTimestamp()

                }
            );


            alert(
                "Group reported successfully"
            );


        } catch (error) {

            console.error(
                "Report group error:",
                error
            );

            alert(
                "Unable to report group."
            );

        }

    };

}


// =====================================================
// LEAVE GROUP
// =====================================================

if (leaveGroupBtn) {

    leaveGroupBtn.onclick = async () => {

        if (!currentUser) {
            alert("Please login first.");
            return;
        }

        const confirmLeave = confirm(
            "Are you sure you want to leave this group?"
        );

        if (!confirmLeave) return;

        try {

            const groupRef = doc(
                db,
                "groups",
                groupId
            );

            const groupSnap = await getDoc(groupRef);

            if (!groupSnap.exists()) {

                alert("Group does not exist.");
                return;

            }

            const group = groupSnap.data();

            const members = Array.isArray(group.members)
                ? group.members
                : [];

            // Make sure the user is currently a member
            if (!members.includes(currentUser.uid)) {

                alert("You are not currently a member of this group.");
                return;

            }

            // Remove the user from active members
            // but keep the user connected to the group
            // through formerMembers.
            await updateDoc(
                groupRef,
                {
                    members: arrayRemove(currentUser.uid),

                    formerMembers:
                        arrayUnion(currentUser.uid)
                }
            );

            alert(
                "You left the group successfully."
            );

            location.href = "chats.html";

        } catch (error) {

            console.error(
                "Leave group error:",
                error
            );

            alert(
                "Unable to leave the group. Please try again."
            );

        }

    };

}

// =====================================================
// CHANGE GROUP NAME
// =====================================================

if (changeNameBtn) {

    changeNameBtn.onclick = async () => {

        const newName =
            prompt(
                "Enter new group name"
            );


        if (
            !newName ||
            newName.trim() === ""
        ) {

            return;

        }


        try {

            await updateDoc(
                doc(db, "groups", groupId),
                {
                    name:
                        newName.trim()
                }
            );


            alert(
                "Group name updated ✅"
            );


            location.reload();


        } catch (error) {

            console.error(
                "Change name error:",
                error
            );

            alert(
                "Unable to change group name."
            );

        }

    };

}


// =====================================================
// CHANGE GROUP PHOTO
// =====================================================

if (changePhotoBtn) {

    changePhotoBtn.onclick = () => {

        groupPhotoInput.click();

    };

}


if (groupPhotoInput) {

    groupPhotoInput.onchange =
        async (event) => {

            const file =
                event.target.files[0];


            if (!file) return;


            try {

                const imageRef =
                    ref(
                        storage,
                        "groupPhotos/" +
                        groupId
                    );


                await uploadBytes(
                    imageRef,
                    file
                );


                const photoURL =
                    await getDownloadURL(
                        imageRef
                    );


                console.log(
                    "Uploaded:",
                    photoURL
                );


                await updateDoc(
                    doc(
                        db,
                        "groups",
                        groupId
                    ),
                    {
                        photoURL:
                            photoURL
                    }
                );


                alert(
                    "Group photo updated ✅"
                );


                location.reload();


            } catch (error) {

                console.error(
                    "Photo upload error:",
                    error
                );


                alert(
                    "Photo upload failed"
                );

            }

        };

}

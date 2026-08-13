import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
 

// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================================
// SEARCH
// =====================================================

let searchTimer = null;

searchInput.addEventListener("input", () => {

    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
        performSearch();
    }, 250);

});


// =====================================================
// PERFORM SEARCH
// =====================================================

async function performSearch() {

    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    searchResults.innerHTML = "";


    // Nothing typed
    if (!searchText) {
        return;
    }


    // Loading message
    searchResults.innerHTML = `
        <div class="search-message">
            Searching...
        </div>
    `;


    try {

        // =================================================
        // GET USERS
        // =================================================

        const usersSnapshot =
            await getDocs(
                collection(db, "users")
            );


        // =================================================
        // GET POSTS
        // =================================================

        const postsSnapshot =
            await getDocs(
                collection(db, "posts")
            );


        searchResults.innerHTML = "";


        let userFound = false;
        let postFound = false;


        // =================================================
        // USERS SECTION
        // =================================================

        const userTitle =
            document.createElement("h3");

        userTitle.textContent = "Accounts";

        userTitle.className = "search-section-title";


        const usersContainer =
            document.createElement("div");

        usersContainer.className =
            "search-users";


        usersSnapshot.forEach((userDoc) => {

            const user = userDoc.data();


            const username =
                String(user.username || "")
                    .toLowerCase();

            const name =
                String(user.name || "")
                    .toLowerCase();


            // Search username OR name
            if (
                username.includes(searchText) ||
                name.includes(searchText)
            ) {

                userFound = true;


                const result =
                    document.createElement("a");

                result.className =
                    "search-user-result";


                result.href =
                    `user.html?uid=${encodeURIComponent(userDoc.id)}`;


                const photo =
                    user.photoURL ||
                    "images/default-avatar.png";


                result.innerHTML = `

                    <img
                        src="${escapeHTML(photo)}"
                        class="search-user-photo"
                        onerror="this.src='images/default-avatar.png'"
                    >

                    <div class="search-user-info">

                        <strong>
                            ${escapeHTML(
                                user.name ||
                                user.username ||
                                "User"
                            )}
                        </strong>

                        ${
                            user.username
                            ? `
                                <small>
                                    @${escapeHTML(user.username)}
                                </small>
                              `
                            : ""
                        }

                    </div>

                `;


                usersContainer.appendChild(result);

            }

        });


        // Add Accounts section only if users found
        if (userFound) {

            searchResults.appendChild(userTitle);

            searchResults.appendChild(
                usersContainer
            );

        }


        // =================================================
        // POSTS SECTION
        // =================================================

        const postsTitle =
            document.createElement("h3");

        postsTitle.textContent = "Posts";

        postsTitle.className =
            "search-section-title";


        const postsContainer =
            document.createElement("div");

        postsContainer.className =
            "search-posts";


        postsSnapshot.forEach((postDoc) => {

            const post =
                postDoc.data();


            const content =
                String(post.content || "")
                    .toLowerCase();


            const username =
                String(post.username || "")
                    .toLowerCase();


            // Search post content OR username
            if (
                content.includes(searchText) ||
                username.includes(searchText)
            ) {

                postFound = true;


                const result =
                    document.createElement("a");


                result.className =
                    "search-post-result";


                result.href =
                    `post.html?id=${encodeURIComponent(postDoc.id)}`;


                const originalContent =
                    post.content || "";


                const preview =
                    originalContent.length > 120
                    ? originalContent.substring(0, 120) + "..."
                    : originalContent;


                result.innerHTML = `

                    <div class="search-post-icon">
                        <i class="fa-solid fa-file-lines"></i>
                    </div>

                    <div class="search-post-info">

                        <p>
                            ${escapeHTML(preview)}
                        </p>

                        <small>
                            ${
                                post.username
                                ? `by ${escapeHTML(post.username)}`
                                : "Post"
                            }
                        </small>

                    </div>

                `;


                postsContainer.appendChild(result);

            }

        });


        // Add Posts section
        if (postFound) {

            searchResults.appendChild(postsTitle);

            searchResults.appendChild(
                postsContainer
            );

        }


        // =================================================
        // NOTHING FOUND
        // =================================================

        if (!userFound && !postFound) {

            searchResults.innerHTML = `

                <div class="search-message">

                    <i class="fa-solid fa-magnifying-glass"></i>

                    <p>
                        No accounts or posts found.
                    </p>

                </div>

            `;

        }


    } catch (error) {

        console.error(
            "❌ Search error:",
            error
        );


        searchResults.innerHTML = `

            <div class="search-message">

                <i class="fa-solid fa-circle-exclamation"></i>

                <p>
                    Search failed. Please try again.
                </p>

            </div>

        `;

    }

}

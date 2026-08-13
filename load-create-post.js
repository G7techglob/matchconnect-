// ======================================
// LOAD CREATE POST COMPONENT
// ======================================

const createPostContainer =
    document.getElementById("create-post-container");

if (createPostContainer) {

    fetch("create-post.html")
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    "Failed to load create-post.html"
                );
            }

            return response.text();
        })

        .then(html => {

            // Insert Create Post HTML
            createPostContainer.innerHTML = html;


            // ======================================
            // LOAD CREATE POST CSS
            // ======================================

            if (!document.querySelector(
                'link[href="create-post.css"]'
            )) {

                const style =
                    document.createElement("link");

                style.rel = "stylesheet";
                style.href = "create-post.css";

                document.head.appendChild(style);
            }


            // ======================================
            // LOAD CREATE POST JAVASCRIPT
            // ======================================

            import("./create-post.js");

        })

        .catch(error => {

            console.error(
                "Create Post loading error:",
                error
            );

        });

}

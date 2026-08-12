console.log("Create Post JS is working");

const createPostBtn = document.getElementById("createPostBtn");
const mediaPostInput = document.getElementById("mediaPostInput");
const profilePostBtn = document.getElementById("profilePostBtn");
const profilePostContent = document.getElementById("profilePostContent");

// ===============================
// OPEN PHOTO / VIDEO SELECTOR
// ===============================

createPostBtn.addEventListener("click", () => {
    mediaPostInput.click();
});

// ===============================
// CHECK SELECTED MEDIA
// ===============================

mediaPostInput.addEventListener("change", () => {
    const files = mediaPostInput.files;

    if (!files || files.length === 0) {
        return;
    }

    console.log("Selected media:", files);

    for (const file of files) {
        console.log("File:", file.name, file.type);
    }
});

// ===============================
// POST BUTTON
// ===============================

profilePostBtn.addEventListener("click", () => {

    const text = profilePostContent.value.trim();
    const files = mediaPostInput.files;

    if (!text && (!files || files.length === 0)) {
        alert("Please write something or select a photo/video.");
        return;
    }

    console.log("Post button clicked");

    console.log("Text:", text);
    console.log("Media:", files);

});

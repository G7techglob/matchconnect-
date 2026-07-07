export function createChatId(uid1, uid2) {
    return [uid1, uid2].sort().join("_");
}

export function formatTime(timestamp) {
    if (!timestamp) return "";

    const date = timestamp.toDate();

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

export function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

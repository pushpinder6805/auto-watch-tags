import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  api.onPageChange(() => {
    const user = api.getCurrentUser();
    if (!user) return;

    // skip if already processed (per browser)
    if (localStorage.getItem("auto-watch-tags-" + user.id)) return;

    const fieldKey = "user_field_" + settings.state_user_field_id;
    const raw = user.custom_fields?.[fieldKey];

    if (!raw) return;

    const states = typeof raw === "string" ? raw.split("|") : raw;

    const tags = states
      .map((s) =>
        s
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "_")
      )
      .filter(Boolean);

    if (!tags.length) return;

    fetch("/tags/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document
          .querySelector('meta[name="csrf-token"]')
          ?.getAttribute("content"),
      },
      body: JSON.stringify({
        tags,
        notification_level: settings.notification_level,
      }),
    })
      .then(() => {
        localStorage.setItem("auto-watch-tags-" + user.id, "1");
        console.log("Auto-watched tags:", tags);
      })
      .catch((err) => console.warn("Tag watch failed", err));
  });
});

import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  const fieldKey = "user_field_" + settings.state_user_field_id;

  // ✅ expose custom field to frontend
  api.includeCurrentUserCustomFields(fieldKey);

  api.onPageChange(() => {
    const user = api.getCurrentUser();
    if (!user) return;

    if (localStorage.getItem("auto-watch-tags-" + user.id)) return;

    const raw = user.custom_fields?.[fieldKey];
    console.log("States raw:", raw);

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

    console.log("Tags:", tags);

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
        console.log("✅ Tags applied");
        localStorage.setItem("auto-watch-tags-" + user.id, "1");
      })
      .catch((err) => console.warn("❌ Tag watch failed", err));
  });
});

// /js/include.js

document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll("[data-include]");

  targets.forEach(el => {
    const url = el.getAttribute("data-include");
    if (!url) return;

    fetch(url)
      .then(res => res.text())
      .then(html => el.innerHTML = html)
      .catch(err => console.error("include error:", url, err));
  });
});

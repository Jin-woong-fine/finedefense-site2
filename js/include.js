// /js/include.js (Stable v3.0)

document.addEventListener("DOMContentLoaded", async () => {
  const includeTargets = document.querySelectorAll("[data-include]");

  if (includeTargets.length === 0) {
    // include할 게 없으면 바로 완료 이벤트
    document.dispatchEvent(new Event("include:loaded"));
    return;
  }

  // admin-session-bar을 항상 최우선 로드
  const sortedTargets = Array.from(includeTargets).sort((a, b) => {
    const aIsAdmin = a.getAttribute("data-include").includes("admin-session-bar");
    const bIsAdmin = b.getAttribute("data-include").includes("admin-session-bar");
    return bIsAdmin - aIsAdmin; // admin 먼저
  });

  // include 완료 카운트
  let loadedCount = 0;

  for (const el of sortedTargets) {
    const url = el.getAttribute("data-include");
    if (!url) continue;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${url}`);

      const html = await res.text();

      // temp container 사용
      const temp = document.createElement("div");
      temp.innerHTML = html;

      // 요소 삽입
      while (temp.firstChild) {
        el.parentNode.insertBefore(temp.firstChild, el);
      }

      // placeholder 제거
      el.remove();

      // admin-session-bar 감지 후 body class 추가
      if (url.includes("admin-session-bar")) {
        document.body.classList.add("has-admin-bar");
      }

    } catch (err) {
      console.error(`include load error: ${url}`, err);
    }

    loadedCount++;
  }

  // 모든 include가 끝날 때까지 완전히 DOM 안정화
  const waitDomStable = () =>
    new Promise((resolve) => requestAnimationFrame(() => resolve()));

  await waitDomStable();

  // 모든 include가 완전히 끝난 후 이벤트 발생
  document.dispatchEvent(new Event("include:loaded"));
});

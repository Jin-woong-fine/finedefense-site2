// ===========================================================
// 🔥 글로벌 세션 관리자 (홈페이지 + 관리자대시보드 통합)
// ===========================================================

console.log("[session_manager] loaded");

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token, exp) {
  localStorage.setItem("token", token);
  localStorage.setItem("token_exp", exp); // exp 는 UNIX timestamp
}

export function getExpireTime() {
  return Number(localStorage.getItem("token_exp"));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("token_exp");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
}

// ===========================================================
// 🔄 서버에 연장 요청
// ===========================================================
export async function extendSession() {
  const token = getToken();

  const res = await fetch("/api/auth/extend", {
    method: "POST",
    headers: { Authorization: "Bearer " + token }
  });

  const out = await res.json();

  if (res.ok && out.token) {
    setToken(out.token, out.exp);
    return true;
  }
  return false;
}

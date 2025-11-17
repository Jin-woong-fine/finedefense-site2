// /kr/admin/js/common_auth.js

(function () {
  const tokenKey = "token";
  const roleKey = "role";

  window.requireAdmin = function () {
    const token = localStorage.getItem(tokenKey);
    const role = localStorage.getItem(roleKey);

    if (!token || role !== "admin") {
      alert("로그인이 필요합니다.");
      location.href = "/kr/admin/login.html";
    }
  };

  window.logout = function () {
    localStorage.clear();
    location.href = "/kr/admin/login.html";
  };
})();

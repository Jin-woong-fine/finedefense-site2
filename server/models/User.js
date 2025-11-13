// 단순 구조 설명용 (DB 직접 쿼리로 사용)
export const UserSchema = {
  id: "INT AUTO_INCREMENT PRIMARY KEY",
  username: "VARCHAR(50)",
  password: "VARCHAR(255)",
  name: "VARCHAR(50)",
  role: "ENUM('admin','user') DEFAULT 'user'",
  created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP"
};

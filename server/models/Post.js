export const PostSchema = {
  id: "INT AUTO_INCREMENT PRIMARY KEY",
  category: "ENUM('notice','news','gallery')",
  title: "VARCHAR(255)",
  content: "TEXT",
  author_id: "INT",
  image: "VARCHAR(255)",
  created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  updated_at: "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
};

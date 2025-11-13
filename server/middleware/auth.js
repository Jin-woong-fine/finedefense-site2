import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// 토큰 검증 미들웨어
export function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token provided" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 토큰 정보 저장
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

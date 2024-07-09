import jwt from 'jsonwebtoken'

const authenticateToken = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access Denied" });

    jwt.verify(token, process.env.JWT_SECRECT, (err, user) => {
      if (err) return res.status(403).json({ message: "Invalid Token" });
      req.user = user;
      next();
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
    console.log(err);
  }
};

export default authenticateToken;

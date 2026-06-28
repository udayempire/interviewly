import { type Request, type Response, type NextFunction } from "express";
import { verify, type JwtPayload } from "jsonwebtoken";

interface AuthPayload extends JwtPayload {
    userId: string
}

export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        };
        const jwtToken = authHeader.split(" ")[1];
        if (!jwtToken) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const decoded = verify(jwtToken, process.env.JWT_SECRET!) as unknown as AuthPayload;
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        };
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or Expired token"
        });
    };
};


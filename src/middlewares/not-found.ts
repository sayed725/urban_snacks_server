import { Request, Response } from "express";

const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "API Not Found!",
    path: req.originalUrl,
  });
};

export default notFound;

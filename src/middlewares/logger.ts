import { NextFunction, Request, Response } from "express";

const logger = (req: Request, res: Response, next: NextFunction) => {
  const time = new Date().toLocaleString();
  const method = req.method.padEnd(6);
  const url = req.originalUrl.padEnd(30);
  const status = `${res.statusCode}`.padEnd(3);

  console.log(`${time} | ${status} - ${method} ${url}`);

  next();
};

export default logger;

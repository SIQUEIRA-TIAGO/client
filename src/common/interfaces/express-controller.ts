import { Request, Response } from 'express';

export interface IExpressController {
    [key: string]: (req: Request, res: Response) => Promise<void>;
}
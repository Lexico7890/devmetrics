import { User } from '@devmetrics/database';

declare global {
  namespace Express {
    interface Request {
      user?: User | any;
    }
  }
}

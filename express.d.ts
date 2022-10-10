import { UserModel } from "./models/User";

declare namespace Express {
  export interface Request {
    user: UserModel;
  }
}

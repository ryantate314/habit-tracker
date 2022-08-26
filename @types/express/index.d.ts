import { UserPrinciple } from "../../src/models/user-principle.model";

declare global {
   namespace Express {
      interface Request {
         user?: UserPrinciple;
      }
   }
}
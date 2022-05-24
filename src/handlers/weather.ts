import { returnResponse } from "./return";

export const myhandler = () => {
  // this is my code, this is my destiny\

  return returnResponse({});
}

export const handler = myhandler;
// utils/username.js
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator";

export const generateRandomUsername = () => {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    style: "lowerCase",
  });
};

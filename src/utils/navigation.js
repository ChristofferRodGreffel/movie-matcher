// navigation.js
let navigate;

export const setNavigate = (navFn) => {
  navigate = navFn;
};

export const getNavigate = () => {
  if (!navigate) {
    throw new Error("Navigate function is not set yet.");
  }
  return navigate;
};

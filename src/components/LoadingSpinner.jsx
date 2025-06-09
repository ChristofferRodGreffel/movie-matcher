import { CgSpinner } from "react-icons/cg";

const LoadingSpinner = ({ size = "h-4 w-4" }) => {
  return <CgSpinner className={`animate-spin text-theme-primary ${size}`} />;
};

export default LoadingSpinner;

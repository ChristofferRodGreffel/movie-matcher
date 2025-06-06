import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
      <Link to="/configure">Create session</Link>
      <Link to="/join">Join session</Link>
    </div>
  );
};

export default Home;
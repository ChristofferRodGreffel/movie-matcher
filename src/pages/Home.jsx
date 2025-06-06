import React from "react";
import { getNavigate } from "../utils/navigation";

const Home = () => {
  return (
    <div>
      <button onClick={() => getNavigate()("/create")}>Create session</button>
      <button onClick={() => getNavigate()("/join")}>Join session</button>
    </div>
  );
};

export default Home;

import React from "react";
import Sidebar from "../components/sideNav";
import Dashboard from "../components/Dashboard";
import withAdminAuth from "../utils/withAdminAuth";
import { BrowserRouter } from "react-router-dom";

const Home = () => {
  return (
    <BrowserRouter>
      <Sidebar />
      <Dashboard />
    </BrowserRouter>
  );
};

export default withAdminAuth(Home);

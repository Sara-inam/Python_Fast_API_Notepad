import React from "react";
import { useNavigate } from "react-router-dom";

function Navbar({ loggedIn, onLogout }) {
  const navigate = useNavigate();

  return (
    <nav className="bg-gray-800 text-white p-5 shadow-md flex justify-between items-center">
      <h1
        className="font-extrabold text-2xl cursor-pointer hover:text-gray-300 transition"
        onClick={() => navigate("/")}
      >
        Notepad
      </h1>
      <div className="flex items-center space-x-4">
        {!loggedIn && (
          <>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-white text-gray-800 font-semibold rounded-lg shadow hover:bg-gray-100 transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-4 py-2 bg-white text-gray-800 font-semibold rounded-lg shadow hover:bg-gray-100 transition"
            >
              Signup
            </button>
          </>
        )}
        {loggedIn && (
          <button
            onClick={() => { onLogout(); navigate("/"); }}
            className="px-4 py-2 bg-white text-gray-800 font-semibold rounded-lg shadow hover:bg-gray-100 transition"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

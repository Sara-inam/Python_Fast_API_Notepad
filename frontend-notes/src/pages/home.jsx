import React from "react";

function Home() {
  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-100 to-gray-300">
      <div className="bg-white bg-opacity-95 backdrop-blur-md p-16 rounded-3xl shadow-lg text-center max-w-lg">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-4">
          Welcome to Notepad
        </h1>
        <p className="text-lg text-gray-700">
          Your personal place to save notes safely and easily.
        </p>
        <button
          onClick={() => window.location.href = "/login"}
          className="mt-6 px-6 py-3 bg-gray-800 text-white font-bold rounded-lg shadow hover:bg-gray-900 transition"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default Home;

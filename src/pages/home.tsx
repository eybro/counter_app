import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useProfile } from "../useProfile";
import { Menu, X } from "lucide-react";

export default function CounterApp() {
  const { profile, loading } = useProfile();
  const [count, setCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile || loading) return;

    const newSocket = io(import.meta.env.VITE_REACT_APP_API_URL, {
      query: { organizationId: profile.organization_id },
    });

    newSocket.on("updateCounter", (newCount) => {
      setCount(newCount);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [profile, loading]);

  const handleLogout = async () => {
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/users/logout`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to log out. Please try again.");
      }
      
      window.location.href = "/login";
    } catch (error) {
      console.error("Error logging out:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  if (loading) return <p className="text-center text-2xl">Loading...</p>;

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-12 relative">

      <button
        onClick={() => setSidebarOpen(true)}
        className="absolute top-5 left-5 p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition"
      >
        <Menu className="w-6 h-6" />
      </button>


      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform flex flex-col justify-between ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition"
        >
          <X className="w-6 h-6" />
        </button>


        <div className="p-6">
          <h2 className="text-2xl font-semibold">Menu</h2>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>


        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full px-6 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>


      <h1 className="text-4xl font-bold">{profile?.venueName} count</h1>
      <p className="text-9xl font-semibold">{count}</p>
      <div className="flex gap-10 mt-10">
        <button
          onClick={() => socket?.emit("increment", profile?.organization_id)}
          className="w-24 h-24 text-5xl bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition"
        >
          +
        </button>
        <button
          onClick={() => socket?.emit("decrement", profile?.organization_id)}
          disabled={count === 0}
          className={`w-24 h-24 text-5xl rounded-full shadow-lg transition 
          ${
            count === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          -
        </button>
      </div>
      <button
        onClick={() => {
          if (window.confirm("Are you sure you want to reset the counter?")) {
            socket?.emit("reset", profile?.organization_id);
          }
        }}
        className="mt-12 px-8 py-4 text-xl bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition"
      >
        Reset
      </button>
    </div>
  );
}

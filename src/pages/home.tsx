import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useProfile } from "../useProfile";

export default function CounterApp() {
  const { profile, loading } = useProfile();
  const [count, setCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!profile || loading) return;

    const newSocket = io( import.meta.env.VITE_REACT_APP_API_URL, {
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

  if (loading) return <p className="text-center text-2xl">Loading...</p>;

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-12">
      <h1 className="text-4xl font-bold">Shared Counter</h1>
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
    ${count === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`}
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

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useProfile } from "../useProfile";
import { Menu, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";


export default function CounterApp() {
  const { profile, loading } = useProfile();
  const [memberCount, setMemberCount] = useState(0);
  const [nonMemberCount, setNonMemberCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [isVisible, setIsVisible] = useState(true);


  useEffect(() => {
    if (!profile || loading) return;

    const newSocket = io(import.meta.env.VITE_REACT_APP_API_URL, {
      query: { organizationId: profile.organization_id },
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true); 
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false); 
    });

    newSocket.on("updateCounter", ({ memberCount, nonMemberCount }) => {
      setMemberCount(memberCount);
      setNonMemberCount(nonMemberCount);
    });

    newSocket.on("updateVisibility", (visible: boolean) => {
      setIsVisible(visible);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [profile, loading]);

  const handleIncrement = (type: "member" | "nonMember") => {
    socket?.emit("increment", {
      organizationId: profile?.organization_id,
      type,
    });
  };

  const handleDecrement = (type: "member" | "nonMember") => {
    socket?.emit("decrement", {
      organizationId: profile?.organization_id,
      type,
    });
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the counter?")) {
      socket?.emit("reset", { organizationId: profile?.organization_id });
    }
  };

  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    socket?.emit("toggleVisibility", newVisibility);
  };

  const totalCount = memberCount + nonMemberCount;

  if (loading) return <p className="text-center text-2xl">Loading...</p>;

  return (

    <div className="flex flex-col items-center justify-center h-screen gap-2 relative">
      {!isConnected && (
        <div className="absolute top-20 p-4 bg-red-500 text-white rounded-md">
          Connection Lost, reconnecting...
        </div>
      )}
      <button
        onClick={() => setSidebarOpen(true)}
        className="absolute top-5 left-5 p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform flex flex-col justify-between ${
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

        <div className="p-4 flex flex-col gap-4">

        <div className="p-4 flex items-center gap-4">
  <span className="text-xl font-medium">Show count</span>
  <Switch
    checked={isVisible}
    onCheckedChange={toggleVisibility}
    className="scale-150 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
  />
</div>
          <button
            onClick={handleReset}
            className="w-full px-6 py-3 text-lg bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition"
          >
            Reset
          </button>

          <button
            onClick={() => {
              fetch(
                `${import.meta.env.VITE_REACT_APP_API_URL}/api/users/logout`,
                {
                  method: "POST",
                  credentials: "include",
                },
              ).then(() => (window.location.href = "/login"));
            }}
            className="w-full px-6 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <h1 className="absolute top-5 text-3xl font-bold">
        {profile?.venueName} Count
      </h1>

      <p className="text-7xl font-semibold md:text-8xl">{totalCount}</p>


      <div className="flex flex-col gap-6 mt-6">
        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-semibold">Members</h2>
          <p className="text-7xl font-bold">{memberCount}</p>
          <div className="flex gap-8 mt-4">
            <button
              onClick={() => handleIncrement("member")}
              className="w-24 h-24 text-4xl bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition"
            >
              +
            </button>
            <button
              onClick={() => handleDecrement("member")}
              disabled={memberCount === 0}
              className={`w-24 h-24 text-4xl rounded-full shadow-lg transition ${
                memberCount === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              -
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-semibold">Non-Members</h2>
          <p className="text-7xl font-bold">{nonMemberCount}</p>
          <div className="flex gap-8 mt-4">
            <button
              onClick={() => handleIncrement("nonMember")}
              className="w-24 h-24 text-4xl bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition"
            >
              +
            </button>
            <button
              onClick={() => handleDecrement("nonMember")}
              disabled={nonMemberCount === 0}
              className={`w-24 h-24 text-4xl rounded-full shadow-lg transition ${
                nonMemberCount === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              -
            </button>
          </div>
        </div>
      </div>
    </div>

  );
}

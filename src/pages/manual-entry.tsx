import { FormEvent, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../useProfile";
import { Switch } from "@/components/ui/switch";

export default function ManualEntry() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [nonMemberCount, setNonMemberCount] = useState(0);
  const [memberInput, setMemberInput] = useState("0");
  const [nonMemberInput, setNonMemberInput] = useState("0");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isRatioVisible, setIsRatioVisible] = useState(true);
  const [maxCapacity, setMaxCapacity] = useState<number | null>(null);
  const [tempCapacity, setTempCapacity] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedLineLength, setSelectedLineLength] = useState<"short" | "medium" | "long" | "no_line">("no_line");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile || loading) return;

    const newSocket = io(import.meta.env.VITE_REACT_APP_API_URL, {
      query: { venueId: profile.venueId },
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("updateCounter", ({ memberCount, nonMemberCount }) => {
      setMemberCount(memberCount);
      setNonMemberCount(nonMemberCount);
    });

    newSocket.on("updateVisibility", (visible: boolean) => {
      setIsVisible(visible);
    });

    newSocket.on("updateLineLength", (lineLength: "short" | "medium" | "long" | "no_line") => {
      setSelectedLineLength(lineLength);
    });

    newSocket.on("updateRatioVisibility", (visible: boolean) => {
      setIsRatioVisible(visible);
    });

    newSocket.on("updateMaxCapacity", (value: number) => {
      setMaxCapacity(value);
      setTempCapacity(value);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [profile, loading]);

  useEffect(() => {
    setMemberInput(String(memberCount));
  }, [memberCount]);

  useEffect(() => {
    setNonMemberInput(String(nonMemberCount));
  }, [nonMemberCount]);

  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);

    if (isRatioVisible) {
      setIsRatioVisible(false);
      socket?.emit("toggleRatioVisibility", false);
    }

    socket?.emit("toggleVisibility", newVisibility);
  };

  const toggleRatioVisibility = () => {
    const newVisibility = !isRatioVisible;
    setIsRatioVisible(newVisibility);

    if (!isVisible) {
      setIsVisible(true);
      socket?.emit("toggleVisibility", true);
    }

    socket?.emit("toggleRatioVisibility", newVisibility);
  };

  const handleMaxCapacity = (newMaxCapacity: number | null) => {
    const value = newMaxCapacity ?? 0;
    setMaxCapacity(value);
    socket?.emit("updateMaxCapacity", value);
  };

  const handleConfirm = () => {
    setMaxCapacity(tempCapacity);
    setShowConfirm(false);
    handleMaxCapacity(tempCapacity);
    setShowPopup(true);

    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleLineLength = (lineLength: "short" | "medium" | "long" | "no_line") => {
    setSelectedLineLength(lineLength);
    socket?.emit("updateLineLength", lineLength);

    if (lineLength !== "no_line") {
      setIsVisible(false);
      setIsRatioVisible(false);
      socket?.emit("toggleVisibility", false);
      socket?.emit("toggleRatioVisibility", false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the counter?")) {
      socket?.emit("reset", { organizationId: profile?.organization_id });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");
    setError("");

    if (!socket || !profile) {
      setError("Could not update counts. Please wait for connection.");
      return;
    }

    const nextMemberCount = Number(memberInput);
    const nextNonMemberCount = Number(nonMemberInput);

    if (
      Number.isNaN(nextMemberCount) ||
      Number.isNaN(nextNonMemberCount) ||
      nextMemberCount < 0 ||
      nextNonMemberCount < 0 ||
      !Number.isInteger(nextMemberCount) ||
      !Number.isInteger(nextNonMemberCount)
    ) {
      setError("Use whole numbers that are 0 or higher.");
      return;
    }

    socket.emit("setCounter", {
      memberCount: nextMemberCount,
      nonMemberCount: nextNonMemberCount,
    });
    setStatusMessage("Manual update sent.");
  };

  if (loading) return <p className="text-center text-2xl">Loading...</p>;

  return (
    <div className="relative flex min-h-screen flex-col items-center gap-4 pt-16 sm:pt-20 px-4">
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
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 flex flex-col gap-4">
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">Line length</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleLineLength("short")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedLineLength === "short"
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  Short
                </button>
                <button
                  onClick={() => handleLineLength("medium")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedLineLength === "medium"
                      ? "bg-yellow-400 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => handleLineLength("long")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedLineLength === "long"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  Long
                </button>
                <button
                  onClick={() => handleLineLength("no_line")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedLineLength === "no_line"
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  Don’t display
                </button>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-2">
              <label htmlFor="maxCapacity" className="text-xl font-medium">
                Max Capacity
              </label>
              <input
                id="maxCapacity"
                type="number"
                value={tempCapacity === null ? "" : tempCapacity}
                onChange={(event) => {
                  const raw = event.target.value;

                  if (raw === "") {
                    setTempCapacity(null);
                  } else {
                    const value = Math.max(0, Number(raw));
                    setTempCapacity(value);
                  }

                  setShowConfirm(true);
                }}
                className="w-full p-2 border rounded-lg text-lg"
                placeholder="Enter max capacity"
              />

              {showConfirm && (
                <button
                  onClick={handleConfirm}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Confirm
                </button>
              )}

              {showPopup && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
                  Capacity updated to {maxCapacity}!
                </div>
              )}
            </div>

            <div className="p-4 flex items-center gap-4">
              <span className="text-xl font-medium w-42">Show capacity</span>
              <Switch
                checked={isVisible}
                onCheckedChange={toggleVisibility}
                disabled={selectedLineLength !== "no_line"}
                className="scale-150 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
            </div>

            <div className="p-4 flex items-center gap-4">
              <span className="text-xl font-medium w-42">Show 50/50 ratio</span>
              <Switch
                checked={isRatioVisible}
                onCheckedChange={toggleRatioVisibility}
                disabled={selectedLineLength !== "no_line"}
                className="scale-150 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
            </div>

          <button
            onClick={() => {
              setSidebarOpen(false);
              navigate("/home");
            }}
            className="w-full px-6 py-3 text-lg bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
          >
            Back to Counter
          </button>

          <button
            onClick={handleReset}
            className="w-full px-6 py-3 text-lg bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition"
          >
            Reset
          </button>

          <button
            onClick={() => {
              fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/users/logout`, {
                method: "POST",
                credentials: "include",
              }).then(() => (window.location.href = "/login"));
            }}
            className="w-full px-6 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
          >
            Logout
          </button>
          </div>
        </div>
      </div>

      {!isVisible && selectedLineLength === "no_line" && (
        <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 flex items-center rounded-xl bg-orange-500 px-4 py-2 pl-1 text-[11px] sm:text-base font-semibold text-white shadow-md max-w-[65vw] truncate">
          <span>Not visible on pubquery.se—toggle in menu</span>
        </div>
      )}

      <h1 className="text-2xl font-bold sm:text-3xl text-center">Manual Count Entry</h1>
      <p className="text-lg text-gray-600 text-center">{profile?.venueName}</p>

      <div className="w-full max-w-md rounded-xl border p-5 shadow-sm bg-white">
        <p className="text-lg text-gray-600">Current members: <span className="text-2xl font-semibold text-gray-900">{memberCount}</span></p>
        <p className="text-lg text-gray-600 mb-4">Current non-members: <span className="text-2xl font-semibold text-gray-900">{nonMemberCount}</span></p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-lg font-medium">Members</span>
            <input
              type="number"
              min={0}
              step={1}
              value={memberInput}
              onChange={(event) => setMemberInput(event.target.value)}
              className="w-full rounded-md border p-2 text-2xl font-semibold"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-lg font-medium">Non-members</span>
            <input
              type="number"
              min={0}
              step={1}
              value={nonMemberInput}
              onChange={(event) => setNonMemberInput(event.target.value)}
              className="w-full rounded-md border p-2 text-2xl font-semibold"
            />
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {statusMessage && <p className="text-sm text-green-600">{statusMessage}</p>}

          <button
            type="submit"
            className="w-full px-6 py-3 text-lg bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition"
          >
            Apply
          </button>
        </form>
      </div>
    </div>
  );
}

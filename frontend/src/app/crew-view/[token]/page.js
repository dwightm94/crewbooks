"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Hammer, MapPin, Clock, CheckCircle2, LogOut } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function CrewViewPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [message, setMessage] = useState(null);

  const load = async () => {
    try {
      const res = await fetch(`${BASE}/crew-view/${token}`);
      const json = await res.json();
      setData(json.data || json);
    } catch { }
    setLoading(false);
  };
  useEffect(() => { load(); }, [token]);

  const doClock = async (action) => {
    const setter = action === "clockIn" ? setClockingIn : setClockingOut;
    setter(true);
    try {
      let lat = null, lng = null;
      try {
        const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch { /* GPS optional */ }
      const res = await fetch(`${BASE}/crew-view/${token}/clock`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, lat, lng }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage(action === "clockIn" ? "You're clocked in! Have a great day." : `Clocked out. ${json.data?.hoursWorked || ""} hours today.`);
        load();
      } else { setMessage(json.error || "Something went wrong"); }
    } catch (e) { setMessage(e.message); }
    setter(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: "#F59E0B", borderTopColor: "transparent" }} />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
      <div>
        <Hammer size={48} className="mx-auto mb-4 text-amber-500" />
        <h1 className="text-2xl font-bold text-gray-900">Invalid Link</h1>
        <p className="text-gray-500 mt-2">This crew link is no longer valid. Ask your boss for a new one.</p>
      </div>
    </div>
  );

  const todayAssignment = data.today?.[0];
  const tomorrowAssignment = data.tomorrow?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-amber-500 p-6 text-center text-white">
        <Hammer size={32} className="mx-auto mb-2" />
        <h1 className="text-2xl font-extrabold">CrewBooks</h1>
        <p className="text-lg mt-1">Hey {data.memberName?.split(" ")[0]}!</p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {message && (
          <div className="rounded-2xl p-4 text-center font-semibold bg-green-50 text-green-700">{message}</div>
        )}

        {/* Today's Assignment */}
        {todayAssignment ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Today</p>
            <h2 className="text-xl font-extrabold text-gray-900">{todayAssignment.jobName}</h2>
            {todayAssignment.jobAddress && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(todayAssignment.jobAddress)}`} target="_blank"
                className="flex items-center gap-2 mt-2 text-blue-600 font-medium">
                <MapPin size={18} />{todayAssignment.jobAddress}
              </a>
            )}
            <div className="flex items-center gap-2 mt-2 text-gray-500">
              <Clock size={16} /><span>Start: {todayAssignment.startTime}</span>
            </div>

            {/* Clock In/Out Buttons */}
            <div className="mt-6 space-y-3">
              {!todayAssignment.clockIn ? (
                <button onClick={() => doClock("clockIn")} disabled={clockingIn}
                  className="w-full py-5 rounded-2xl text-xl font-extrabold text-white bg-green-500 active:scale-[0.97] transition-all shadow-lg">
                  {clockingIn ? "Getting Location..." : "☀️ I'm Here — Clock In"}
                </button>
              ) : !todayAssignment.clockOut ? (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 font-semibold">
                    <CheckCircle2 size={20} />
                    Clocked in at {new Date(todayAssignment.clockIn).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </div>
                  <button onClick={() => doClock("clockOut")} disabled={clockingOut}
                    className="w-full py-5 rounded-2xl text-xl font-extrabold text-white bg-red-500 active:scale-[0.97] transition-all shadow-lg">
                    {clockingOut ? "Getting Location..." : "🌙 Done for the Day — Clock Out"}
                  </button>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-gray-100 text-center">
                  <p className="text-lg font-bold text-gray-700">All done for today!</p>
                  <p className="text-sm text-gray-500 mt-1">{todayAssignment.hoursWorked} hours logged</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Today</p>
            <p className="text-lg font-bold text-gray-700">No assignment today</p>
            <p className="text-sm text-gray-400 mt-1">Enjoy your day off!</p>
          </div>
        )}

        {/* Tomorrow's Assignment */}
        {tomorrowAssignment && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-3">Tomorrow</p>
            <h2 className="text-lg font-bold text-gray-900">{tomorrowAssignment.jobName}</h2>
            {tomorrowAssignment.jobAddress && (
              <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                <MapPin size={14} />{tomorrowAssignment.jobAddress}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
              <Clock size={14} /><span>Start: {tomorrowAssignment.startTime}</span>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">Powered by CrewBooks</p>
      </div>
    </div>
  );
}

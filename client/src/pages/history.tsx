import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/supabaseClient";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
  subDays,
} from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useHaptic } from "@/hooks/use-haptic";
import LoadingOverlay from "@/components/ui/loading-overlay";
import jsPDF from "jspdf";

interface Reading {
  id: string;
  user_id: string;
  blood_sugar: number;
  meal: string;
  carbs: number;
  activity_level: string;
  timestamp: string; // ISO string
  notes?: string;
  meal_image_url?: string;
}

interface WeekGroup {
  weekStart: Date;
  weekEnd: Date;
  readings: Reading[];
}

export default function History() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerHaptic } = useHaptic();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Initialize date inputs on component mount
  useEffect(() => {
    if (!startDate && !endDate) {
      const today = new Date();
      const sevenDaysAgo = subDays(today, 7);
      setStartDate(toYMD(sevenDaysAgo));
      setEndDate(toYMD(today));
    }
  }, []); // Run only once on mount
  const [reportEmail, setReportEmail] = useState("");
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Quick range selection: null | "all" | "7" | "30"
  const [quickRange, setQuickRange] = useState<"all" | "7" | "30" | null>(null);

  // helper for yyyy-MM-dd input value
  const toYMD = (d: Date) => d.toISOString().slice(0, 10);


  // Fetch user readings
  const { data: readings = [], isLoading } = useQuery<Reading[]>({
    queryKey: ["user-readings"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("readings")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user,
  });

  // When quickRange changes, overwrite the date inputs
  useEffect(() => {
    if (!quickRange) return;

    const today = new Date();

    if (quickRange === "all") {
      if (readings.length === 0) return;
      const earliest = readings
        .map((r) => parseISO(r.timestamp))
        .reduce((acc, d) => (d < acc ? d : acc), parseISO(readings[0].timestamp));

      setStartDate(toYMD(earliest));
      setEndDate(toYMD(today));
      return;
    }

    // "7" or "30"
    const days = Number(quickRange);
    const start = subDays(today, days);
    setStartDate(toYMD(start));
    setEndDate(toYMD(today));
  }, [quickRange, readings]);

  // Group readings by week
  const groupReadingsByWeek = (): WeekGroup[] => {
    const weeks: Map<string, WeekGroup> = new Map();

    readings.forEach((reading) => {
      const readingDate = parseISO(reading.timestamp);
      const weekStart = startOfWeek(readingDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(readingDate, { weekStartsOn: 1 }); // Sunday
      const weekKey = format(weekStart, "yyyy-MM-dd");

      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, {
          weekStart,
          weekEnd,
          readings: [],
        });
      }

      weeks.get(weekKey)!.readings.push(reading);
    });

    return Array.from(weeks.values()).sort(
      (a, b) => b.weekStart.getTime() - a.weekStart.getTime()
    );
  };

  const weekGroups = groupReadingsByWeek();

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case "breakfast":
        return "fa-sun text-ios-orange";
      case "lunch":
        return "fa-sun text-yellow-400";
      case "dinner":
        return "fa-moon text-ios-purple";
      case "snack":
        return "fa-cookie-bite text-ios-orange";
      default:
        return "fa-utensils text-white";
    }
  };

  const getReadingColor = (value: number) => {
    if (value < 70) return "text-ios-blue";
    if (value > 140) return "text-ios-red";
    return "text-ios-green";
  };

  const toggleWeek = (weekKey: string) => {
    const copy = new Set(expandedWeeks);
    copy.has(weekKey) ? copy.delete(weekKey) : copy.add(weekKey);
    setExpandedWeeks(copy);
  };

  // PDF generation
  const generatePDF = (filtered: Reading[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;

    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Blood Sugar Report", pageWidth / 2, y, { align: "center" });
    y += 20;

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Period: ${startDate} to ${endDate}`, pageWidth / 2, y, {
      align: "center",
    });
    y += 15;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`User: ${user?.email || "Unknown"}`, margin, y);
    y += 8;
    doc.text(`Total Readings: ${filtered.length}`, margin, y);
    doc.text(format(new Date(), "MMM d, yyyy h:mm a"), pageWidth - margin, y, {
      align: "right",
    });
    y += 20;

    const colWidths = [35, 25, 30, 30, 25, 30]; // Date, Time, Meal, Blood Sugar, Carbs, Activity
    const rowH = 8;
    let curY = y;

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, curY, pageWidth - 2 * margin, rowH, "F");

    let curX = margin + 2;
    ["Date", "Time", "Meal", "Blood Sugar", "Carbs", "Activity"].forEach(
      (h, i) => {
        doc.text(h, curX, curY + 5);
        curX += colWidths[i];
      }
    );
    curY += rowH;

    doc.setTextColor(40, 40, 40);
    filtered.forEach((r, idx) => {
      if (curY > 250) {
        doc.addPage();
        curY = margin;
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(79, 70, 229);
        doc.rect(margin, curY, pageWidth - 2 * margin, rowH, "F");
        curX = margin + 2;
        ["Date", "Time", "Meal", "Blood Sugar", "Carbs", "Activity"].forEach(
          (h, i) => {
            doc.text(h, curX, curY + 5);
            curX += colWidths[i];
          }
        );
        curY += rowH;
        doc.setTextColor(40, 40, 40);
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(margin, curY, pageWidth - 2 * margin, rowH, "F");
      }

      const d = parseISO(r.timestamp);
      const row = [
        format(d, "MMM d, yyyy"),
        format(d, "h:mm a"),
        r.meal,
        `${r.blood_sugar} mg/dL`,
        `${r.carbs}g`,
        r.activity_level,
      ];

      curX = margin + 2;
      doc.setFontSize(8);
      row.forEach((val, i) => {
        doc.text(val, curX, curY + 5);
        curX += colWidths[i];
      });

      curY += rowH;

      if (r.notes) {
        if (curY > 250) {
          doc.addPage();
          curY = margin;
        }
        doc.setFillColor(255, 255, 220);
        doc.rect(margin, curY, pageWidth - 2 * margin, rowH, "F");
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.text(`Notes: ${r.notes}`, margin + 2, curY + 5);
        curY += rowH;
        doc.setTextColor(40, 40, 40);
      }
    });

    curY += 15;
    if (curY > 250) {
      doc.addPage();
      curY = margin;
    }

    const avgBS =
      filtered.reduce((s, r) => s + r.blood_sugar, 0) / filtered.length;
    const avgCarbs =
      filtered.reduce((s, r) => s + r.carbs, 0) / filtered.length;
    const highs = filtered.filter((r) => r.blood_sugar > 140).length;
    const lows = filtered.filter((r) => r.blood_sugar < 70).length;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text("Summary:", margin, curY);
    curY += 10;

    doc.setFontSize(8);
    doc.text(`Average Blood Sugar: ${avgBS.toFixed(1)} mg/dL`, margin, curY);
    curY += 6;
    doc.text(`Average Carbs: ${avgCarbs.toFixed(1)} g`, margin, curY);
    curY += 6;
    doc.text(
      `High Readings (>140): ${highs} (${((highs / filtered.length) * 100).toFixed(1)}%)`,
      margin,
      curY
    );
    curY += 6;
    doc.text(
      `Low Readings (<70): ${lows} (${((lows / filtered.length) * 100).toFixed(1)}%)`,
      margin,
      curY
    );

    return doc;
  };

  // Download report
  const downloadReportMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) throw new Error("Please select start and end dates");
      if (!user) throw new Error("User not authenticated");

      const start = parseISO(startDate);
      const end = parseISO(endDate + "T23:59:59");

      const filtered = readings.filter((r) => {
        const d = parseISO(r.timestamp);
        return isWithinInterval(d, { start, end });
      });

      if (filtered.length === 0)
        throw new Error("No readings found in the selected date range");

      const pdf = generatePDF(filtered);
      const blob = pdf.output("blob");
      const fileName = `blood-sugar-report-${startDate}-to-${endDate}.pdf`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      return { count: filtered.length };
    },
    onSuccess: ({ count }) => {
      triggerHaptic("medium");
      toast({
        title: "Report Downloaded!",
        description: `PDF with ${count} readings saved to your device.`,
      });
    },
    onError: (e: any) => {
      triggerHaptic("medium");
      toast({ title: "Download Failed", description: e.message, variant: "destructive" });
    },
  });

  // Email report
  const sendReportMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate || !reportEmail)
        throw new Error("Please fill in all fields");
      if (!user) throw new Error("User not authenticated");

      const start = parseISO(startDate);
      const end = parseISO(endDate + "T23:59:59");

      const filtered = readings.filter((r) => {
        const d = parseISO(r.timestamp);
        return isWithinInterval(d, { start, end });
      });

      if (filtered.length === 0)
        throw new Error("No readings found in the selected date range");

      const pdf = generatePDF(filtered);
      const blob = pdf.output("blob");

      // base64 for API
      const arrBuf = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrBuf);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const pdfBase64 = btoa(binary);

      // send email
      let emailSent = false;
      let emailError: string | null = null;

      try {
        const res = await fetch("/api/email-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: reportEmail,
            userEmail: user.email,
            startDate,
            endDate,
            readingCount: filtered.length,
            pdfBase64,
          }),
        });

        if (res.ok) {
          emailSent = true;
        } else {
          const data = await res.json().catch(() => ({}));
          emailError = data.error || data.message || "Failed to send email";
        }
      } catch {
        emailError = "Email service temporarily unavailable";
      }

      // backup to Storage (best-effort)
      const fileName = `blood-sugar-report-${startDate}-to-${endDate}.pdf`;
      const filePath = `reports/${user.id}/${fileName}`;
      await supabase.storage.from("reports").upload(filePath, blob, {
        contentType: "application/pdf",
        upsert: true,
      });

      // also download locally
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      return { emailSent, emailError };
    },
    onSuccess: ({ emailSent }) => {
      triggerHaptic("heavy");
      toast({
        title: emailSent ? "Report Sent Successfully!" : "Report Generated!",
        description: emailSent
          ? `PDF emailed and downloaded locally.`
          : `PDF downloaded locally. Email pending—check SendGrid verification.`,
      });
      setReportEmail("");
    },
    onError: (e: any) => {
      triggerHaptic("medium");
      toast({
        title: "Report Generation Failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="px-4 py-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="glass rounded-2xl p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-glass-white rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-glass-white rounded mb-2" />
                    <div className="h-3 bg-glass-white rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        <Header />

        <div className="px-4 py-6">
          {/* PDF Export Section */}
          <section className="mb-6">
            <div className="glass-strong rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <i className="fas fa-file-pdf text-ios-red mr-3" />
                Export Report
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      📅 Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="ios-input w-full"
                      data-testid="input-start-date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      📅 End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="ios-input w-full"
                      data-testid="input-end-date"
                    />
                  </div>
                </div>

                {/* Quick Range Shortcuts - tiny pill buttons with toggle */}
                <div className="flex gap-2 mb-4">
                  {([
                    { label: "All Readings", value: "all" },
                    { label: "Last 7 Days", value: "7" },
                    { label: "Last 30 Days", value: "30" },
                  ] as const).map((opt) => {
                    const selected = quickRange === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          if (selected) {
                            // Deselect: reset both dates to today
                            const todayStr = toYMD(new Date());
                            setStartDate(todayStr);
                            setEndDate(todayStr);
                            setQuickRange(null);
                          } else {
                            setQuickRange(opt.value);
                          }
                        }}
                        className={[
                          "px-3 py-1 rounded-full text-sm font-medium transition-all duration-150",
                          selected
                            ? "bg-ios-purple text-white ring-2 ring-ios-purple/40"
                            : "bg-white/10 text-white/80 hover:bg-white/20"
                        ].join(" ")}
                      >
                        {opt.label}
                        {selected && (
                          <i className="fas fa-check-circle text-white/90 ml-2 align-middle" />
                        )}
                      </button>
                    );
                  })}
                </div>




                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    📧 Email Address
                  </label>
                  <input
                    type="email"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="ios-input w-full"
                    data-testid="input-report-email"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => downloadReportMutation.mutate()}
                    disabled={
                      downloadReportMutation.isPending || !startDate || !endDate
                    }
                    className="ios-button flex-1 bg-ios-blue text-white rounded-2xl py-4 font-medium disabled:opacity-50 min-h-[60px]"
                    data-testid="button-download-report"
                  >
                    <div className="flex flex-col items-center space-y-0.5">
                      <i className="fas fa-download text-base" />
                      <span className="text-sm">
                        {downloadReportMutation.isPending ? "Generating..." : "Download"}
                      </span>
                    </div>
                  </Button>

                  <Button
                    onClick={() => sendReportMutation.mutate()}
                    disabled={
                      sendReportMutation.isPending ||
                      !startDate ||
                      !endDate ||
                      !reportEmail
                    }
                    className="ios-button flex-1 bg-ios-red text-white rounded-2xl py-4 font-medium disabled:opacity-50 min-h-[60px]"
                    data-testid="button-send-report"
                  >
                    <div className="flex flex-col items-center space-y-0.5">
                      <i className="fas fa-paper-plane text-base" />
                      <span className="text-sm">
                        {sendReportMutation.isPending ? "Sending..." : "Email PDF"}
                      </span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Weekly History */}
          <section className="mb-6">
            <div className="glass-strong rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <i className="fas fa-history text-ios-purple mr-3" />
                Weekly History
              </h2>

              {readings.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-chart-line text-4xl text-white/30 mb-4"></i>
                  <p className="text-white/70">No readings recorded yet</p>
                  <p className="text-sm text-white/50 mt-2">
                    Start tracking your blood sugar to see your history
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {weekGroups.map((week) => {
                    const weekKey = format(week.weekStart, "yyyy-MM-dd");
                    const isExpanded = expandedWeeks.has(weekKey);
                    const weekLabel = `🗓️ ${format(
                      week.weekStart,
                      "MMM d"
                    )} – ${format(week.weekEnd, "MMM d")}`;

                    return (
                      <div key={weekKey} className="glass rounded-2xl overflow-hidden">
                        <button
                          onClick={() => toggleWeek(weekKey)}
                          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                          data-testid={`button-week-${weekKey}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-ios-purple/20 rounded-full flex items-center justify-center">
                              <i className="fas fa-calendar text-ios-purple"></i>
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-white">
                                {weekLabel}
                              </div>
                              <div className="text-sm text-white/70">
                                {week.readings.length} readings
                              </div>
                            </div>
                          </div>
                          <i
                            className={`fas fa-chevron-${
                              isExpanded ? "up" : "down"
                            } text-white/70`}
                          ></i>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-white/10">
                            <div className="p-4 space-y-3">
                              {week.readings
                                .sort(
                                  (a, b) =>
                                    new Date(b.timestamp).getTime() -
                                    new Date(a.timestamp).getTime()
                                )
                                .map((reading) => (
                                  <div
                                    key={reading.id}
                                    className="glass-light rounded-xl p-3 flex items-center space-x-4"
                                    data-testid={`reading-${reading.id}`}
                                  >
                                    <div className="w-8 h-8 bg-glass-white rounded-full flex items-center justify-center flex-shrink-0">
                                      <i
                                        className={`fas ${getMealIcon(
                                          reading.meal
                                        )} text-sm`}
                                      ></i>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span
                                          className={`font-semibold ${getReadingColor(
                                            reading.blood_sugar
                                          )}`}
                                        >
                                          {reading.blood_sugar} mg/dL
                                        </span>
                                        <span className="text-white/50">•</span>
                                        <span className="text-sm text-white/70 capitalize">
                                          {reading.meal}
                                        </span>
                                      </div>
                                      <div className="text-xs text-white/60 mt-1">
                                        {format(
                                          parseISO(reading.timestamp),
                                          "MMM d, h:mm a"
                                        )}{" "}
                                        • {reading.carbs}g carbs •{" "}
                                        {reading.activity_level}
                                      </div>
                                      {reading.notes && (
                                        <div className="text-xs text-white/50 mt-1 truncate">
                                          💭 {reading.notes}
                                        </div>
                                      )}
                                    </div>

                                    {reading.meal_image_url && (
                                      <div className="flex-shrink-0">
                                        <img
                                          src={reading.meal_image_url}
                                          alt="Meal photo"
                                          className="w-12 h-12 rounded-lg object-cover"
                                          data-testid={`meal-image-${reading.id}`}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        <BottomNav />
      </div>

      <LoadingOverlay
        isVisible={
          sendReportMutation.isPending || downloadReportMutation.isPending
        }
        message={
          sendReportMutation.isPending
            ? "Sending Email Report..."
            : "Generating PDF Report..."
        }
        subtitle="Please wait"
      />
    </>
  );
}

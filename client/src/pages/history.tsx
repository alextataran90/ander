import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/supabaseClient";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
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
  timestamp: string;
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
  const [reportEmail, setReportEmail] = useState("");
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Separate mutation for download only
  const downloadReportMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) {
        throw new Error("Please select start and end dates");
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Filter readings by date range
      const start = parseISO(startDate);
      const end = parseISO(endDate + "T23:59:59");
      
      const filteredReadings = readings.filter(reading => {
        const readingDate = parseISO(reading.timestamp);
        return isWithinInterval(readingDate, { start, end });
      });

      if (filteredReadings.length === 0) {
        throw new Error("No readings found in the selected date range");
      }

      // Generate and download PDF
      const pdf = generatePDF(filteredReadings);
      const pdfBlob = pdf.output("blob");

      const fileName = `blood-sugar-report-${startDate}-to-${endDate}.pdf`;
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);

      return { success: true, readingCount: filteredReadings.length };
    },
    onSuccess: (result) => {
      triggerHaptic("medium");
      toast({
        title: "Report Downloaded!",
        description: `PDF with ${result.readingCount} readings saved to your device.`,
      });
    },
    onError: (error: any) => {
      triggerHaptic("medium");
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch user readings from Supabase
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

  // Group readings by week
  const groupReadingsByWeek = (): WeekGroup[] => {
    const weeks: Map<string, WeekGroup> = new Map();

    readings.forEach(reading => {
      const readingDate = parseISO(reading.timestamp);
      const weekStart = startOfWeek(readingDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(readingDate, { weekStartsOn: 1 }); // Sunday
      const weekKey = format(weekStart, "yyyy-MM-dd");

      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, {
          weekStart,
          weekEnd,
          readings: []
        });
      }

      weeks.get(weekKey)!.readings.push(reading);
    });

    return Array.from(weeks.values()).sort((a, b) => 
      b.weekStart.getTime() - a.weekStart.getTime()
    );
  };

  const weekGroups = groupReadingsByWeek();

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case "breakfast": return "fa-sun text-ios-orange";
      case "lunch": return "fa-sun text-yellow-400";
      case "dinner": return "fa-moon text-ios-purple";
      case "snack": return "fa-cookie-bite text-ios-orange";
      default: return "fa-utensils text-white";
    }
  };

  const getReadingColor = (value: number) => {
    if (value < 70) return "text-ios-blue";
    if (value > 140) return "text-ios-red";
    return "text-ios-green";
  };

  const toggleWeek = (weekKey: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekKey)) {
      newExpanded.delete(weekKey);
    } else {
      newExpanded.add(weekKey);
    }
    setExpandedWeeks(newExpanded);
  };

  // PDF generation function
  const generatePDF = (filteredReadings: Reading[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Blood Sugar Report", pageWidth / 2, y, { align: "center" });
    y += 20;

    // Date range
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Period: ${startDate} to ${endDate}`, pageWidth / 2, y, { align: "center" });
    y += 20;

    // User info
    doc.text(`User: ${user?.email || "Unknown"}`, margin, y);
    y += 10;
    doc.text(`Total Readings: ${filteredReadings.length}`, margin, y);
    y += 20;

    // Readings
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    
    filteredReadings.forEach((reading, index) => {
      if (y > 250) {
        doc.addPage();
        y = margin;
      }

      const date = format(parseISO(reading.timestamp), "MMM d, yyyy h:mm a");
      const bloodSugar = `${reading.blood_sugar} mg/dL`;
      const meal = reading.meal;
      const carbs = `${reading.carbs}g carbs`;
      const activity = reading.activity_level;

      doc.text(`${index + 1}. ${date}`, margin, y);
      y += 6;
      doc.text(`   Blood Sugar: ${bloodSugar} | Meal: ${meal}`, margin, y);
      y += 6;
      doc.text(`   Carbs: ${carbs} | Activity: ${activity}`, margin, y);
      
      if (reading.notes) {
        y += 6;
        doc.text(`   Notes: ${reading.notes}`, margin, y);
      }
      
      y += 10;
    });

    return doc;
  };

  // Generate and send report mutation
  const sendReportMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate || !reportEmail) {
        throw new Error("Please fill in all fields");
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Filter readings by date range
      const start = parseISO(startDate);
      const end = parseISO(endDate + "T23:59:59");
      
      const filteredReadings = readings.filter(reading => {
        const readingDate = parseISO(reading.timestamp);
        return isWithinInterval(readingDate, { start, end });
      });

      if (filteredReadings.length === 0) {
        throw new Error("No readings found in the selected date range");
      }

      // Generate PDF
      const pdf = generatePDF(filteredReadings);
      const pdfBlob = pdf.output("blob");

      // Convert PDF to base64 for API transmission
      const pdfBuffer = await pdfBlob.arrayBuffer();
      const bytes = new Uint8Array(pdfBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const pdfBase64 = btoa(binary);

      // Try to send email via API
      let emailSent = false;
      let emailError = null;
      
      try {
        const response = await fetch("/api/send-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate,
            endDate,
            recipientEmail: reportEmail,
            userEmail: user.email,
            pdfBuffer: pdfBase64,
            readingCount: filteredReadings.length,
          }),
        });

        if (response.ok) {
          emailSent = true;
        } else {
          const errorData = await response.json();
          emailError = errorData.message || "Failed to send email";
        }
      } catch (error) {
        emailError = "Email service temporarily unavailable";
      }

      // Also upload PDF to Supabase Storage for backup
      const fileName = `blood-sugar-report-${startDate}-to-${endDate}.pdf`;
      const filePath = `reports/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: true
        });

      if (uploadError) {
        console.warn("Failed to backup PDF:", uploadError.message);
      }

      // Also provide download option
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);

      return { 
        success: true, 
        emailSent, 
        emailError,
        message: emailSent ? "Report emailed successfully" : "Report generated (email pending)"
      };
    },
    onSuccess: (result: any) => {
      triggerHaptic("heavy");
      
      if (result.emailSent) {
        toast({
          title: "Report Sent Successfully!",
          description: `Your PDF report has been emailed to ${reportEmail} and downloaded locally.`,
        });
      } else {
        toast({
          title: "Report Generated!",
          description: `PDF downloaded locally. Email setup needed - check SendGrid verification.`,
          variant: "default",
        });
      }
      
      // Clear form
      setStartDate("");
      setEndDate("");
      setReportEmail("");
    },
    onError: (error: any) => {
      triggerHaptic("medium");
      toast({
        title: "Report Generation Failed",
        description: error.message,
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
                <i className="fas fa-file-pdf text-ios-red mr-3"></i>
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
                    disabled={downloadReportMutation.isPending || !startDate || !endDate}
                    className="ios-button flex-1 bg-ios-blue text-white rounded-2xl py-3 font-semibold disabled:opacity-50"
                    data-testid="button-download-report"
                  >
                    <i className="fas fa-download mr-2"></i>
                    {downloadReportMutation.isPending ? "Generating..." : "📄 Download PDF"}
                  </Button>
                  
                  <Button
                    onClick={() => sendReportMutation.mutate()}
                    disabled={sendReportMutation.isPending || !startDate || !endDate || !reportEmail}
                    className="ios-button flex-1 bg-ios-red text-white rounded-2xl py-3 font-semibold disabled:opacity-50"
                    data-testid="button-send-report"
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    {sendReportMutation.isPending ? "Sending..." : "✉️ Email PDF"}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Weekly History Section */}
          <section className="mb-6">
            <div className="glass-strong rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <i className="fas fa-history text-ios-purple mr-3"></i>
                Weekly History
              </h2>

              {readings.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-chart-line text-4xl text-white/30 mb-4"></i>
                  <p className="text-white/70">No readings recorded yet</p>
                  <p className="text-sm text-white/50 mt-2">Start tracking your blood sugar to see your history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {weekGroups.map((week) => {
                    const weekKey = format(week.weekStart, "yyyy-MM-dd");
                    const isExpanded = expandedWeeks.has(weekKey);
                    const weekLabel = `🗓️ ${format(week.weekStart, "MMM d")} – ${format(week.weekEnd, "MMM d")}`;

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
                              <div className="font-semibold text-white">{weekLabel}</div>
                              <div className="text-sm text-white/70">{week.readings.length} readings</div>
                            </div>
                          </div>
                          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-white/70`}></i>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-white/10">
                            <div className="p-4 space-y-3">
                              {week.readings
                                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                .map((reading) => (
                                <div 
                                  key={reading.id} 
                                  className="glass-light rounded-xl p-3 flex items-center space-x-4"
                                  data-testid={`reading-${reading.id}`}
                                >
                                  <div className="w-8 h-8 bg-glass-white rounded-full flex items-center justify-center flex-shrink-0">
                                    <i className={`fas ${getMealIcon(reading.meal)} text-sm`}></i>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className={`font-semibold ${getReadingColor(reading.blood_sugar)}`}>
                                        {reading.blood_sugar} mg/dL
                                      </span>
                                      <span className="text-white/50">•</span>
                                      <span className="text-sm text-white/70 capitalize">{reading.meal}</span>
                                    </div>
                                    <div className="text-xs text-white/60 mt-1">
                                      {format(parseISO(reading.timestamp), "MMM d, h:mm a")} • {reading.carbs}g carbs • {reading.activity_level}
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
        isVisible={sendReportMutation.isPending || downloadReportMutation.isPending} 
        message={sendReportMutation.isPending ? "Sending Email Report..." : "Generating PDF Report..."} 
        subtitle="Please wait" 
      />
    </>
  );
}

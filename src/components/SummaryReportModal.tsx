import React, { useMemo } from "react";
import { 
  FileText, 
  X, 
  Printer, 
  ShieldCheck, 
  History, 
  MessageSquare, 
  LogOut, 
  FileCheck,
  AlertTriangle
} from "lucide-react";
import { MedicalData, ChatMessage } from "../types";

interface SummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: (saveBeforeLogout?: boolean) => void;
  medicalData: MedicalData | null;
  activePatientId: string | null;
  clinicalExpertise: string;
  isNewPatient?: boolean;
  language?: string;
}

export default function SummaryReportModal({
  isOpen,
  onClose,
  onConfirmLogout,
  medicalData,
  activePatientId,
  clinicalExpertise,
  isNewPatient = false,
  language
}: SummaryReportModalProps) {
  const [agreedToSave, setAgreedToSave] = React.useState(false);
  
  // Retrieve current chat session logs from localStorage for summary inclusion
  const sessionChat: ChatMessage[] = useMemo(() => {
    try {
      const saved = localStorage.getItem("aegis_current_chat");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Exclude the initial system welcome message to make report extremely focused and professional
        return parsed.filter((m: ChatMessage) => m.id !== "welcome");
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTimeString = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Handle high-fidelity print window opening (isolated from iframe constraints)
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate and print the report.");
      return;
    }

    const patientIdText = activePatientId || "Unassigned Session Context";
    const patientNameText = medicalData?.patientName || `Patient [ANONYMOUS-${patientIdText}]`;
    const docTypeText = medicalData?.documentType || "Clinical Laboratory Record";
    const docDateText = medicalData?.documentDate || "N/A";
    const facilityText = medicalData?.facilityName || "Primary Care Clinic Service";
    const providerText = medicalData?.providerName || "N/A";

    const findingsHtml = medicalData?.findings && medicalData.findings.length > 0
      ? medicalData.findings.map(f => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px; font-weight: 500; color: #1f2937;">${f.parameter}</td>
            <td style="padding: 8px; text-align: right; font-weight: 600; color: #111827;">${f.value}</td>
            <td style="padding: 8px; text-align: center; color: #4b5563;">${f.referenceRange || "N/A"}</td>
            <td style="padding: 8px; text-align: center;">
              <span style="
                padding: 2px 6px; 
                border-radius: 4px; 
                font-size: 10px; 
                font-weight: bold;
                ${f.status === "HIGH" ? "background-color: #fef2f2; color: #991b1b;" : ""}
                ${f.status === "LOW" ? "background-color: #eff6ff; color: #1e40af;" : ""}
                ${f.status === "NORMAL" ? "background-color: #ecfdf5; color: #065f46;" : ""}
                ${f.status === "ABNORMAL" ? "background-color: #fffbeb; color: #92400e;" : ""}
              ">${f.status}</span>
            </td>
            <td style="padding: 8px; font-size: 11px; color: #4b5563;">${f.notes || ""}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #9ca3af;">No clinical findings available in active session.</td></tr>`;

    const chatHtml = sessionChat.length > 0
      ? sessionChat.map(m => `
          <div style="margin-bottom: 12px; padding: 10px; border-radius: 6px; background-color: ${m.role === "user" ? "#f9fafb" : "#f0fdf4"}; border-left: 3px solid ${m.role === "user" ? "#9ca3af" : "#10b981"};">
            <div style="font-size: 10px; font-weight: bold; color: ${m.role === "user" ? "#4b5563" : "#047857"}; text-transform: uppercase; margin-bottom: 4px;">
              ${m.role === "user" ? "Patient / User Inquiry" : "AI Clinical Guide Response"} &bull; ${m.timestamp}
            </div>
            <div style="font-size: 12px; line-height: 1.5; color: #1f2937;">${m.content}</div>
          </div>
        `).join("")
      : `<p style="font-size: 12px; color: #9ca3af; font-style: italic;">No session Q&A history recorded.</p>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Aegis Clinical Summary Report - ${patientIdText}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #111827;
              background: #ffffff;
              margin: 0;
              padding: 40px;
              line-height: 1.5;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
              border-bottom: 2px solid #111827;
              padding-bottom: 15px;
            }
            .title-brand {
              font-size: 24px;
              font-weight: 700;
              letter-spacing: -0.025em;
              color: #111827;
            }
            .meta-box {
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 25px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              font-size: 12px;
            }
            .meta-item {
              margin-bottom: 5px;
            }
            .meta-label {
              font-weight: 600;
              color: #4b5563;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .section-title {
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 6px;
              margin-top: 30px;
              margin-bottom: 15px;
              color: #065f46;
            }
            table.findings-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-bottom: 25px;
            }
            table.findings-table th {
              background-color: #f3f4f6;
              padding: 8px;
              font-weight: 600;
              text-align: left;
              color: #374151;
              border-bottom: 1px solid #d1d5db;
            }
            .summary-para {
              font-size: 13px;
              color: #374151;
              background-color: #fcfdfd;
              border: 1px solid #f0fdf4;
              border-left: 3px solid #10b981;
              padding: 12px;
              border-radius: 6px;
              margin-bottom: 25px;
            }
            .disclaimer-box {
              background-color: #fffbeb;
              border: 1px solid #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              border-radius: 6px;
              margin-top: 40px;
              margin-bottom: 40px;
            }
            .disclaimer-title {
              font-size: 11px;
              font-weight: 700;
              color: #b45309;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .disclaimer-text {
              font-size: 11px;
              color: #78350f;
              line-height: 1.4;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #4b5563;
            }
            .signature-line {
              border-top: 1px solid #9ca3af;
              width: 200px;
              margin-top: 40px;
              text-align: center;
              padding-top: 5px;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="title-brand">AEGIS CLINICAL SUMMARY REPORT</div>
                <div style="font-size: 11px; color: #4b5563; font-weight: 500; margin-top: 4px;">Longitudinal Discussion Memo &amp; Metric Verification</div>
              </td>
              <td style="text-align: right; font-size: 11px; color: #6b7280;">
                Generated: ${currentDateString}<br>
                Time: ${currentTimeString}
              </td>
            </tr>
          </table>

          <div class="meta-box">
            <div class="meta-grid">
              <div>
                <div class="meta-item">
                  <span class="meta-label">Patient Identifier:</span><br>
                  <strong style="font-size: 13px;">${patientNameText} (${patientIdText})</strong>
                </div>
                <div class="meta-item" style="margin-top: 8px;">
                  <span class="meta-label">Clinical Facility:</span><br>
                  <strong>${facilityText}</strong>
                </div>
              </div>
              <div>
                <div class="meta-item">
                  <span class="meta-label">Source Document:</span><br>
                  <strong>${docTypeText} (${docDateText})</strong>
                </div>
                <div class="meta-item" style="margin-top: 8px;">
                  <span class="meta-label">Anonymization Role Context:</span><br>
                  <strong>${clinicalExpertise} Active</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="section-title">Layperson Document Summary</div>
          <div class="summary-para">
            ${medicalData?.summary || "No active document analyzed in this workspace session."}
          </div>

          <div class="section-title">Physiological Metrics &amp; Findings</div>
          <table class="findings-table">
            <thead>
              <tr>
                <th>Clinical Parameter</th>
                <th style="text-align: right;">Observed Value</th>
                <th style="text-align: center;">Reference Range</th>
                <th style="text-align: center;">Status</th>
                <th>Interpretation Guidelines</th>
              </tr>
            </thead>
            <tbody>
              ${findingsHtml}
            </tbody>
          </table>

          <div class="section-title">Session Discussion Transcript</div>
          <div style="margin-top: 15px;">
            ${chatHtml}
          </div>

          <div class="disclaimer-box">
            <div class="disclaimer-title">IMPORTANT REGULATORY COMPLIANCE EXCLUSION</div>
            <div class="disclaimer-text">
              This summary report is compiled automatically as a discussion tool for layperson education and records integration. 
              <strong>It contains absolutely NO clinical medical diagnoses, diagnostic verdicts, or pharmaceutical prescriptions.</strong> 
              It does not replace, override, or supplement official healthcare documentation. Please present this summary sheet directly 
              to a qualified medical provider to review your test values.
            </div>
          </div>

          <div class="signature-section">
            <div>
              <div class="signature-line">Patient / Designated Guardian Signature</div>
            </div>
            <div>
              <div class="signature-line">Verifying Record Administrator / Date</div>
            </div>
          </div>

          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print();" style="
              background-color: #065f46; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              font-size: 14px; 
              font-weight: 600; 
              border-radius: 6px; 
              cursor: pointer;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            ">
              Print / Save as PDF
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const patientIdText = activePatientId || "Unassigned Session";
  const patientNameText = medicalData?.patientName || `Patient [ANONYMOUS-${patientIdText}]`;

  return (
    <div id="summary-report-modal" className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileCheck size={18} />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-stone-900">
                {language === "vi" ? "Báo Cáo Kết Thúc Phiên & Đăng Xuất" : "End Session Report & Logout"}
              </h3>
              <p className="text-[11px] text-stone-500 font-mono">
                {language === "vi" ? "Bạn có muốn xem tóm tắt thảo luận lâm sàng trước khi đăng xuất không?" : "Would you like a clinical discussion summary before logging out?"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Report Preview */}
        <div className="p-6 overflow-y-auto space-y-5 bg-stone-50/20">

          {/* New Patient Consent & Save Warning */}
          {isNewPatient && (
            <div id="new-patient-warning-banner" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 space-y-3 shadow-sm animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block text-[10px] uppercase tracking-wider font-mono text-rose-800">
                    {language === "vi" ? "Cảnh báo về Chấp thuận & Lưu trữ dữ liệu" : "Consent & Retention Warning"}
                  </span>
                  <p className="text-[11px] text-rose-900 leading-normal font-medium">
                    {language === "vi" 
                      ? "Đây là mã bệnh nhân mới trên cơ sở dữ liệu lâm sàng của chúng tôi. Nếu bạn không đồng ý lưu dữ liệu phiên này, tất cả tài liệu lâm sàng và lịch sử trò chuyện sẽ biến mất vĩnh viễn và không thể sử dụng cho các cuộc đánh giá hoặc thăm khám trong tương lai." 
                      : "This is a brand new patient ID on our clinical database. If you do not agree to save this session's data, all clinical documentation and discussion transcripts will disappear permanently and cannot be used for future evaluation or visits."}
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2.5 bg-white border border-rose-200 p-2.5 rounded-lg text-xs text-rose-900 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToSave}
                  onChange={(e) => setAgreedToSave(e.target.checked)}
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-4.5 h-4.5 cursor-pointer"
                />
                <span>
                  {language === "vi" ? "Tôi hiểu và đồng ý lưu dữ liệu cuộc thảo luận này vào hồ sơ bệnh nhân." : "I understand and agree to save this discussion data to the patient's record."}
                </span>
              </label>
            </div>
          )}
          
          {/* Warning / Exclusion reminder */}
          <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
            <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block text-[10px] uppercase tracking-wider font-mono">
                {language === "vi" ? "Tóm Tắt Tiêu Chuẩn EHR (Không chứa Chẩn đoán)" : "EHR Standard Summary (No Diagnosis)"}
              </span>
              <p className="text-[11px] text-stone-600 leading-normal">
                {language === "vi" 
                  ? "Tài liệu này được tạo ra để phục vụ nhu cầu tham khảo cá nhân của bạn. Tuân thủ các quy tắc bảo mật lâm sàng, tài liệu này bao gồm các chỉ số xét nghiệm và bản ghi cuộc trò chuyện, nhưng loại trừ bất kỳ nhãn chẩn đoán lâm sàng hoặc kết luận kê đơn chính thức nào."
                  : "This document is generated for your personal reference. Adhering to clinical compliance mandates, it includes lab metrics and chat transcripts, but excludes any clinical diagnostic labels or prescriptive verdicts."}
              </p>
            </div>
          </div>

          {/* Paper Sheet Preview Area */}
          <div className="border border-stone-200 rounded-xl bg-white p-5 shadow-inner relative space-y-4 font-sans text-xs">
            {/* Watermark badge */}
            <div className="absolute top-2 right-2 opacity-5 pointer-events-none">
              <FileText size={180} className="text-stone-900" />
            </div>

            {/* Simulated letterhead */}
            <div className="flex justify-between items-start border-b border-stone-200 pb-3">
              <div>
                <span className="font-serif text-sm font-bold tracking-tight text-stone-950 block uppercase">
                  {language === "vi" ? "Hồ Sơ Tóm Tắt Aegis" : "Aegis Summary Dossier"}
                </span>
                <span className="text-[10px] text-stone-400 font-mono font-light">
                  {language === "vi" ? "Biên Bản Thảo Luận Sức Khỏe" : "Discussion Record Memo"}
                </span>
              </div>
              <div className="text-right text-[10px] text-stone-400 font-mono leading-tight">
                {language === "vi" ? "Ngày: " : "Date: "} {currentDateString}<br />
                {language === "vi" ? "Giờ: " : "Time: "} {currentTimeString}
              </div>
            </div>

            {/* Profile detail tags */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-stone-50 p-3 rounded-lg border border-stone-150 text-[11px]">
              <div>
                <span className="text-[9px] text-stone-400 uppercase tracking-wider font-mono">
                  {language === "vi" ? "Bệnh nhân" : "Patient Context"}
                </span>
                <p className="font-semibold text-stone-800">{patientNameText}</p>
              </div>
              <div>
                <span className="text-[9px] text-stone-400 uppercase tracking-wider font-mono">
                  {language === "vi" ? "Mã bệnh nhân" : "Patient ID"}
                </span>
                <p className="font-semibold text-stone-800 font-mono">{patientIdText}</p>
              </div>
              <div>
                <span className="text-[9px] text-stone-400 uppercase tracking-wider font-mono">
                  {language === "vi" ? "Cơ sở / Nguồn" : "Clinic / Source"}
                </span>
                <p className="font-medium text-stone-600 truncate">{medicalData?.facilityName || "Primary Care Registries"}</p>
              </div>
              <div>
                <span className="text-[9px] text-stone-400 uppercase tracking-wider font-mono">
                  {language === "vi" ? "Chế độ Ẩn danh" : "Anonymization Role"}
                </span>
                <p className="font-medium text-stone-600">{clinicalExpertise} Mode</p>
              </div>
            </div>

            {/* Core Summary Paragraph preview */}
            <div className="space-y-1">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-mono block">
                {language === "vi" ? "Tóm Tắt Thảo Luận Phổ Thông" : "Layperson Discussion Summary"}
              </span>
              <p className="text-[11px] text-stone-600 leading-relaxed font-light italic">
                "{medicalData?.summary || (language === "vi" ? "Không có kết quả lâm sàng hoạt động nào được phân tích trong phiên này." : "No active clinical findings parsed in this session.")}"
              </p>
            </div>

            {/* Medical Metrics Preview Table snippet */}
            {medicalData?.findings && medicalData.findings.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider font-mono block">
                  {language === "vi" 
                    ? `Tóm Tắt Kết Quả Sinh Học (${medicalData.findings.length} chỉ số)` 
                    : `Physiological Findings Summary (${medicalData.findings.length} parameters)`}
                </span>
                <div className="border border-stone-150 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-150 font-mono font-bold text-stone-500 text-[9px]">
                        <th className="p-2">{language === "vi" ? "Chỉ Số Quan Sát" : "Observed Metric"}</th>
                        <th className="p-2 text-right">{language === "vi" ? "Giá Trị" : "Value"}</th>
                        <th className="p-2 text-center">{language === "vi" ? "Trạng Thái" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicalData.findings.slice(0, 3).map((f, i) => (
                        <tr key={i} className="border-b border-stone-100 last:border-b-0">
                          <td className="p-2 font-medium text-stone-800">{f.parameter}</td>
                          <td className="p-2 text-right font-mono font-semibold text-stone-900">{f.value}</td>
                          <td className="p-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              f.status === "HIGH" ? "bg-rose-50 text-rose-700" :
                              f.status === "LOW" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                            }`}>{f.status}</span>
                          </td>
                        </tr>
                      ))}
                      {medicalData.findings.length > 3 && (
                        <tr className="bg-stone-50/50">
                          <td colSpan={3} className="p-1.5 text-center text-[9px] text-stone-400 italic">
                            {language === "vi" 
                              ? `... và ${medicalData.findings.length - 3} chỉ số lâm sàng khác được liệt kê trong báo cáo` 
                              : `... and ${medicalData.findings.length - 3} other clinical parameters listed in full report`}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Chat discussions summary snippet */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-mono block flex items-center gap-1">
                <MessageSquare size={10} /> {language === "vi" ? "Nhật Ký Trò Chuyện Phiên Hoạt Động" : "Active Session Chat Logs"}
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {sessionChat.length > 0 ? (
                  sessionChat.slice(0, 2).map((m, i) => (
                    <div key={i} className="p-2 bg-stone-50 border border-stone-150 rounded text-[10px] text-stone-600 flex justify-between gap-2">
                      <span className="font-mono text-stone-400 font-bold uppercase text-[8px] shrink-0">
                        {m.role === "user" ? (language === "vi" ? "Bạn" : "You") : "AI"}
                      </span>
                      <p className="flex-1 truncate font-light">"{m.content}"</p>
                      <span className="text-[8px] text-stone-400 shrink-0">{m.timestamp}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-stone-400 font-light italic">
                    {language === "vi" ? "Chưa có tin nhắn trò chuyện nào trong phiên này." : "No chat messages sent in this session yet."}
                  </p>
                )}
                {sessionChat.length > 2 && (
                  <p className="text-[8px] text-stone-400 text-center italic">
                    {language === "vi" 
                      ? `... cộng thêm ${sessionChat.length - 2} cuộc đối thoại khác trong báo cáo đầy đủ` 
                      : `... plus ${sessionChat.length - 2} other dialogue exchanges listed in full report`}
                  </p>
                )}
              </div>
            </div>

            {/* Official compliance label */}
            <div className="border-t border-stone-200 pt-3 flex items-center justify-between text-[8.5px] text-stone-400 uppercase tracking-wider font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-600" />
                {language === "vi" ? "Không Chứa Chẩn Đoán Lâm Sàng" : "No Diagnoses Contained"}
              </span>
              <span>Aegis Clinical v2.0</span>
            </div>

          </div>

        </div>

        {/* Modal Actions */}
        <div className="bg-stone-50 border-t border-stone-200 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-stone-500 hover:text-stone-700 transition-colors w-full sm:w-auto text-center order-2 sm:order-1 cursor-pointer"
          >
            {language === "vi" ? "Hủy" : "Cancel"}
          </button>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
            {isNewPatient ? (
              <>
                {/* For New Patients: Discard and Logout option */}
                <button
                  onClick={() => onConfirmLogout(false)}
                  className="px-4 py-2 bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-stone-700 hover:text-rose-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={12} />
                  {language === "vi" ? "Hủy Dữ Liệu & Đăng Xuất" : "Discard Data & Logout"}
                </button>

                {/* Save & Logout only */}
                <button
                  onClick={() => onConfirmLogout(true)}
                  disabled={!agreedToSave}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-400 disabled:border-transparent text-white text-xs font-semibold border border-stone-900 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCheck size={12} />
                  {language === "vi" ? "Lưu & Đăng Xuất" : "Save & Logout"}
                </button>

                {/* Print, Save & Logout */}
                <button
                  onClick={() => {
                    handlePrint();
                    setTimeout(() => {
                      onConfirmLogout(true);
                    }, 1000);
                  }}
                  disabled={!agreedToSave}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500/20 disabled:text-emerald-700/40 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={12} />
                  {language === "vi" ? "In, Lưu & Đăng Xuất" : "Print, Save & Logout"}
                </button>
              </>
            ) : (
              <>
                {/* Existing Patients - Standard option */}
                <button
                  onClick={() => onConfirmLogout(false)}
                  className="px-4 py-2 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={12} />
                  {language === "vi" ? "Chỉ Đăng Xuất" : "Just Logout"}
                </button>

                <button
                  onClick={() => {
                    handlePrint();
                    setTimeout(() => {
                      onConfirmLogout(true); // If they print, auto-save any updates
                    }, 1000);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={12} />
                  {language === "vi" ? "In Báo Cáo & Đăng Xuất" : "Print Report & Logout"}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { 
  Database, 
  Search, 
  User, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight, 
  AlertTriangle,
  UserCheck,
  Check,
  Sliders,
  Dna,
  FlaskConical,
  Image as ImageIcon
} from "lucide-react";
import { HistoricalRecord, Patient } from "../types";
import { EXPERTISE_PROFILES } from "../data/clinicalSkills";

interface PatientDatabaseConsoleProps {
  currentExpertise: string;
  onExpertiseChange: (roleId: string) => void;
  onLoadRecords: (patientId: string, records: HistoricalRecord[]) => void;
  activePatientId: string | null;
  setActivePatientId: (id: string | null) => void;
  historyRecords: HistoricalRecord[];
  consentGranted: boolean;
  onToggleConsent: (granted: boolean) => void;
  language?: string;
}

export default function PatientDatabaseConsole({
  currentExpertise,
  onExpertiseChange,
  onLoadRecords,
  activePatientId,
  setActivePatientId,
  historyRecords,
  consentGranted,
  onToggleConsent,
  language,
}: PatientDatabaseConsoleProps) {
  const [searchId, setSearchId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);

  // Load the full patients list
  const fetchPatientsList = async () => {
    setIsLoadingPatients(true);
    try {
      const res = await fetch(`/api/patients?expertise=${currentExpertise}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPatients(data.patients || []);
        }
      }
    } catch (e) {
      console.error("Failed to fetch patient database index:", e);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (currentExpertise) {
      fetchPatientsList();
    }
  }, [currentExpertise, historyRecords]); // reload when role changes or new records are saved

  // Determine current active patient details if loaded
  const currentLoadedPatient = useMemo(() => {
    if (!activePatientId) return null;
    return patients.find(p => p.id === activePatientId) || null;
  }, [activePatientId, patients]);

  // Handle patient retrieval
  const handleRetrievePatient = async (idToSearch: string) => {
    if (!idToSearch.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchSuccess(null);

    try {
      const trimmedId = idToSearch.trim();
      const res = await fetch(`/api/patient/${trimmedId}?expertise=${currentExpertise}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "The patient database query failed.");
      }

      if (data.exists) {
        onLoadRecords(data.patient.id, data.patient.records || []);
        setActivePatientId(data.patient.id);
        setSearchId(data.patient.id);
        
        const isMasked = data.patient.id.includes("****");
        setSearchSuccess(
          language === "vi"
            ? `Đã truy xuất thành công lịch sử hồ sơ. Đã tải ${data.patient.records?.length || 0} bản ghi báo cáo trước đó ${
                isMasked ? "(Hồ sơ bệnh nhân ẩn danh được tải theo giao thức bảo mật)" : ""
              }.`
            : `Dossier history successfully retrieved. Loaded ${data.patient.records?.length || 0} previous report entries ${
                isMasked ? "(Anonymized Patient Profile loaded under security protocol)" : ""
              }.`
        );
      } else {
        onLoadRecords(trimmedId, []);
        setActivePatientId(trimmedId);
        setSearchSuccess(
          language === "vi"
            ? `Mã Patient ID "${trimmedId}" là hoàn toàn mới. Không tìm thấy hồ sơ lâm sàng nào tồn tại trước đó. Mọi hồ sơ mới được xử lý sẽ được lưu an toàn dưới mã ID này.`
            : `Patient ID "${trimmedId}" is brand new. No pre-existing clinical dossiers found. Any new processed dossiers will be securely saved under this ID.`
        );
      }
      fetchPatientsList();
    } catch (err: any) {
      setSearchError(
        language === "vi"
          ? (err.message || "Đã xảy ra lỗi không mong muốn khi tra cứu hồ sơ bệnh nhân.")
          : (err.message || "An unexpected error occurred while looking up patient dossier.")
      );
    } finally {
      setIsSearching(false);
    }
  };

  const isSecurityMasked = currentExpertise === "PHARMACIST" || currentExpertise === "PATHOLOGIST";

  return (
    <div id="patient-database-console" className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm p-6 space-y-6">
      
      {/* 1. SECTION: Expertise / Clinical Role (Persona) Selection - AT THE TOP */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-stone-900 text-white rounded-md">
            <Sliders size={14} className="text-emerald-400" />
          </div>
          <h3 className="font-serif text-sm font-semibold text-stone-950 uppercase tracking-wide">
            {language === "vi" ? "1. Chọn Vai Trò Thẩm Quyền Lâm Sàng" : "1. Select Clinical Authority Role"}
          </h3>
        </div>
        <p className="text-xs text-stone-500 font-light leading-relaxed max-w-3xl">
          {language === "vi" 
            ? "Chọn vai trò thẩm quyền lâm sàng của bạn trước. Lựa chọn của bạn sẽ tự động cấu hình các kiểm tra an toàn động, thuật toán ẩn danh dữ liệu và các lớp bảo vệ quyền riêng tư dữ liệu." 
            : "Choose your clinical authority profile first. Your selection automatically configures dynamic safety checks, de-identification algorithms, and data privacy shields."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {EXPERTISE_PROFILES.map((profile) => {
            const isSelected = currentExpertise === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => onExpertiseChange(profile.id)}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer relative ${
                  isSelected
                    ? "bg-stone-900 border-stone-900 text-white shadow-sm scale-[0.995]"
                    : "bg-white border-stone-200 hover:border-stone-400 text-stone-850 hover:bg-stone-50/50"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {language === "vi" ? (
                        profile.id === "PATIENT" ? "Người Bệnh / Phổ Thông" :
                        profile.id === "MD_PRACTITIONER" ? "Bác Sĩ Lâm Sàng" :
                        profile.id === "PHARMACIST" ? "Dược Sĩ Lâm Sàng" :
                        profile.id === "PATHOLOGIST" ? "Bác Sĩ Giải Phẫu Bệnh" :
                        profile.name
                      ) : (
                        profile.name.replace(/Expertise|Expert|Advocate|Practitioner/g, "").trim()
                      )}
                    </span>
                    {isSelected ? (
                      <span className="px-1.5 py-0.25 bg-emerald-500 text-white text-[8px] font-mono font-medium rounded-full shrink-0">
                        {language === "vi" ? "Hoạt Động" : "Active"}
                      </span>
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-stone-300" />
                    )}
                  </div>
                  <p className={`text-[10px] leading-normal line-clamp-2 ${
                    isSelected ? "text-stone-300 font-light" : "text-stone-500 font-light"
                  }`}>
                    {language === "vi" ? (
                      profile.id === "PATIENT" ? "Giải thích cá nhân hóa, từ vựng dễ hiểu, kế hoạch hành động rõ ràng và đối thoại giáo dục hỗ trợ." :
                      profile.id === "MD_PRACTITIONER" ? "Chẩn đoán phân biệt chuyên sâu, chỉ số lâm sàng, phân giai đoạn bệnh học và hướng dẫn điều trị." :
                      profile.id === "PHARMACIST" ? "Tương tác thuốc chi tiết, cơ chế chuyển hóa CYP450, khoảng trị liệu và hồ sơ sinh hóa sinh học." :
                      profile.id === "PATHOLOGIST" ? "Dung sai phân tích chỉ số sinh học, hình thái học mô học, các biến số nhuộm tế bào và giới hạn sinh hóa." :
                      profile.description
                    ) : (
                      profile.description
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SECTION: Consent for Regulatory Acceptance */}
      <div className="pt-4 border-t border-stone-150 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-stone-900 text-white rounded-md">
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <h3 className="font-serif text-sm font-semibold text-stone-950 uppercase tracking-wide">
            {language === "vi" ? "2. Tuân Thủ Quy Định & Chấp Thuận" : "2. Compliance & Regulatory Acceptance"}
          </h3>
        </div>
        
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
          consentGranted 
            ? "bg-emerald-50/40 border-emerald-200 text-emerald-800" 
            : "bg-amber-50/40 border-amber-200 text-amber-800"
        }`}>
          <div className="flex items-start gap-3">
            <input
              id="registry-regulatory-consent"
              type="checkbox"
              checked={consentGranted}
              onChange={(e) => onToggleConsent(e.target.checked)}
              className="w-4 h-4 rounded mt-0.5 accent-emerald-600 cursor-pointer shrink-0"
            />
            <div className="space-y-0.5">
              <label htmlFor="registry-regulatory-consent" className="text-xs font-bold font-mono uppercase tracking-wider block cursor-pointer select-none">
                {language === "vi" ? "Thỏa Thuận Đồng Ý Bảo Vệ Dữ Liệu Nhà Điều Hành (HIPAA / GDPR / CCPA)" : "Operator Data Protection Consent Accord (HIPAA / GDPR / CCPA)"}
              </label>
              <p className="text-[11px] font-light text-stone-600 leading-normal max-w-2xl">
                {consentGranted 
                  ? (language === "vi" ? "✓ Hệ thống được phép tạm thời tổng hợp lịch sử sinh học của bệnh nhân vào bộ nhớ cache cục bộ an toàn." : "✓ System authorized to temporarily aggregate patient biological history into secure local cache memory.")
                  : (language === "vi" ? "✗ Chấp thuận quy định hiện đang bị tắt. Vui lòng đồng ý với các tiêu chuẩn bảo vệ dữ liệu cục bộ trước khi kéo hồ sơ lịch sử." : "✗ Regulatory consent is currently disabled. Please accept local data protection standards before pulling historical records.")}
              </p>
            </div>
          </div>
          
          <div className="shrink-0">
            {consentGranted ? (
              <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-400 text-emerald-800 text-[9px] font-mono font-bold rounded uppercase">
                {language === "vi" ? "Giao thức hoạt động" : "Active Protocol"}
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-400 text-amber-800 text-[9px] font-mono font-bold rounded uppercase animate-pulse">
                {language === "vi" ? "Yêu cầu hành động" : "Action Required"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. SECTION: Patient Ledger & Verification Input */}
      <div className="pt-4 border-t border-stone-150 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-stone-900 text-white rounded-md">
            <Database size={14} className="text-emerald-400" />
          </div>
          <h3 className="font-serif text-sm font-semibold text-stone-950 uppercase tracking-wide">
            {language === "vi" ? "3. Xác Minh Sổ Cái Bệnh Nhân" : "3. Patient Ledger Verification"}
          </h3>
        </div>
        <p className="text-xs text-stone-500 font-light leading-relaxed">
          {language === "vi" 
            ? "Xác minh và kéo các tài liệu lâm sàng trước đó từ hệ thống đăng ký bệnh nhân an toàn bằng mã Patient ID duy nhất." 
            : "Verify and pull previous clinical dossiers from the secure patient registry using the unique Patient ID tag."}
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchId}
              disabled={!currentExpertise}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder={
                !currentExpertise 
                  ? (language === "vi" ? "Vui lòng chọn Vai Trò Thẩm Quyền trước..." : "Please select a Clinical Role first...") 
                  : isSecurityMasked 
                    ? (language === "vi" ? "Nhập mã ID ẩn (ví dụ: pat-cardio-992)" : "Enter masked ID (e.g. pat-cardio-992)") 
                    : (language === "vi" ? "Nhập Patient ID (ví dụ: pat-cardio-992)" : "Enter Patient ID (e.g. pat-cardio-992)")
              }
              className="w-full text-xs font-mono pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-stone-900 disabled:bg-stone-50 disabled:text-stone-400"
            />
          </div>
          <button
            onClick={() => handleRetrievePatient(searchId)}
            disabled={isSearching || !searchId.trim() || !currentExpertise}
            className="px-5 py-2.5 bg-stone-900 hover:bg-emerald-750 disabled:bg-stone-100 disabled:text-stone-400 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            {isSearching ? <RefreshCw size={12} className="animate-spin" /> : <ArrowRight size={12} />}
            <span>{language === "vi" ? "Đồng Bộ Sổ Cái" : "Sync Ledger Context"}</span>
          </button>
        </div>

        {/* Feedback messages */}
        {searchError && (
          <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-fadeIn">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-600" />
            <p>{searchError}</p>
          </div>
        )}
        {searchSuccess && (
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-fadeIn">
            <UserCheck size={14} className="shrink-0 mt-0.5 text-emerald-600" />
            <p>{searchSuccess}</p>
          </div>
        )}
      </div>

      {/* 4. SECTION: Active Patient context details - FULL WIDTH IF LOADED */}
      {activePatientId && (
        <div className="pt-4 border-t border-stone-150 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold block">
              {language === "vi" ? "Tóm Tắt Bối Cảnh Bệnh Nhân Hoạt Động" : "Active Patient Context Summary"}
            </span>
            <button 
              onClick={() => {
                setActivePatientId(null);
                onLoadRecords("", []);
                setSearchId("");
                setSearchSuccess(null);
              }}
              className="text-[10px] font-mono text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              {language === "vi" ? "Gỡ Hồ Sơ Hoạt Động" : "Unload Active Profile"}
            </button>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-150 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <User size={14} className="text-emerald-600" />
                  {currentLoadedPatient ? currentLoadedPatient.name : (language === "vi" ? "Hồ Sơ Bệnh Nhân Hoạt Động" : "Active Patient Profile")}
                </h4>
                <p className="text-[11px] font-mono text-stone-500 font-light leading-none">
                  {language === "vi" ? "Mã Patient ID Đăng Ký:" : "Registry Patient ID:"} <span className="font-semibold text-stone-700">{activePatientId}</span>
                </p>
                {currentLoadedPatient && (
                  <p className="text-xs text-stone-500 font-light">
                    {((currentLoadedPatient.gender === "Male" || currentLoadedPatient.gender === "Nam") ? (language === "vi" ? "Nam" : "Male") : (currentLoadedPatient.gender === "Female" || currentLoadedPatient.gender === "Nữ") ? (language === "vi" ? "Nữ" : "Female") : currentLoadedPatient.gender)} • {language === "vi" ? "Ngày sinh: " : "Born: "} {currentLoadedPatient.birth} • {currentLoadedPatient.facility}
                  </p>
                )}
              </div>
              <div className="text-right text-xs">
                <span className="text-emerald-600 font-medium flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  {language === "vi" ? "Đồng bộ Hồ Sơ Hoàn Tất" : "Dossier Sync Complete"}
                </span>
              </div>
            </div>

            {currentLoadedPatient && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2.5 border-t border-stone-200">
                {/* Column 1: Biobank */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5">
                    <FlaskConical size={12} className="text-emerald-600" />
                    {language === "vi" ? "Sổ Đăng Ký Ngân Hàng Sinh Học" : "Biobank Registry"}
                  </span>
                  {currentLoadedPatient.biobankConsent ? (
                    <div className="bg-white rounded-xl p-3 border border-stone-200 text-xs space-y-2 h-full">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-800">
                          {language === "vi" ? "Mẫu Được Ủy Quyền" : "Authorized Specs"}
                        </span>
                        <span className="px-1.5 py-0.25 bg-emerald-50 border border-emerald-200 text-emerald-850 text-[8.5px] font-mono font-bold rounded">
                          {language === "vi" ? "Đã Chấp Thuận" : "Consented"}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-stone-600 font-light">
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span>{language === "vi" ? "Ống Mẫu Máu" : "Blood Tubes"}</span>
                          <span className="font-semibold text-stone-850">
                            {currentLoadedPatient.biobankInfo?.bloodTubesCount || 0} {language === "vi" ? "đã lưu trữ" : "stored"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span>{language === "vi" ? "Mẫu Nước Tiểu" : "Urine Sample"}</span>
                          <span className="font-semibold text-stone-850">
                            {currentLoadedPatient.biobankInfo?.urineSample ? (language === "vi" ? "Có" : "Yes") : (language === "vi" ? "Không" : "No")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span>{language === "vi" ? "Mẫu Phân" : "Stool Sample"}</span>
                          <span className="font-semibold text-stone-850">
                            {currentLoadedPatient.biobankInfo?.stoolSample ? (language === "vi" ? "Có" : "Yes") : (language === "vi" ? "Không" : "No")}
                          </span>
                        </div>
                      </div>
                      {currentLoadedPatient.biobankInfo?.otherSamples && currentLoadedPatient.biobankInfo.otherSamples.length > 0 && (
                        <div className="pt-1.5 border-t border-stone-150">
                          <span className="text-[8.5px] font-mono text-stone-400 block uppercase mb-1">
                            {language === "vi" ? "Bệnh phẩm khác:" : "Specimens:"}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {currentLoadedPatient.biobankInfo.otherSamples.map((sample, idx) => (
                              <span key={idx} className="px-1.5 py-0.25 bg-stone-50 border border-stone-200 text-[9px] text-stone-700 rounded font-mono">
                                {sample}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-3 border border-stone-200 text-xs text-stone-500 font-light h-full flex flex-col justify-between">
                      <p className="leading-relaxed">
                        {language === "vi" ? "Chưa có Chấp thuận Ngân hàng sinh học để phân phối bệnh phẩm." : "No Biobank Consent granted for distributing specimens."}
                      </p>
                      <span className="self-start px-1.5 py-0.25 bg-stone-100 border border-stone-200 text-stone-500 text-[8.5px] font-mono font-bold rounded">
                        ✗ {language === "vi" ? "Không Chấp Thuận" : "No Consent"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Column 2: Omics Data */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5">
                    <Dna size={12} className="text-purple-600" />
                    {language === "vi" ? "Dữ Liệu Đa Hệ Omics" : "Multi-Omics Datasets"}
                  </span>
                  {currentLoadedPatient.omicsData ? (
                    <div className="bg-white rounded-xl p-3 border border-stone-200 text-xs space-y-2.5 h-full">
                      <div className="flex flex-wrap gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-medium border ${currentLoadedPatient.omicsData.dnaSequenced ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-stone-50 text-stone-400 border-stone-150"}`}>
                          DNA
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-medium border ${currentLoadedPatient.omicsData.rnaSequenced ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-stone-50 text-stone-400 border-stone-150"}`}>
                          RNA
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-medium border ${currentLoadedPatient.omicsData.proteinProfiling ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-stone-50 text-stone-400 border-stone-150"}`}>
                          PROT
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-medium border ${currentLoadedPatient.omicsData.metabolomics ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-stone-50 text-stone-400 border-stone-150"}`}>
                          METAB
                        </span>
                      </div>
                      
                      {currentLoadedPatient.omicsData.details && (
                        <div className="space-y-1.5 text-[11px] leading-snug">
                          {currentLoadedPatient.omicsData.details.dnaVariantCount && (
                            <div className="flex justify-between border-b border-stone-100 pb-1">
                              <span className="text-stone-400">{language === "vi" ? "Hệ gen" : "Genomics"}</span>
                              <span className="font-semibold text-stone-800 text-right text-[10px]">{currentLoadedPatient.omicsData.details.dnaVariantCount}</span>
                            </div>
                          )}
                          {currentLoadedPatient.omicsData.details.rnaExpressedGenes && (
                            <div className="flex justify-between border-b border-stone-100 pb-1">
                              <span className="text-stone-400">{language === "vi" ? "Hệ phiên mã" : "Transcripts"}</span>
                              <span className="font-semibold text-stone-800 text-right text-[10px]">{currentLoadedPatient.omicsData.details.rnaExpressedGenes}</span>
                            </div>
                          )}
                          {currentLoadedPatient.omicsData.details.proteinBiomarkers && (
                            <div>
                              <span className="text-[8.5px] font-mono text-stone-400 block uppercase mb-0.5">
                                {language === "vi" ? "Mục tiêu phân tích:" : "Assayed Targets:"}
                              </span>
                              <p className="bg-stone-50 p-1 text-[9.5px] font-mono rounded text-stone-700 leading-tight">
                                {currentLoadedPatient.omicsData.details.proteinBiomarkers.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-3 border border-stone-200 text-xs text-stone-450 italic font-light h-full flex items-center justify-center">
                      {language === "vi" ? "Chưa kết nối dữ liệu phân tích phân tử." : "No molecular profiling dataset mapped."}
                    </div>
                  )}
                </div>

                {/* Column 3: Scans & Images */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5">
                    <ImageIcon size={12} className="text-blue-600" />
                    {language === "vi" ? "Kho Lưu Trữ Kết Quả Quét Lâm Sàng" : "Clinical Scans Repository"}
                  </span>
                  {currentLoadedPatient.images && currentLoadedPatient.images.length > 0 ? (
                    <div className="space-y-2">
                      {currentLoadedPatient.images.map((image) => (
                        <div key={image.id} className="bg-white rounded-xl p-3 border border-stone-200 text-[11px] space-y-1.5 shadow-sm">
                          <div className="flex items-center justify-between border-b border-stone-150 pb-1">
                            <span className="px-1.5 py-0.25 bg-blue-50 text-blue-800 border border-blue-150 rounded text-[8.5px] font-mono font-bold uppercase">
                              {language === "vi" ? `ẢNH CHỤP ${image.type}` : `${image.type} SCAN`}
                            </span>
                            <span className="text-[9px] font-mono text-stone-400">{image.date}</span>
                          </div>
                          <p className="font-bold text-stone-800 leading-snug">
                            {language === "vi" ? "Vùng:" : "Region:"} {image.bodyPart}
                          </p>
                          <p className="text-stone-600 font-light leading-snug bg-stone-50 p-1.5 rounded border border-stone-100">
                            <strong>{language === "vi" ? "Kết quả:" : "Findings:"}</strong> {image.findings}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-3 border border-stone-200 text-xs text-stone-450 italic font-light h-full flex items-center justify-center">
                      {language === "vi" ? "Không có dữ liệu hình ảnh lâm sàng được đồng bộ." : "No medical imaging reports synchronized."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

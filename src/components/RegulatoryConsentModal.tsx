import React, { useState } from "react";
import { ShieldCheck, Lock, Eye, AlertTriangle, FileText, X, CheckSquare } from "lucide-react";

interface RegulatoryConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  language?: string;
}

export default function RegulatoryConsentModal({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  language,
}: RegulatoryConsentModalProps) {
  const [agreedGDPR, setAgreedGDPR] = useState(false);
  const [agreedHIPAA, setAgreedHIPAA] = useState(false);
  const [agreedCCPA, setAgreedCCPA] = useState(false);

  if (!isOpen) return null;

  const allChecked = agreedGDPR && agreedHIPAA && agreedCCPA;

  return (
    <div id="regulatory-consent-backdrop" className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        id="regulatory-consent-box" 
        className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-fadeIn"
      >
        {/* Modal Header */}
        <div className="bg-stone-950 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-stone-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500 text-stone-950 rounded-lg">
              <ShieldCheck size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-white">
                {language === "vi" ? "Chấp Thuận Bảo Mật Dữ Liệu Lâm Sàng (v2.1)" : "Clinical Data Protection Consent (v2.1)"}
              </h3>
              <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                {language === "vi" ? "Cổng Tuân Thủ Quy Định GDPR • HIPAA • CCPA/CPRA" : "GDPR • HIPAA • CCPA/CPRA Regulatory Compliance Gate"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors p-1 rounded hover:bg-stone-900/80 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body / Information Scrolls */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-700 leading-relaxed font-light">
          
          <div className="bg-emerald-50/40 border border-emerald-150/50 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-mono font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={13} className="text-emerald-700" />
              {language === "vi" ? "Giao Thức Lưu Trữ Phi Tập Trung Đối Xứng" : "Symmetric Decentralized Storage Protocol"}
            </h4>
            <p className="text-xs text-stone-655">
              {language === "vi" 
                ? "Aegis Clinical sử dụng cấu hình lưu trữ cục bộ được bảo mật an toàn. Không có bất kỳ tài liệu chẩn đoán, hình ảnh quét, hoặc chỉ số sinh học nào được tải ngược lên máy chủ của chúng tôi hoặc được lưu trữ vĩnh viễn. Việc phân tích được thực hiện thông qua các điểm cuối bộ nhớ tạm thời và quyền sở hữu dữ liệu được giữ trực tiếp trên thiết bị cục bộ của bạn."
                : "Aegis Clinical utilizes sandboxed local storage configurations. No diagnostic documents, imaging scans, or parsed biological variables are ever uploaded back to our servers or saved permanently. Evaluation is executed via transient memory endpoints, transferring retention authority directly to your localized device runtime."}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider font-mono">
              {language === "vi" ? "Các Điều Khoản Tuân Thủ Pháp Lý" : "Legally Discovered Compliance Terms"}
            </h4>

            {/* GDPR Box */}
            <div className="border border-stone-150 rounded-xl p-4 bg-stone-50/50 hover:bg-stone-50 transition-colors">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox"
                  id="chk-gdpr"
                  checked={agreedGDPR}
                  onChange={(e) => setAgreedGDPR(e.target.checked)}
                  className="w-4 h-4 rounded mt-0.5 accent-emerald-600 cursor-pointer"
                />
                <div className="space-y-1">
                  <label htmlFor="chk-gdpr" className="text-xs font-bold text-stone-900 uppercase tracking-wide font-mono flex items-center gap-1.5 cursor-pointer select-none">
                    {language === "vi" ? "Thỏa Thuận Tuân Thủ GDPR Điều 6 & 9 (EU)" : "GDPR Article 6 & 9 Compliance Agreement (EU)"}
                  </label>
                  <p className="text-[11px] text-stone-500">
                    {language === "vi" 
                      ? "Tôi cho phép Aegis xử lý danh mục tập dữ liệu sinh học và bộ gen đặc biệt của tôi theo các quy định GDPR của Liên minh Châu Âu. Tôi giữ toàn quyền sở hữu dữ liệu của mình, với quyền tối cao được yêu cầu xóa bỏ (Điều 17 'Quyền được lãng quên') bất cứ lúc nào thông qua chức năng 'Xóa lịch sử'."
                      : "I authorize Aegis to process my biological & genomic special category datasets under European Union GDPR regulations. I retain full ownership of my data, with the sovereign right to erasure (Article 17 \"Right to be Forgotten\") at any time via the \"Reset Timeline\" mechanism."}
                  </p>
                </div>
              </div>
            </div>

            {/* HIPAA Box */}
            <div className="border border-stone-150 rounded-xl p-4 bg-stone-50/50 hover:bg-stone-50 transition-colors">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox"
                  id="chk-hipaa"
                  checked={agreedHIPAA}
                  onChange={(e) => setAgreedHIPAA(e.target.checked)}
                  className="w-4 h-4 rounded mt-0.5 accent-emerald-600 cursor-pointer"
                />
                <div className="space-y-1">
                  <label htmlFor="chk-hipaa" className="text-xs font-bold text-stone-900 uppercase tracking-wide font-mono flex items-center gap-1.5 cursor-pointer select-none">
                    {language === "vi" ? "Giao Thức Bảo Mật Quyền Riêng Tư HIPAA (US)" : "HIPAA Privacy Shield Protocol (US)"}
                  </label>
                  <p className="text-[11px] text-stone-500">
                    {language === "vi" 
                      ? "Tôi cho phép đối chiếu các thông số sức khỏe qua các ngày chẩn đoán. Không có Thông tin Sức khỏe Cá nhân (PHI) nào được truyền tới mạng quảng cáo của bên thứ ba, trình theo dõi, hoặc mô hình đánh giá rủi ro bảo hiểm."
                      : "I permit the matching of health parameters across diagnostic dates. No Protected Health Information (PHI) is transmitted to third-party ad networks, trackers, or insurance risk evaluation models. Data minimization filters are applied prior to processing."}
                  </p>
                </div>
              </div>
            </div>

            {/* CCPA / California Box */}
            <div className="border border-stone-150 rounded-xl p-4 bg-stone-50/50 hover:bg-stone-50 transition-colors">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox"
                  id="chk-ccpa"
                  checked={agreedCCPA}
                  onChange={(e) => setAgreedCCPA(e.target.checked)}
                  className="w-4 h-4 rounded mt-0.5 accent-emerald-600 cursor-pointer"
                />
                <div className="space-y-1">
                  <label htmlFor="chk-ccpa" className="text-xs font-bold text-stone-900 uppercase tracking-wide font-mono flex items-center gap-1.5 cursor-pointer select-none">
                    {language === "vi" ? "Thỏa Thuận Quyền Riêng Tư Người Tiêu Dùng California (CCPA/CPRA)" : "California Consumer privacy (CCPA/CPRA) Accord"}
                  </label>
                  <p className="text-[11px] text-stone-500">
                    {language === "vi" 
                      ? "Tôi thực hiện quyền của người tiêu dùng California CCPA/CPRA để cho phép theo dõi cục bộ hồ sơ của mình. Theo luật California, tôi cam kết thông tin hồ sơ sinh học của tôi là tuyệt mật và không dùng để bán."
                      : "I exercise my CCPA/CPRA California consumer power to allow localized record tracking. Under California law, I direct Aegis that \"My Biobank Information is Confidential and Not For Sale.\" Opt-out indicators are enforced natively."}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Ethics warning */}
          <div className="flex bg-amber-50 rounded-lg p-3 text-[10.5px] text-amber-900 leading-normal border border-amber-100 gap-2 font-mono">
            <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
            <span>
              {language === "vi" 
                ? "Tuyên bố miễn trừ trách nhiệm: Từ chối đồng ý sẽ ngăn Aegis lưu giữ lịch sử dữ liệu trong bộ nhớ cache cục bộ, các thông tin phân tích sẽ chỉ tồn tại tạm thời trong phiên hoạt động hiện tại."
                : "Disclaimer: Declining consent prevents Aegis from saving history logs in local cache memory, isolating all parsed metadata to the current single-session render context only."}
            </span>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-5 border-t border-stone-150 bg-stone-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button 
            onClick={onDecline}
            className="w-full sm:w-auto px-4 py-2 hover:bg-stone-100 border border-stone-200 hover:border-stone-300 text-stone-600 hover:text-stone-950 text-xs font-medium rounded-lg transition-all cursor-pointer text-center"
          >
            {language === "vi" ? "Từ Chối & Tắt Lưu Trữ" : "Decline & Disable Archival"}
          </button>
          
          <button 
            disabled={!allChecked}
            onClick={onAccept}
            className={`w-full sm:w-auto px-6 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow ${
              allChecked 
                ? "bg-stone-950 text-emerald-400 hover:bg-stone-900 hover:text-emerald-300 cursor-pointer" 
                : "bg-stone-150 text-stone-400 border border-stone-200 cursor-not-allowed"
            }`}
          >
            <ShieldCheck size={14} />
            {language === "vi" ? "Tôi Chấp Nhận & Lưu Trữ Dữ Liệu" : "I Accept All Regulations & Store Data"}
          </button>
        </div>

      </div>
    </div>
  );
}

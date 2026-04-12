import React, { useState, useRef } from 'react';
import { Team } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { Download, Image as ImageIcon, Sparkles, Loader, FileText, Upload, Printer, Trophy, ChevronDown, ChevronUp, RefreshCw, Settings } from 'lucide-react';
import { DEFAULT_REPORT_GENERATION_GUIDELINES } from '../constants';

interface ReportViewProps {
  teams: Team[];
  onClose: () => void;
  reportGenerationGuidelines?: string;
}

// 팀별 AI 피드백 타입 (새로운 구조)
interface TeamFeedbackData {
  pattern_analysis: string;  // 응답 패턴 분석
  feedback: string;  // 강점과 개선점 피드백 (600-800자)
  discussion_topics: string[];  // 토의 주제 3가지 (질문형)
}

interface TeamAIFeedback {
  teamName: string;
  feedback: TeamFeedbackData;
}

const ReportView: React.FC<ReportViewProps> = ({ teams, onClose, reportGenerationGuidelines: initialGuidelines }) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [isGeneratingTeam, setIsGeneratingTeam] = useState(false);
  const [teamFeedbacks, setTeamFeedbacks] = useState<TeamAIFeedback[]>([]);

  // 리포트 생성 지침 (수정 가능)
  const [reportGuidelines, setReportGuidelines] = useState(initialGuidelines || DEFAULT_REPORT_GENERATION_GUIDELINES);
  const [showReportGuidelines, setShowReportGuidelines] = useState(false);

  const teamReportRef = useRef<HTMLDivElement>(null);

  // 단일 점수 기반 순위 (순위 표시용)
  const rankedTeams = [...teams].sort((a, b) => (b.score ?? 100) - (a.score ?? 100));
  const winningTeam = rankedTeams[0];

  // 팀 순서대로 정렬 (리포트용) - 원래 teams 배열 순서 유지
  const orderedTeams = teams;

  // 차트 데이터 (단일 점수)
  const barData = teams.map(t => ({
    name: t.name,
    점수: t.score ?? 100
  }));

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 10);
      setPhotos(newFiles);
    }
  };

  const generatePoster = async () => {
    if (!winningTeam) return;
    if (photos.length === 0) {
      alert("우승팀 사진을 최소 1장 업로드해주세요.");
      return;
    }

    setIsGeneratingPoster(true);
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      const imageParts = await Promise.all(
        photos.slice(0, 3).map(async (file) => {
            const base64 = await fileToBase64(file);
            const base64Data = base64.split(',')[1];
            return {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            };
        })
      );

      const prompt = `
        Create a high-quality, cinematic movie poster celebrating the victory of the team named "${winningTeam.name}".
        Theme: Professional, Leadership, Success, Future.
        The poster should feel inspiring and epic.
        Includes text: "${winningTeam.name}" and "CHAMPIONS".
      `;

      const response = await genAI.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            ...imageParts,
            { text: prompt }
          ]
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
           if (part.inlineData) {
               setPosterUrl(`data:image/png;base64,${part.inlineData.data}`);
               break;
           }
        }
      }

    } catch (e) {
      console.error(e);
      alert("포스터 생성에 실패했습니다.");
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const generateTeamFeedbacks = async () => {
    setIsGeneratingTeam(true);

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const feedbacks: TeamAIFeedback[] = [];

      // 팀 순서대로 리포트 생성 (1팀, 2팀, 3팀...)
      for (const team of orderedTeams) {
        // 시스템 로그 기반 상황+옵션/이유+AI분석 컨텍스트
        const historyContext = team.history.map((h, idx) =>
          `라운드 ${idx + 1}:
          - 상황: ${h.situation || h.cardTitle}
          - 선택: ${h.choiceText}
          - 이유: ${h.reasoning}
          - AI 분석: ${h.aiFeedback}`
        ).join('\n\n');

        const feedbackPrompt = `
          당신은 리더십 교육 전문가입니다. 다음 팀의 게임 플레이 기록을 분석하여 피드백을 한글로 작성해주세요.

          팀명: ${team.name}
          최종 점수: ${team.score ?? 100}점

          === 게임 기록 (시스템 로그) ===
          ${historyContext || '기록 없음'}
          ==============================

          ## 리포트 작성 지침
          1. pattern_analysis: 이 팀의 전체 라운드 응답 패턴을 분석해주세요. (200-300자)
             - 일관된 의사결정 패턴이 있는지
             - 어떤 가치관/성향을 보여주는지
             - 시간이 지나면서 변화가 있었는지

          2. feedback: 이 팀의 강점과 개선점에 대한 종합 피드백을 작성해주세요. (600-800자)
             - 위 게임 기록에서 구체적인 사례를 인용하여 피드백
             - 강점을 먼저 언급하고 개선점을 제시
             - 건설적이고 동기부여가 되는 톤 유지
             - 실제 업무/일상에 적용할 수 있는 조언 포함

          3. discussion_topics: 이 팀의 응답 이유와 AI 분석 결과를 기반으로, 이 팀만을 위한 맞춤형 토의 주제 3가지를 질문형 문장으로 제시해주세요.
             - 팀의 실제 응답과 관련된 구체적인 질문
             - 팀원들이 서로 토론하기 좋은 개방형 질문
             - 자기성찰과 개선을 유도하는 질문

          다음 JSON 형식으로 작성해주세요:
          {
            "pattern_analysis": "응답 패턴 분석 내용 (200-300자)",
            "feedback": "강점과 개선점 피드백 (600-800자)",
            "discussion_topics": ["질문형 토의주제 1?", "질문형 토의주제 2?", "질문형 토의주제 3?"]
          }
        `;

        try {
          const feedbackResponse = await genAI.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: feedbackPrompt,
            config: { responseMimeType: "application/json" }
          });

          const parsed = JSON.parse(feedbackResponse.text || '{}');
          feedbacks.push({
            teamName: team.name,
            feedback: parsed
          });
        } catch (err) {
          console.error(`Team ${team.name} feedback failed:`, err);
          feedbacks.push({
            teamName: team.name,
            feedback: {
              pattern_analysis: '피드백 생성에 실패했습니다.',
              feedback: '피드백 생성에 실패했습니다.',
              discussion_topics: []
            }
          });
        }
      }

      setTeamFeedbacks(feedbacks);

    } catch (error) {
      console.error('Team feedbacks generation failed:', error);
      alert('팀별 피드백 생성에 실패했습니다.');
    } finally {
      setIsGeneratingTeam(false);
    }
  };

  const handlePrint = () => {
    const printContent = teamReportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Blue Marble Gamification - 팀별 리포트</title>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
          * { font-family: 'Noto Sans KR', sans-serif; box-sizing: border-box; }
          body { padding: 20px; max-width: 900px; margin: 0 auto; color: #333; line-height: 1.6; }
          h1 { color: #1e3a8a; border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; }
          h2 { color: #1e3a8a; margin-top: 30px; }
          .team-section { page-break-inside: avoid; margin-bottom: 40px; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; font-weight: bold; }
          .topic-item { padding: 10px; margin: 8px 0; background: #f3f4f6; border-radius: 4px; }
          @media print { .team-section { page-break-after: always; } }
        </style>
      </head>
      <body>${printContent.innerHTML}</body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const handleDownloadHTML = () => {
    const reportContent = teamReportRef.current;
    if (!reportContent) return;

    // 최종 순위 섹션도 포함
    const rankingHTML = rankedTeams.map((team, idx) => `
      <div style="padding:12px;border:2px solid #000;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;${idx === 0 ? 'background:#fef9c3;' : 'background:#fff;'}">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:24px;font-weight:900;">${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1)}</span>
          <span style="font-size:18px;font-weight:900;">${team.name}</span>
        </div>
        <span style="font-size:24px;font-weight:900;color:#1e3a8a;">${team.score ?? 100}점</span>
      </div>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blue Marble Gamification - 미션 리포트</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
    * { font-family: 'Noto Sans KR', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
    body { padding: 40px 20px; max-width: 960px; margin: 0 auto; color: #333; line-height: 1.7; background: #f8fafc; }
    .header { background: #facc15; border: 4px solid #000; padding: 24px 32px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; }
    .header .subtitle { font-size: 14px; color: #666; margin-top: 4px; }
    .section { background: #fff; border: 3px solid #000; padding: 24px; margin-bottom: 24px; box-shadow: 4px 4px 0 #000; }
    .section h2 { font-size: 22px; font-weight: 900; color: #1e3a8a; border-bottom: 3px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 16px; text-transform: uppercase; }
    .team-section { page-break-inside: avoid; margin-bottom: 32px; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; background: #fff; }
    .team-section h3 { font-size: 18px; font-weight: 900; color: #1e3a8a; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 700; }
    tr:nth-child(even) { background: #f9fafb; }
    .analysis-box { padding: 14px; border-radius: 8px; margin-bottom: 12px; }
    .pattern { background: #eff6ff; border-left: 4px solid #3b82f6; }
    .feedback { background: #f0fdf4; border-left: 4px solid #22c55e; }
    .discussion { background: #faf5ff; border-left: 4px solid #a855f7; }
    .analysis-box h5 { font-weight: 700; margin-bottom: 6px; }
    .topic-item { background: #fff; padding: 10px; margin: 6px 0; border-radius: 6px; border: 1px solid #e9d5ff; display: flex; gap: 10px; align-items: flex-start; }
    .topic-num { background: #a855f7; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    @media print { body { padding: 10px; background: #fff; } .section { box-shadow: none; } .team-section { page-break-after: always; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎲 Blue Marble Gamification - 미션 리포트</h1>
    <div class="subtitle">생성일: ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
  </div>

  <div class="section">
    <h2>🏆 최종 순위</h2>
    ${rankingHTML}
  </div>

  <div class="section">
    <h2>📝 팀별 AI 리포트</h2>
    ${reportContent.innerHTML}
  </div>

  <div class="footer">
    Blue Marble Gamification &copy; ${new Date().getFullYear()} | AI-Powered Leadership Education
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `미션리포트_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-blue-900/90 z-[60] overflow-y-auto backdrop-blur-sm">
      <div className="container mx-auto p-4 md:p-8 min-h-screen">
        <div className="bg-white w-full border-4 border-black shadow-[10px_10px_0_0_#000] mb-8">
          <div className="flex justify-between items-center p-6 border-b-4 border-black bg-yellow-400 sticky top-0 z-10">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">미션 리포트</h1>
            <button onClick={onClose} className="px-6 py-2 bg-black text-white font-bold border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-all">
              닫기 X
            </button>
          </div>

          <div className="p-4 md:p-8 grid gap-8">
            {/* 최종 순위 */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="border-4 border-black p-4 bg-gray-50 shadow-hard">
                <h2 className="text-2xl font-black mb-6 uppercase border-b-4 border-black pb-2 flex justify-between">
                  <span>최종 순위</span>
                  <span className="text-sm font-normal text-gray-500 normal-case">게임 점수 기준</span>
                </h2>
                <div className="space-y-3">
                  {rankedTeams.map((team, idx) => (
                    <div key={team.id} className={`p-4 border-4 border-black flex items-center justify-between ${idx === 0 ? 'bg-yellow-100' : 'bg-white'}`}>
                      <div className="flex items-center gap-4">
                        <span className={`text-3xl font-black ${
                          idx === 0 ? 'text-yellow-600' :
                          idx === 1 ? 'text-gray-500' :
                          idx === 2 ? 'text-orange-600' :
                          'text-gray-700'
                        }`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </span>
                        <span className="text-xl font-black">{team.name}</span>
                      </div>
                      <span className="text-3xl font-black text-blue-800">{team.score ?? 100}점</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 점수 차트 */}
              <div className="border-4 border-black p-4 bg-white shadow-hard flex flex-col">
                <h2 className="text-2xl font-black mb-6 uppercase border-b-4 border-black pb-2">점수 분포</h2>
                <div className="flex-1 min-h-[300px] border-2 border-black bg-gray-50 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#000" />
                      <XAxis dataKey="name" tick={{fill: 'black', fontWeight: 'bold'}} />
                      <YAxis tick={{fill: 'black', fontWeight: 'bold'}} />
                      <Tooltip contentStyle={{ border: '2px solid black', borderRadius: '0' }} />
                      <Bar dataKey="점수" fill="#3B82F6" stroke="#000" strokeWidth={2} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 우승팀 포스터 */}
            <div className="border-4 border-black p-6 bg-gradient-to-r from-yellow-50 to-white shadow-hard">
              <div className="flex items-center gap-3 mb-4 border-b-4 border-black pb-2">
                <Sparkles className="text-yellow-500" size={32} />
                <h2 className="text-2xl font-black uppercase">우승팀 기념 AI 포스터</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="font-bold text-gray-700">1. 팀 사진 업로드 (1-10장)</p>
                  <label className="block p-4 border-4 border-dashed border-gray-400 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors text-center">
                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className="text-gray-400" />
                      <span className="font-bold text-gray-500">{photos.length > 0 ? `${photos.length}개 사진 선택됨` : "클릭하여 사진 업로드"}</span>
                    </div>
                  </label>

                  <button onClick={generatePoster} disabled={photos.length === 0 || isGeneratingPoster}
                    className="w-full py-4 bg-black text-white font-black uppercase text-xl border-4 border-black shadow-hard hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isGeneratingPoster ? <Loader className="animate-spin" /> : <ImageIcon />}
                    {isGeneratingPoster ? "AI 포스터 생성 중..." : "포스터 생성"}
                  </button>
                </div>

                <div className="bg-gray-200 border-4 border-black min-h-[300px] flex items-center justify-center relative">
                  {posterUrl ? (
                    <div className="relative group w-full h-full">
                      <img src={posterUrl} alt="Generated Poster" className="w-full h-full object-contain p-2" />
                      <a href={posterUrl} download={`팀_${winningTeam?.name}_우승_포스터.png`}
                        className="absolute bottom-4 right-4 bg-white text-black p-2 border-2 border-black font-bold shadow-hard hover:bg-yellow-400 flex items-center gap-2">
                        <Download size={16} /> 다운로드
                      </a>
                    </div>
                  ) : (
                    <span className="text-gray-400 font-bold uppercase text-center p-4">포스터 미리보기 영역</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI 리포트 생성 버튼 */}
            <div className="border-4 border-black p-6 bg-white shadow-hard">
              <h2 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2">AI 팀별 리포트 생성</h2>

              {/* 리포트 생성 지침 설정 */}
              <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border-2 border-amber-300">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-amber-700 flex items-center gap-2">
                    <Settings size={16} />
                    리포트 생성 지침 (수정 가능)
                  </label>
                  <button
                    onClick={() => setShowReportGuidelines(!showReportGuidelines)}
                    className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800"
                  >
                    {showReportGuidelines ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showReportGuidelines ? '접기' : '펼치기'}
                  </button>
                </div>

                {showReportGuidelines && (
                  <div className="space-y-2">
                    <textarea
                      value={reportGuidelines}
                      onChange={(e) => setReportGuidelines(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
                      placeholder="리포트 생성 지침을 입력하세요..."
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-amber-600">
                        수정된 지침은 팀별 리포트 생성 시 적용됩니다.
                      </p>
                      <button
                        onClick={() => setReportGuidelines(DEFAULT_REPORT_GENERATION_GUIDELINES)}
                        className="text-xs text-amber-600 hover:text-amber-800 underline flex items-center gap-1"
                      >
                        <RefreshCw size={12} />
                        기본값으로 초기화
                      </button>
                    </div>
                  </div>
                )}

                {!showReportGuidelines && (
                  <p className="text-xs text-amber-600">
                    {reportGuidelines === DEFAULT_REPORT_GENERATION_GUIDELINES
                      ? '현재 기본 리포트 생성 지침이 적용됩니다.'
                      : '✏️ 수정된 리포트 생성 지침이 적용됩니다.'}
                  </p>
                )}
              </div>

              <button onClick={generateTeamFeedbacks} disabled={isGeneratingTeam}
                className="w-full py-4 bg-blue-600 text-white border-4 border-black font-bold uppercase hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-xl">
                {isGeneratingTeam ? <Loader className="animate-spin" /> : <FileText size={24} />}
                {isGeneratingTeam ? "AI 분석 중..." : "팀별 리포트 생성"}
              </button>
            </div>

            {/* 팀별 리포트 */}
            {teamFeedbacks.length > 0 && (
              <div className="border-4 border-black p-6 bg-blue-50 shadow-hard">
                <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-2">
                  <h2 className="text-2xl font-black uppercase">팀별 AI 리포트</h2>
                  <div className="flex gap-2">
                    <button onClick={handleDownloadHTML} className="px-4 py-2 bg-green-600 text-white border-2 border-black font-bold flex items-center gap-2 hover:bg-green-700">
                      <Download size={18} /> HTML 다운로드
                    </button>
                    <button onClick={handlePrint} className="px-4 py-2 bg-blue-500 text-white border-2 border-black font-bold flex items-center gap-2 hover:bg-blue-600">
                      <Printer size={18} /> PDF로 저장/인쇄
                    </button>
                  </div>
                </div>

                <div ref={teamReportRef} className="space-y-8">
                  <h1 className="text-2xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2">Blue Marble Gamification - 팀별 리포트</h1>

                  {/* 팀 순서대로 표시 (1팀, 2팀, 3팀...) */}
                  {orderedTeams.map((team, idx) => {
                    const feedback = teamFeedbacks.find(f => f.teamName === team.name);
                    const rank = rankedTeams.findIndex(t => t.id === team.id) + 1;

                    return (
                      <div key={team.id} className="team-section bg-white p-6 border-2 border-gray-300 rounded-lg">
                        <h3 className="text-xl font-black mb-4 text-blue-900 flex items-center justify-between">
                          <span>{idx + 1}팀 - {team.name}</span>
                          <span className="text-lg font-bold text-gray-600">
                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`} {team.score ?? 100}점
                          </span>
                        </h3>

                        {/* a) 시스템 로그 기반 상황+옵션/이유+AI분석 테이블 */}
                        {team.history.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                              📋 게임 플레이 기록
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-sm">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-3 py-2 text-left w-16">라운드</th>
                                    <th className="border border-gray-300 px-3 py-2 text-left">상황</th>
                                    <th className="border border-gray-300 px-3 py-2 text-left">선택</th>
                                    <th className="border border-gray-300 px-3 py-2 text-left">이유</th>
                                    <th className="border border-gray-300 px-3 py-2 text-left">AI 분석</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {team.history.map((h, hIdx) => (
                                    <tr key={hIdx} className={hIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="border border-gray-300 px-3 py-2 text-center font-bold">{hIdx + 1}</td>
                                      <td className="border border-gray-300 px-3 py-2">{h.situation || h.cardTitle}</td>
                                      <td className="border border-gray-300 px-3 py-2">{h.choiceText}</td>
                                      <td className="border border-gray-300 px-3 py-2">{h.reasoning}</td>
                                      <td className="border border-gray-300 px-3 py-2">{h.aiFeedback}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {feedback?.feedback && (
                          <div className="space-y-4">
                            {/* b) 응답 패턴 분석 */}
                            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                              <h5 className="font-bold text-blue-800 mb-2">📊 응답 패턴 분석</h5>
                              <p className="text-gray-700 leading-relaxed">{feedback.feedback.pattern_analysis}</p>
                            </div>

                            {/* c) 강점과 개선점 피드백 */}
                            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                              <h5 className="font-bold text-green-800 mb-2">💡 강점 및 개선점 피드백</h5>
                              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{feedback.feedback.feedback}</p>
                            </div>

                            {/* d) 맞춤형 토의 주제 */}
                            {feedback.feedback.discussion_topics?.length > 0 && (
                              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                                <h5 className="font-bold text-purple-800 mb-3">💬 팀 토의 주제</h5>
                                <ol className="space-y-3">
                                  {feedback.feedback.discussion_topics.map((item: string, i: number) => (
                                    <li key={i} className="text-gray-700 bg-white p-3 rounded-lg border border-purple-200 flex items-start gap-3">
                                      <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">{i + 1}</span>
                                      <span className="font-medium">{item}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;

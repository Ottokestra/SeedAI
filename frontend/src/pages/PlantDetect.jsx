import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import ResultDisplay from '@/components/ResultDisplay';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";


export default function PlantDetect() {
    const location = useLocation();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 관리법 페이지에서 전달된 이미지 URL
    const { uploadedImageUrl, plantName } = location.state || {};

    const handleUpload = async (formData) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(`${API_BASE}/api/detect`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                // FastAPI에서 detail을 반환하는 패턴 고려
                let message = '서버 오류가 발생했습니다.';
                try {
                    const errorData = await response.json();
                    message = errorData.detail || message;
                } catch (_) {}
                throw new Error(message);
            }

            const data = await response.json();

            if (data?.success) {
                setResult(data);
            } else {
                throw new Error('분석에 실패했습니다.');
            }
        } catch (err) {
            console.error('Error:', err);
            const msg = err?.message || '알 수 없는 오류가 발생했습니다.';
            setError(msg);
            // 필요 시 토스트로 전환 가능
            alert(`오류: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-[calc(100vh-73px)] bg-emerald-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* 헤더 */}
                <motion.header
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl font-bold text-emerald-800 mb-3">🐛 병충해 진단</h1>
                    <p className="text-lg text-emerald-700">
                        식물 사진을 업로드하면 AI가 자동으로 병충해를 진단합니다
                    </p>
                </motion.header>

                {/* 메인 콘텐츠 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {!result && <ImageUploader onUpload={handleUpload} loading={loading} initialImageUrl={uploadedImageUrl} initialPlantName={plantName} />}

                    {loading && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                                <div className="text-center">
                                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-emerald-500 animate-spin" />
                                    <h3 className="text-xl font-bold text-emerald-800 mb-2">이미지 분석 중...</h3>
                                    <p className="text-emerald-600">
                                        AI가 병충해를 진단하고 있습니다. 잠시만 기다려주세요.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                            <p className="text-red-700 font-medium">⚠️ {error}</p>
                        </div>
                    )}

                    {result && !loading && <ResultDisplay result={result} />}
                </motion.div>
            </div>
        </div>
    );
}

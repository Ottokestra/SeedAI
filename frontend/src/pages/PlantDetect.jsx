import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ResultDisplay from '@/components/ResultDisplay';
import "./plant-detect.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";


export default function PlantDetect() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        <div className="pd-app">
            <header className="pd-header">
                <h1>🌿 Plant Disease Detection</h1>
                <p className="pd-subtitle">YOLOv8 기반 식물 병충해 자동 감지 시스템</p>
            </header>

            <main className="pd-main">
                {!result && <ImageUploader onUpload={handleUpload} loading={loading} />}

                {loading && (
                    <div className="pd-loading">
                        <div className="pd-spinner" />
                        <p>이미지를 분석하고 있습니다...</p>
                    </div>
                )}

                {error && (
                    <div className="pd-error">
                        <p>⚠️ {error}</p>
                    </div>
                )}

                {result && !loading && <ResultDisplay result={result} />}
            </main>

            <footer className="pd-footer">
                <p>Powered by YOLOv8 & FastAPI & React</p>
            </footer>
        </div>
    );
}

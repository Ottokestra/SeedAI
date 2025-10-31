import { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (formData) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '서버 오류가 발생했습니다.');
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        throw new Error('분석에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
      alert(`오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌿 Plant Disease Detection</h1>
        <p className="subtitle">YOLOv8 기반 식물 병충해 자동 감지 시스템</p>
      </header>

      <main className="app-main">
        {!result && (
          <ImageUploader onUpload={handleUpload} loading={loading} />
        )}

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>이미지를 분석하고 있습니다...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>⚠️ {error}</p>
          </div>
        )}

        {result && !loading && (
          <ResultDisplay result={result} />
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by YOLOv8 & FastAPI & React</p>
      </footer>
    </div>
  );
}

export default App;

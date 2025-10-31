import { useNavigate } from 'react-router-dom';
import './ResultDisplay.css';

function ResultDisplay({ result }) {
  const navigate = useNavigate();
  if (!result) return null;

  const { 
    species, 
    diseases, 
    result_image, 
    diagnosis_status,
    max_confidence,
    status_message,
    treatment_advice,
    llm_enabled
  } = result;

  // 신뢰도 상태별 배지 스타일
  const getStatusBadge = () => {
    switch (diagnosis_status) {
      case 'high_confidence':
        return <div className="status-badge high">✅ 정확한 진단</div>;
      case 'medium_confidence':
        return <div className="status-badge medium">⚠️ 유사 데이터</div>;
      case 'low_confidence':
        return <div className="status-badge low">❌ 낮은 신뢰도</div>;
      default:
        return <div className="status-badge unknown">❓ 감지 안 됨</div>;
    }
  };

  return (
    <div className={`result-container ${diagnosis_status}`}>
      <h2>📊 진단 결과</h2>
      
      {/* 신뢰도 상태 배지 */}
      {getStatusBadge()}

      {/* 상태 메시지 */}
      {status_message && (
        <div className={`status-message ${diagnosis_status}`}>
          <p>{status_message}</p>
        </div>
      )}

      {/* 결과 이미지 */}
      <div className="result-image-container">
        {result_image && (
          <img
            src={`data:image/jpeg;base64,${result_image}`}
            alt="Detection Result"
            className="result-image"
          />
        )}
      </div>

      {/* 식물 종 정보 */}
      {species?.name && species.name !== '알 수 없음' && (
        <div className="species-info">
          <h3>🌱 식물 정보</h3>
          <div className="info-card">
            <div className="info-row">
              <span className="label">식물 종:</span>
              <span className="value species-name">{species.name}</span>
            </div>
            <div className="info-row">
              <span className="label">신뢰도:</span>
              <span className={`value confidence ${diagnosis_status}`}>
                {(species.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 병충해 정보 */}
      {diseases && diseases.length > 0 && (
        <div className="diseases-info">
          <h3>🐛 병충해 진단</h3>
          <div className="diseases-list">
            {diseases.map((disease, index) => (
              <div key={index} className={`disease-card ${diagnosis_status}`}>
                <div className="disease-header">
                  {diagnosis_status === 'high_confidence' && (
                    <span className="diagnosis-tag">최종 진단</span>
                  )}
                  <span className="disease-name">{disease.full_name || disease.name}</span>
                </div>
                <div className="disease-details">
                  <div className="detail-row">
                    <span className="detail-label">병충해:</span>
                    <span className="detail-value">{disease.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">신뢰도:</span>
                    <span className={`detail-value confidence-value ${diagnosis_status}`}>
                      {(disease.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="confidence-bar">
                  <div
                    className={`confidence-fill ${diagnosis_status}`}
                    style={{ width: `${disease.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 방제법 섹션 (고신뢰도만) */}
      {treatment_advice && llm_enabled && (
        <div className="treatment-section">
          <h3>🤖 AI 방제법 및 예방법</h3>
          <div className="treatment-card">
            <div className="treatment-badge">
              <span>GPT-4o mini</span>
            </div>
            <div className="treatment-content">
              {treatment_advice.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 재시도 안내 (중간/저신뢰도) */}
      {(diagnosis_status === 'medium_confidence' || diagnosis_status === 'low_confidence') && (
        <div className="retry-guidance">
          <h3>💡 더 정확한 진단을 위한 팁</h3>
          <ul>
            <li>✨ 잎사귀를 더 선명하게 촬영해주세요</li>
            <li>🎯 잎사귀 하나를 화면 중앙에 크게 배치하세요</li>
            <li>💡 밝은 조명에서 촬영하세요</li>
            <li>📷 초점이 맞는지 확인하세요</li>
          </ul>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="action-buttons">
        <button
          className="new-analysis-button"
          onClick={() => window.location.reload()}
        >
          🔄 새로운 이미지 분석
        </button>
        {species?.name && species.name !== '알 수 없음' && (
          <button
            className="predict-button"
            onClick={() => {
              const plantId = species.name.toLowerCase().replace(/\s+/g, '-');
              navigate(`/predict/${plantId}`, {
                state: { 
                  identification: {
                    plant_name: species.name,
                    confidence: species.confidence
                  }
                }
              });
            }}
          >
            📈 예측해줘
          </button>
        )}
      </div>
    </div>
  );
}

export default ResultDisplay;

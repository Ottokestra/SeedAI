import { useState } from 'react';
import './ImageUploader.css';

function ImageUploader({ onUpload, loading }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [userNotes, setUserNotes] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      alert('지원하지 않는 파일 형식입니다. JPG, PNG, WEBP, BMP 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    setSelectedImage(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      alert('먼저 이미지를 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedImage);
    
    // 사용자 의견 추가 (있는 경우)
    if (userNotes && userNotes.trim()) {
      formData.append('user_notes', userNotes.trim());
    }

    await onUpload(formData);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  return (
    <div className="uploader-container">
      <h2>🌿 식물 병충해 감지</h2>
      <p className="description">식물 사진을 업로드하면 종과 병충해를 자동으로 감지합니다.</p>

      <div
        className={`drop-zone ${dragActive ? 'active' : ''} ${previewUrl ? 'has-image' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !previewUrl && document.getElementById('file-input').click()}
      >
        {previewUrl ? (
          <div className="preview-container">
            <img src={previewUrl} alt="Preview" className="preview-image" />
            <button className="reset-button" onClick={(e) => { e.stopPropagation(); handleReset(); }}>
              ✕
            </button>
          </div>
        ) : (
          <div className="drop-zone-content">
            <div className="upload-icon">📷</div>
            <p>이미지를 드래그 앤 드롭하거나 클릭하여 선택하세요</p>
            <p className="file-types">JPG, PNG, WEBP, BMP (최대 10MB)</p>
          </div>
        )}
      </div>

      <input
        id="file-input"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
        onChange={handleImageChange}
        style={{ display: 'none' }}
      />

      {selectedImage && (
        <>
          <div className="user-notes-container">
            <label htmlFor="user-notes" className="notes-label">
              💬 추가 상황 설명 (선택사항)
            </label>
            <textarea
              id="user-notes"
              className="user-notes-input"
              placeholder="예: 잎에 검은 반점이 생기고 말라가고 있어요..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="notes-hint">
              {userNotes.length}/500자 • 증상이나 상황을 자세히 적으면 더 정확한 방제법을 제공받을 수 있습니다.
            </div>
          </div>
          
          <div className="button-group">
            <button
              className="analyze-button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? '분석 중...' : '🔍 분석하기'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ImageUploader;


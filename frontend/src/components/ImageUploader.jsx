import { useState, useEffect } from 'react';
import { Upload, Camera, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ImageUploader({ onUpload, loading, initialImageUrl, initialPlantName }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [userNotes, setUserNotes] = useState('');

  // 전달된 이미지 URL을 초기 상태로 설정
  useEffect(() => {
    if (initialImageUrl) {
      setPreviewUrl(initialImageUrl);

      // URL에서 이미지를 Blob으로 변환하여 File 객체 생성
      fetch(initialImageUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'plant-image.jpg', { type: blob.type });
          setSelectedImage(file);
        })
        .catch(err => {
          console.error('이미지 로드 실패:', err);
        });

      // 식물 이름을 사용자 노트에 추가
      if (initialPlantName) {
        setUserNotes(`${initialPlantName} - `);
      }
    }
  }, [initialImageUrl, initialPlantName]);

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
    setUserNotes('');
  };

  // 미리보기 배경 스타일
  const bgStyle = previewUrl
    ? {
        backgroundImage: `url(${previewUrl})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {};

  return (
    <div className="space-y-6">
      {/* Hidden inputs */}
      <input
        id="file-input"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
        onChange={handleImageChange}
        style={{ display: 'none' }}
      />
      <input
        id="camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        style={{ display: 'none' }}
      />

      {/* 이미지가 없을 때 */}
      {!previewUrl && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 갤러리에서 선택 */}
            <label
              htmlFor="file-input"
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-300 rounded-xl hover:bg-emerald-50 cursor-pointer transition-all hover:border-emerald-500 hover:scale-105 bg-white"
            >
              <ImageIcon className="w-16 h-16 text-emerald-500 mb-3" />
              <span className="text-lg font-semibold text-emerald-700 mb-1">
                갤러리에서 선택
              </span>
              <span className="text-sm text-emerald-600">
                저장된 사진 선택
              </span>
            </label>

            {/* 카메라로 촬영 */}
            <label
              htmlFor="camera-input"
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-300 rounded-xl hover:bg-emerald-50 cursor-pointer transition-all hover:border-emerald-500 hover:scale-105 bg-white"
            >
              <Camera className="w-16 h-16 text-emerald-500 mb-3" />
              <span className="text-lg font-semibold text-emerald-700 mb-1">
                카메라로 촬영
              </span>
              <span className="text-sm text-emerald-600">
                웹캠으로 촬영
              </span>
            </label>
          </div>

          {/* 드래그 앤 드롭 안내 */}
          <div
            className={`p-6 border-2 border-dashed rounded-xl text-center transition-all ${
              dragActive
                ? 'border-emerald-500 bg-emerald-100'
                : 'border-emerald-200 bg-emerald-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className={`w-12 h-12 mx-auto mb-2 transition-all ${
              dragActive ? 'text-emerald-600 scale-110' : 'text-emerald-400'
            }`} />
            <p className="text-emerald-700 font-medium">
              {dragActive ? '이미지를 여기에 놓으세요!' : '또는 이미지를 드래그 & 드롭'}
            </p>
            <p className="text-sm text-emerald-600 mt-1">
              JPG, PNG, WEBP, BMP (최대 10MB)
            </p>
          </div>
        </div>
      )}

      {/* 이미지가 있을 때 - 미리보기 */}
      {previewUrl && (
        <>
          <div
            className="w-full aspect-video rounded-xl border-2 border-emerald-200 bg-white overflow-hidden"
            style={bgStyle}
          />

          <div className="flex gap-3">
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <X className="w-4 h-4 mr-2" />
              이미지 삭제
            </Button>
          </div>
        </>
      )}

      {/* 사용자 의견 입력 */}
      {selectedImage && (
        <>
          <div className="space-y-2">
            <label htmlFor="user-notes" className="block text-sm font-semibold text-emerald-800">
              💬 추가 상황 설명 (선택사항)
            </label>
            <textarea
              id="user-notes"
              className="w-full p-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors resize-vertical"
              placeholder="예: 잎에 검은 반점이 생기고 말라가고 있어요..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-emerald-600">
              {userNotes.length}/500자 • 증상이나 상황을 자세히 적으면 더 정확한 방제법을 제공받을 수 있습니다.
            </p>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="px-10 py-6 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '분석 중...' : '🔍 분석하기'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default ImageUploader;


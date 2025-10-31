import { useState, useEffect } from 'react';
import { identifyPlant } from '../api/client';
import ResultList from '../components/ResultList';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { usePersistedState } from '@/hooks/usePersistedState';
import { Loader2, Upload, X, RefreshCw, Camera, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import React, { useRef } from "react";


export default function Identify() {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // 영구 저장 상태 (뒤로가기 시 복원)
  const [preview, setPreview] = usePersistedState('identify-preview', '');
  const [result, setResult] = usePersistedState('identify-result', null);
  
  // 임시 상태
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // 파일 처리 공통 함수
  const processFile = (f) => {
    if (!f) return;
    
    if (!f.type.startsWith('image/')) {
      toast({
        title: '이미지 파일만 업로드 가능합니다',
        description: 'jpg, png 등의 이미지 파일을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setFile(f);
    const previewUrl = URL.createObjectURL(f);
    setPreview(previewUrl);
    setResult(null);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    processFile(f);
  };

  // Drag & Drop 핸들러
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // dragOver는 계속 발생하므로 상태는 dragEnter에서만 설정
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // 드래그 영역에 들어올 때만 상태 변경
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // 실제로 영역을 벗어날 때만 상태 변경 (자식 요소로 이동 시 제외)
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // 페이지 전체에서 드래그 앤 드롭 기본 동작 방지
  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // 전체 페이지에서 드래그 시 브라우저 기본 동작 방지
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);

    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  // 웹캠 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
        setCameraReady(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: '카메라 접근 실패',
        description: '카메라 권한을 허용해주세요.',
        variant: 'destructive',
      });
    }
  };

  // 웹캠 중지
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setCameraReady(false);
  };

  // 사진 촬영
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // 캔버스 크기를 비디오 크기에 맞춤
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임을 캔버스에 그림
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 캔버스를 Blob으로 변환
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);

        setFile(file);
        setPreview(previewUrl);
        setResult(null);
        stopCamera();

        toast({
          title: '촬영 완료!',
          description: '이미지가 업로드되었습니다.',
        });
      }
    }, 'image/jpeg', 0.95);
  };

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleRemoveImage = () => {
    setFile(null);
    setPreview('');
    setResult(null);
    
    // input 요소 리셋
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';

    toast({
      title: '이미지가 삭제되었습니다',
      description: '새로운 이미지를 업로드해주세요.',
    });
  };

  const handleSubmit = async () => {
    if (!file && !preview) {
      toast({
        title: '이미지를 선택해주세요',
        description: '식별할 식물 이미지를 업로드해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!file) {
      toast({
        title: '이미지를 다시 선택해주세요',
        description: '저장된 이미지로는 식별할 수 없습니다. 새로 업로드해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // 실제 백엔드 AI 식별 (단일 파일)
      const data = await identifyPlant(file);
      setResult(data);

      if (data.success) {
        // 로컬스토리지에 종식별 결과 저장
        localStorage.setItem('latest-plant-identification', JSON.stringify({
          identification: data.identification,
          careGuide: data.care_guide,
          growthPrediction: data.growth_prediction,
          uploadedImageUrl: preview,
          timestamp: new Date().toISOString(),
        }));

        toast({
          title: '식별 완료!',
          description: data.message || `${data.identification.plant_name} 식별 완료`,
          variant: 'default',
        });
      } else {
        toast({
          title: '식별 실패',
          description: data.message || '식물을 식별할 수 없습니다.',
          variant: 'destructive',
        });
      }
      
    } catch (error) {
      console.error('Identify error:', error);
      const errorMsg = error.response?.data?.detail || '네트워크 오류가 발생했습니다.';
      toast({
        title: '식별 실패',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 미리보기 배경 스타일
  const bgStyle = preview
    ? {
        backgroundImage: `url(${preview})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {};

  return (
    <div className="w-full py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.header 
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-emerald-800 mb-3">식물 종 식별/분류</h1>
          <p className="text-lg text-emerald-700">
            식물 사진 1장을 업로드하면 AI가 종을 식별하고 상태를 진단합니다.
          </p>
        </motion.header>

        {/* 파일 업로드 = 미리보기 영역 */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept="image/*"
            multiple={false}
            onChange={handleFileChange}
            className="hidden"
            aria-label="식물 이미지 업로드"
          />
          <input
            ref={cameraInputRef}
            id="camera-upload"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
            aria-label="카메라로 식물 촬영"
          />
          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* 이미지가 없을 때 - 갤러리/카메라 선택 */}
          {!preview && !showCamera && (
            <div className="space-y-4">
              <p className="text-center text-emerald-700 font-medium">
                이미지를 업로드하는 방법을 선택하세요
              </p>
              <div className="grid grid-cols-2 gap-4">
                {/* 갤러리에서 선택 */}
                <label
                  htmlFor="file-upload"
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
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-300 rounded-xl hover:bg-emerald-50 cursor-pointer transition-all hover:border-emerald-500 hover:scale-105 bg-white"
                >
                  <Camera className="w-16 h-16 text-emerald-500 mb-3" />
                  <span className="text-lg font-semibold text-emerald-700 mb-1">
                    카메라로 촬영
                  </span>
                  <span className="text-sm text-emerald-600">
                    웹캠으로 촬영
                  </span>
                </button>
              </div>

              {/* 드래그 앤 드롭 안내 */}
              <div
                className={`p-6 border-2 border-dashed rounded-xl text-center transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-100'
                    : 'border-emerald-200 bg-emerald-50'
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className={`w-12 h-12 mx-auto mb-2 transition-all ${
                  isDragging ? 'text-emerald-600 scale-110' : 'text-emerald-400'
                }`} />
                <p className="text-emerald-700 font-medium">
                  {isDragging ? '이미지를 여기에 놓으세요!' : '또는 이미지를 드래그 & 드롭'}
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  JPG, PNG 등 이미지 파일
                </p>
              </div>
            </div>
          )}

          {/* 이미지가 있을 때 - 미리보기 */}
          {preview && !showCamera && (
            /* 이미지가 있을 때 - 미리보기 */
            <div
              className="w-full aspect-video rounded-xl border-2 border-emerald-200 bg-white overflow-hidden relative"
              style={bgStyle}
            >
              {/* 드래그 중 오버레이 */}
              {isDragging && (
                <div
                  className="absolute inset-0 bg-emerald-500/80 flex flex-col items-center justify-center z-10"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-16 h-16 mb-4 text-white animate-bounce" />
                  <p className="text-white font-bold text-xl mb-2">이미지를 여기에 놓으세요</p>
                  <p className="text-white/90 text-sm">새로운 이미지로 변경됩니다</p>
                </div>
              )}

              {/* 드래그 영역 (전체) */}
              <div
                className="absolute inset-0"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            </div>
          )}

          {preview && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-emerald-600 text-center">
                💡 다른 이미지로 변경하려면 아래 버튼을 사용하거나 드래그 & 드롭하세요
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                <Button
                  onClick={handleRemoveImage}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  aria-label="이미지 삭제"
                >
                  <X className="w-4 h-4 mr-2" />
                  이미지 삭제
                </Button>
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 cursor-pointer"
                    aria-label="갤러리에서 다시 선택"
                    asChild
                  >
                    <span>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      갤러리
                    </span>
                  </Button>
                </label>
                <Button
                  onClick={startCamera}
                  type="button"
                  variant="outline"
                  className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400"
                  aria-label="카메라로 다시 촬영"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  카메라
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* 식별 시작 버튼 */}
        <motion.div 
          className="flex justify-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={!preview || loading}
            className="px-10 py-6 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="식별 시작"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                식별 중...
              </>
            ) : (
              '식별 시작'
            )}
          </Button>
        </motion.div>

        {/* 결과 표시 */}
        {result && result.success && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ResultList 
            identification={result.identification}
            careGuide={result.care_guide}
            growthPrediction={result.growth_prediction}
            uploadedImageUrl={preview}
          />
          </motion.div>
        )}
      </div>

      {/* 카메라 촬영 모달 */}
      <Dialog open={showCamera} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="max-w-4xl w-full p-0 gap-0 bg-black border-none">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
            <DialogTitle className="text-white text-2xl font-bold flex items-center gap-2">
              <Camera className="w-6 h-6" />
              카메라로 촬영하기
            </DialogTitle>
          </DialogHeader>

          <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* 카메라 준비 중 */}
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />
                <p className="text-white text-lg font-medium">카메라를 준비하고 있습니다...</p>
              </div>
            )}

            {/* 안내 오버레이 */}
            {cameraReady && (
              <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-black/60 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium">
                  📸 식물을 화면 중앙에 맞춰주세요
                </div>
              </div>
            )}

            {/* 가이드 프레임 */}
            {cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[80%] h-[80%] border-4 border-white/30 rounded-xl" />
              </div>
            )}
          </div>

          {/* 하단 버튼 영역 */}
          <div className="p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-4">
            <Button
              onClick={stopCamera}
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full px-8"
            >
              <X className="w-5 h-5 mr-2" />
              취소
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={!cameraReady}
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-12 py-6 text-lg font-bold shadow-lg shadow-emerald-500/50 disabled:opacity-50"
            >
              <Camera className="w-6 h-6 mr-2" />
              📸 촬영하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            {/* 미리보기 이미지 동일 스타일 */}
            <div
              className="w-full aspect-video rounded-xl border border-emerald-200 mb-6"
              style={bgStyle}
            />
            
            {/* 로딩 메시지 */}
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-emerald-500 animate-spin" />
              <h3 className="text-xl font-bold text-emerald-800 mb-2">이미지 분석 중...</h3>
              <p className="text-emerald-600">
                AI가 식물을 식별하고 있습니다. 잠시만 기다려주세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


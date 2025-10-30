import { useState, useEffect } from 'react';
import { identifyPlant } from '../api/client';
import ResultList from '../components/ResultList';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePersistedState } from '@/hooks/usePersistedState';
<<<<<<< HEAD
import { Loader2, Upload } from 'lucide-react';
=======
import { Loader2, Upload, X, RefreshCw } from 'lucide-react';
>>>>>>> origin/dev
import { motion } from 'framer-motion';

export default function Identify() {
  const { toast } = useToast();
  
  // 영구 저장 상태 (뒤로가기 시 복원)
  const [preview, setPreview] = usePersistedState('identify-preview', '');
  const [result, setResult] = usePersistedState('identify-result', null);
  
  // 임시 상태
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
=======
  const [isDragging, setIsDragging] = useState(false);

  // 파일 처리 공통 함수
  const processFile = (f) => {
>>>>>>> origin/dev
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

<<<<<<< HEAD
=======
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

  const handleRemoveImage = () => {
    setFile(null);
    setPreview('');
    setResult(null);
    
    // input 요소 리셋
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.value = '';
    }

    toast({
      title: '이미지가 삭제되었습니다',
      description: '새로운 이미지를 업로드해주세요.',
    });
  };

>>>>>>> origin/dev
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
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            multiple={false}
            onChange={handleFileChange}
            className="hidden"
            aria-label="식물 이미지 업로드"
          />

          <label
            htmlFor="file-upload"
<<<<<<< HEAD
            className="block w-full aspect-video rounded-xl border-2 border-dashed border-emerald-300 bg-white cursor-pointer hover:bg-emerald-50 transition overflow-hidden"
            style={bgStyle}
          >
            {!preview && (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                <Upload className="w-16 h-16 mb-4 text-emerald-500" aria-hidden="true" />
                <p className="text-emerald-700 font-medium text-lg mb-2">
                  이미지 1장을 업로드하세요
                </p>
                <p className="text-emerald-600 text-sm">
                  클릭하여 파일 선택 (jpg, png 등)
                </p>
              </div>
            )}
          </label>

          {preview && (
            <p className="text-sm text-emerald-600 text-center">
              💡 다른 이미지로 변경하려면 위 영역을 클릭하세요
            </p>
=======
            className={`block w-full aspect-video rounded-xl border-2 border-dashed bg-white cursor-pointer transition-all overflow-hidden relative ${
              isDragging 
                ? 'border-emerald-500 bg-emerald-100 scale-[1.02]' 
                : 'border-emerald-300 hover:bg-emerald-50'
            }`}
            style={bgStyle}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!preview && (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 pointer-events-none">
                <Upload 
                  className={`w-16 h-16 mb-4 transition-all ${
                    isDragging ? 'text-emerald-600 scale-110' : 'text-emerald-500'
                  }`} 
                  aria-hidden="true" 
                />
                <p className={`font-medium text-lg mb-2 transition-colors ${
                  isDragging ? 'text-emerald-800' : 'text-emerald-700'
                }`}>
                  {isDragging ? '이미지를 여기에 놓으세요' : '이미지 1장을 업로드하세요'}
                </p>
                <p className="text-emerald-600 text-sm">
                  {isDragging ? '파일을 드롭하여 업로드' : '클릭하여 파일 선택 또는 드래그 & 드롭 (jpg, png 등)'}
                </p>
              </div>
            )}
            
            {/* 드래그 중 오버레이 (미리보기 이미지가 있을 때) */}
            {preview && isDragging && (
              <div className="absolute inset-0 bg-emerald-500/80 flex flex-col items-center justify-center z-10 pointer-events-none">
                <Upload className="w-16 h-16 mb-4 text-white animate-bounce" aria-hidden="true" />
                <p className="text-white font-bold text-xl mb-2">이미지를 여기에 놓으세요</p>
                <p className="text-white/90 text-sm">새로운 이미지로 변경됩니다</p>
              </div>
            )}
          </label>

          {preview && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-emerald-600 text-center">
                💡 다른 이미지로 변경하려면 위 영역을 클릭/드래그하거나 아래 버튼을 사용하세요
              </p>
              <div className="flex gap-3">
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
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer"
                    aria-label="다시 선택"
                    asChild
                  >
                    <span>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      다시 선택
                    </span>
                  </Button>
                </label>
              </div>
            </div>
>>>>>>> origin/dev
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


import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Leaf, Upload, Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { identifyPlant } from '../api/client';

export default function CareList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // 파일 처리
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

    setSelectedFile(f);
    const previewUrl = URL.createObjectURL(f);
    setPreview(previewUrl);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    processFile(f);
  };

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // 식별 및 관리법 보기
  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({
        title: '이미지를 선택해주세요',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const data = await identifyPlant(selectedFile);

      if (data.success) {
        toast({
          title: '식별 완료!',
          description: `${data.identification.plant_name} 식별 완료`,
        });

        // 관리법 페이지로 이동
        const plantId = data.identification.plant_name.toLowerCase().replace(/\s+/g, '-');
        navigate(`/care/${plantId}`, {
          state: {
            identification: data.identification,
            careGuide: data.care_guide,
            uploadedImageUrl: preview,
          },
        });
      } else {
        toast({
          title: '식별 실패',
          description: data.message || '식물을 식별할 수 없습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('식별 오류:', error);
      toast({
        title: '식별 실패',
        description: '네트워크 오류가 발생했습니다.',
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
    <div className="w-full min-h-[calc(100vh-73px)] bg-emerald-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <motion.header 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-emerald-800 mb-3">식물 종 식별</h1>
          <p className="text-lg text-emerald-700">
            먼저 식물을 식별해주세요
          </p>
        </motion.header>

        {/* 파일 업로드 영역 */}
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
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            id="camera-upload"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* 이미지가 없을 때 */}
          {!preview && (
            <div className="space-y-4">
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
                <label
                  htmlFor="camera-upload"
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
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className={`w-12 h-12 mx-auto mb-2 transition-all ${
                  dragActive ? 'text-emerald-600 scale-110' : 'text-emerald-400'
                }`} />
                <p className="text-emerald-700 font-medium">
                  {dragActive ? '이미지를 여기에 놓으세요!' : '또는 이미지를 드래그 & 드롭'}
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  JPG, PNG 등 이미지 파일
                </p>
              </div>
            </div>
          )}

          {/* 이미지가 있을 때 - 미리보기 */}
          {preview && (
            <>
              <div
                className="w-full aspect-video rounded-xl border-2 border-emerald-200 bg-white overflow-hidden"
                style={bgStyle}
              />
              
              <div className="flex gap-3">
                <Button
                  onClick={handleRemoveImage}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  <X className="w-4 h-4 mr-2" />
                  이미지 삭제
                </Button>
              </div>
            </>
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
            onClick={handleAnalyze}
            disabled={!preview || loading}
            className="px-10 py-6 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Leaf className="w-5 h-5 mr-2" />
                관리법 보기
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div
              className="w-full aspect-video rounded-xl border border-emerald-200 mb-6"
              style={bgStyle}
            />
            
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


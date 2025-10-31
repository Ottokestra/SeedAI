# LLM 모델 파일 안내

## 모델 파일 위치
이 폴더에 다음 모델 파일을 배치하세요:

```
./models/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf
```

## 모델 다운로드
Qwen2.5-1.5B-Instruct Q4_K_M 모델을 다운로드하여 이 폴더에 저장하세요.

## 환경 변수 설정
모델 경로를 변경하려면 `.env` 파일에 다음을 추가하세요:

```
LLM_PROVIDER=llama_cpp
LLM_MODEL_PATH=./models/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf
LLM_MAX_TOKENS=512
LLM_THREADS=8
LLM_TEMPERATURE=0.6
```

## LLM 없이 사용
LLM을 사용하지 않고 템플릿만 사용하려면:

```
LLM_PROVIDER=none
```

이 경우 템플릿 기반 텍스트가 생성됩니다 (빠르고 무료).


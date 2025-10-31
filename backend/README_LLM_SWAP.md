
# LLM 교체 패치 (빠르고 무료)
KoGPT2 대신 **llama.cpp + Qwen2.5-1.5B-Instruct(GGUF, 4bit)** 로컬 CPU 추론을 사용하거나,
LLM 미설치 환경에서는 **템플릿 기반**으로 즉시 동작합니다.

## 설치
pip install llama-cpp-python

## 모델 파일
./models/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf  (경로는 LLM_MODEL_PATH로 변경 가능)

## 환경 변수(선택)
LLM_PROVIDER=llama_cpp
LLM_MODEL_PATH=./models/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf
LLM_MAX_TOKENS=512
LLM_THREADS=8
LLM_TEMPERATURE=0.6

## 코드 연결 (growth.py 예시)
from textgen_adapter import render_plant_analysis

analysis_text = render_plant_analysis(
    plant_name=graph.plant_name,
    K=graph.max_size,            # 또는 추정 K
    start_cm=start_cm,
    unit=unit,
    periods=periods,
    good_series=[p.size for p in graph.good_growth],
    bad_series=[p.size for p in graph.bad_growth],
)

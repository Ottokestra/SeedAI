
from __future__ import annotations
import os
from typing import List

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "llama_cpp")
LLM_MODEL_PATH = os.getenv("LLM_MODEL_PATH", "./models/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf")
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "512"))
LLM_THREADS = int(os.getenv("LLM_THREADS", str(os.cpu_count() or 4)))
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.6"))

def render_plant_analysis(plant_name: str, K: float, start_cm: float, unit: str, periods: int, good_series: List[float], bad_series: List[float]) -> str:
    if LLM_PROVIDER == "llama_cpp":
        try:
            from llama_cpp import Llama
            llm = Llama(model_path=LLM_MODEL_PATH, n_ctx=4096, n_threads=LLM_THREADS, verbose=False)
            messages = [
                {"role":"system","content":"당신은 한국어로 간결하게 조언하는 원예 보조가이드입니다."},
                {"role":"user","content": (
                    "아래 데이터(식물명, 성장시나리오)로 8~12문장 내 "
                    f"{plant_name}의 월별 성장 경향 요약, 관리 팁 4개, 주의사항 3개를 bullet로 제시하세요.\n"
                    f"- 식물명: {plant_name}\n"
                    f"- 단위: {unit}, 기간: {periods}\n"
                    f"- 초기 높이: {start_cm} cm\n"
                    f"- 상한(추정 K): {K} cm\n"
                    f"- 좋은 성장(연속값): {good_series}\n"
                    f"- 나쁜 성장(연속값): {bad_series}\n"
                    "한국어로 짧고 실무적으로 쓰며, 불필요한 수식어는 피하고, 동일한 사실 반복 금지.\n"
                    "섹션 제목은 '요약', '관리 팁', '주의할 점'을 사용하세요."
                )}
            ]
            out = llm.create_chat_completion(messages=messages, max_tokens=LLM_MAX_TOKENS, temperature=LLM_TEMPERATURE)
            content = out["choices"][0]["message"]["content"].strip()
            if content:
                return content
        except Exception:
            pass
    # fallback (no LLM)
    tips = [
        "밝은 간접광을 유지하고 흙이 60~70% 마르면 충분히 관수하세요.",
        "배수력 유지(펄라이트/마사 혼합)와 통풍 확보가 중요합니다.",
        "성장기에는 저농도 액비를 소량·규칙적으로 사용하세요.",
        "잎 표면의 먼지를 닦아 광합성 효율을 높이세요.",
    ]
    warns = [
        "장시간 직사광은 엽소를 유발할 수 있습니다.",
        "장기간 과습은 뿌리부패·곰팡이 반점을 유발합니다.",
        "급격한 온도 변화와 찬바람 유입을 피하세요.",
    ]
    g_avg = round(sum(good_series)/max(1,len(good_series)), 1)
    b_avg = round(sum(bad_series)/max(1,len(bad_series)), 1)
    return (
        "요약\n"
        f"- 대상: {plant_name} / 추정 상한(K): {K} cm / 시작 높이: {start_cm} cm\n"
        f"- 기간: {periods}{'개월' if unit=='month' else '주'} / 단위: {unit}\n"
        f"- 좋은 조건 평균: {g_avg} cm, 나쁜 조건 평균: {b_avg} cm\n"
        f"- 전반적으로 {plant_name}은 안정적인 신장세를 보이며 관리 조건에 따라 편차가 발생할 수 있습니다.\n\n"
        "관리 팁\n- " + "\n- ".join(tips) + "\n\n"
        "주의할 점\n- " + "\n- ".join(warns)
    )

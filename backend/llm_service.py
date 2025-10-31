"""
LLM 서비스 - GPT-4o mini를 활용한 방제법 제시
"""
import os
from openai import OpenAI
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class PlantDiseaseAdvisor:
    """식물 병충해 방제법 제시 서비스"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Args:
            api_key: OpenAI API 키 (환경변수 OPENAI_API_KEY 사용 가능)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if not self.api_key:
            logger.warning("⚠️  OPENAI_API_KEY가 설정되지 않았습니다. LLM 기능이 비활성화됩니다.")
            self.client = None
        else:
            try:
                self.client = OpenAI(api_key=self.api_key)
                logger.info("✅ OpenAI 클라이언트 초기화 완료")
            except Exception as e:
                logger.error(f"❌ OpenAI 클라이언트 초기화 실패: {str(e)}")
                self.client = None
    
    def get_treatment_advice(
        self, 
        plant_species: str, 
        disease: str,
        confidence: float,
        user_notes: Optional[str] = None
    ) -> str:
        """
        식물 병충해에 대한 방제법 및 예방법을 제공합니다.
        
        Args:
            plant_species: 식물 종 (예: "Tomato")
            disease: 병충해명 (예: "Early blight")
            confidence: 신뢰도 (0.0 ~ 1.0)
            user_notes: 사용자 추가 의견 (선택사항)
            
        Returns:
            방제법 및 예방법 텍스트
        """
        if not self.client:
            return "⚠️  AI 방제법 서비스를 사용할 수 없습니다. OPENAI_API_KEY를 설정해주세요."
        
        try:
            # 프롬프트 구성
            prompt = self._build_prompt(plant_species, disease, confidence, user_notes)
            
            # GPT-4o mini 호출
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "당신은 식물 병충해 전문가입니다. "
                            "농부와 가정 원예가들에게 실용적이고 이해하기 쉬운 "
                            "방제법과 예방법을 제공합니다. "
                            "답변은 한국어로, 친절하고 전문적인 어조로 작성하며, "
                            "구체적인 실행 단계를 포함해야 합니다."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            advice = response.choices[0].message.content.strip()
            logger.info(f"✅ LLM 방제법 생성 완료 (식물: {plant_species}, 병충해: {disease})")
            
            return advice
            
        except Exception as e:
            logger.error(f"❌ LLM 호출 오류: {str(e)}")
            return f"⚠️  방제법 생성 중 오류가 발생했습니다: {str(e)}"
    
    def _build_prompt(
        self, 
        plant_species: str, 
        disease: str,
        confidence: float,
        user_notes: Optional[str]
    ) -> str:
        """방제법 요청을 위한 프롬프트를 구성합니다."""
        
        prompt = f"""
식물 병충해 진단 결과:
- 식물 종: {plant_species}
- 병충해/상태: {disease}
- AI 신뢰도: {confidence * 100:.1f}%
"""
        
        if user_notes and user_notes.strip():
            prompt += f"\n사용자 추가 정보:\n{user_notes}\n"
        
        prompt += """
위 진단 결과를 바탕으로 다음 내용을 포함한 실용적인 조언을 제공해주세요:

1. 병충해 개요 (2-3문장)
   - 이 병충해가 무엇인지 간단히 설명
   - 주요 증상 및 특징

2. 즉시 조치 방법 (긴급 대응)
   - 지금 당장 할 수 있는 응급 조치
   - 병 확산 방지 방법

3. 방제법 (단계별)
   - 화학적 방제 (필요시 농약명 포함)
   - 친환경 방제 (유기농 방법)
   - 물리적 방제 (제거, 격리 등)

4. 예방법
   - 재발 방지를 위한 장기 관리 방법
   - 환경 관리 (통풍, 습도, 물 주기 등)

5. 주의사항
   - 방제 시 주의할 점
   - 피해야 할 행동

답변은 실용적이고 구체적으로 작성하되, 전문 용어는 쉽게 풀어서 설명해주세요.
각 섹션은 이모지(📌, 🚨, 💊, 🛡️, ⚠️)를 활용하여 가독성을 높여주세요.
"""
        
        return prompt


# 싱글톤 인스턴스
_advisor_instance: Optional[PlantDiseaseAdvisor] = None


def get_advisor() -> PlantDiseaseAdvisor:
    """
    PlantDiseaseAdvisor 싱글톤 인스턴스를 반환합니다.
    """
    global _advisor_instance
    if _advisor_instance is None:
        _advisor_instance = PlantDiseaseAdvisor()
    return _advisor_instance


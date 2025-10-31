import json
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime
from app.models.schemas import PlantIdentification

# 로컬 파일 저장 디렉토리 (프론트엔드 경로)
# 백엔드 디렉토리 기준으로 상위 디렉토리의 plant-care-final/data 사용
BACKEND_DIR = Path(__file__).parent.parent.parent  # app/services -> app -> backend
FRONTEND_DIR = BACKEND_DIR.parent / "plant-care-final"
DATA_DIR = FRONTEND_DIR / "data"
DATA_DIR.mkdir(exist_ok=True, parents=True)

# 식물 분석 데이터 저장 파일
IDENTIFICATION_FILE = DATA_DIR / "identifications.json"
GROWTH_DATA_FILE = DATA_DIR / "growth_history.json"

# 메모리 기반 저장 (서버 실행 중에만 유지, 창 닫으면 사라짐)
# 형식: {plant_id: [{date: str, height: float}, ...]}
_growth_data: Dict[str, List[Dict[str, Any]]] = {}


def save_identification_data(identification: PlantIdentification, file_hash: Optional[str] = None) -> str:
    """
    식물 분석 데이터를 로컬 파일에 저장합니다.
    
    Args:
        identification: 식물 식별 결과
        file_hash: 파일 해시 (선택적, 중복 방지용)
        
    Returns:
        저장된 데이터 ID
    """
    print(f"[db_utils] 식물 분석 데이터 저장 시작: {identification.plant_name}")
    print(f"[db_utils] 저장 경로: {IDENTIFICATION_FILE}")
    # 기존 데이터 로드
    identifications = {}
    if IDENTIFICATION_FILE.exists():
        try:
            with open(IDENTIFICATION_FILE, 'r', encoding='utf-8') as f:
                identifications = json.load(f)
            print(f"[db_utils] 기존 데이터 로드 완료: {len(identifications)}개 항목")
        except Exception as e:
            print(f"[db_utils] 기존 데이터 로드 실패: {e}")
            identifications = {}
        else:
            print(f"[db_utils] 기존 데이터 파일 없음, 새로 생성")
    
    # 데이터 ID 생성 (식물명 + 타임스탬프)
    data_id = f"{identification.plant_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # 저장할 데이터 구성
    identification_data = {
        "id": data_id,
        "timestamp": datetime.now().isoformat(),
        "file_hash": file_hash,
        "identification": {
            "plant_name": identification.plant_name,
            "scientific_name": identification.scientific_name,
            "confidence": identification.confidence,
            "common_names": identification.common_names or [],
        }
    }
    
    # 데이터 저장
    identifications[data_id] = identification_data
    
    # 파일에 저장
    try:
        with open(IDENTIFICATION_FILE, 'w', encoding='utf-8') as f:
            json.dump(identifications, f, ensure_ascii=False, indent=2)
        print(f"[db_utils] 데이터 저장 완료: {data_id}")
    except Exception as e:
        print(f"[db_utils] 데이터 저장 실패: {e}")
        raise

    return data_id


def load_identification_data(data_id: Optional[str] = None, plant_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    저장된 식물 분석 데이터를 로드합니다.
    
    Args:
        data_id: 데이터 ID (우선순위 1)
        plant_name: 식물명 (최신 데이터 조회)
        
    Returns:
        식물 분석 데이터 또는 None
    """

    print(f"[db_utils] 식물 분석 데이터 로드 시도: data_id={data_id}, plant_name={plant_name}")
    print(f"[db_utils] 로드 경로: {IDENTIFICATION_FILE}")

    if not IDENTIFICATION_FILE.exists():
        print(f"[db_utils] 데이터 파일이 존재하지 않음: {IDENTIFICATION_FILE}")
        return None
    
    try:
        with open(IDENTIFICATION_FILE, 'r', encoding='utf-8') as f:
            identifications = json.load(f)
        print(f"[db_utils] 데이터 파일 로드 완료: {len(identifications)}개 항목")

        if data_id:
            result = identifications.get(data_id)
            if result:
                print(f"[db_utils] data_id로 데이터 찾음: {data_id}")
            else:
                print(f"[db_utils] data_id로 데이터 찾기 실패: {data_id}")
            return result
        elif plant_name:
            # 해당 식물명의 최신 데이터 찾기
            matching = [
                data for data in identifications.values()
                if data.get("identification", {}).get("plant_name") == plant_name
            ]
            print(f"[db_utils] plant_name으로 검색: '{plant_name}' -> {len(matching)}개 매칭")
            if matching:
                # 최신 데이터 반환
                result = sorted(matching, key=lambda x: x.get("timestamp", ""), reverse=True)[0]
                print(f"[db_utils] 최신 데이터 찾음: {result.get('id')} (timestamp: {result.get('timestamp')})")
                return result
            else:
                print(f"[db_utils] plant_name으로 데이터 찾기 실패: '{plant_name}'")
                print(f"[db_utils] 저장된 식물명 목록: {[d.get('identification', {}).get('plant_name') for d in identifications.values()]}")

        return None
    except Exception as e:
        print(f"[db_utils] 식물 분석 데이터 로드 오류: {e}")
        import traceback
        traceback.print_exc()
        return None


def save_growth_log(plant_id: str, date: str, height: float):
    """
    성장 기록을 로컬 파일과 메모리에 저장합니다.
    
    Args:
        plant_id: 식물 ID
        date: 날짜 (문자열)
        height: 높이 (cm)
    """
    # 메모리에 저장
    if plant_id not in _growth_data:
        _growth_data[plant_id] = []
    
    # 기존 기록 확인 및 업데이트 또는 추가
    existing_index = None
    for i, record in enumerate(_growth_data[plant_id]):
        if record["date"] == date:
            existing_index = i
            break
    
    if existing_index is not None:
        # 기존 기록 업데이트
        _growth_data[plant_id][existing_index]["height"] = height
    else:
        # 새 기록 추가
        _growth_data[plant_id].append({"date": date, "height": height})
        # 날짜순 정렬
        _growth_data[plant_id].sort(key=lambda x: x["date"])
    
    # 파일에도 저장
    try:
        growth_history = {}
        if GROWTH_DATA_FILE.exists():
            try:
                with open(GROWTH_DATA_FILE, 'r', encoding='utf-8') as f:
                    growth_history = json.load(f)
            except:
                growth_history = {}
        
        if plant_id not in growth_history:
            growth_history[plant_id] = []
        
        # 파일에서도 중복 확인 및 업데이트
        file_existing_index = None
        for i, record in enumerate(growth_history[plant_id]):
            if record.get("date") == date:
                file_existing_index = i
                break
        
        if file_existing_index is not None:
            growth_history[plant_id][file_existing_index]["height"] = height
        else:
            growth_history[plant_id].append({"date": date, "height": height})
            growth_history[plant_id].sort(key=lambda x: x.get("date", ""))
        
        with open(GROWTH_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(growth_history, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"성장 기록 파일 저장 오류: {e}")


def load_growth_history(plant_id: str) -> List[Dict]:
    """
    성장 기록을 로컬 파일에서 조회합니다.
    
    Args:
        plant_id: 식물 ID
        
    Returns:
        성장 기록 리스트 [{"date": str, "height": float}, ...]
    """
    # 파일에서 로드 시도
    if GROWTH_DATA_FILE.exists():
        try:
            with open(GROWTH_DATA_FILE, 'r', encoding='utf-8') as f:
                growth_history = json.load(f)
                if plant_id in growth_history:
                    return sorted(growth_history[plant_id], key=lambda x: x.get("date", ""))
        except Exception as e:
            print(f"성장 기록 파일 로드 오류: {e}")
    
    # 메모리에서 조회
    if plant_id in _growth_data:
        return sorted(_growth_data[plant_id], key=lambda x: x["date"])
    
    return []


def clear_growth_data():
    """
    모든 성장 데이터를 초기화합니다 (테스트용).
    """
    global _growth_data
    _growth_data = {}
    if GROWTH_DATA_FILE.exists():
        try:
            os.remove(GROWTH_DATA_FILE)
        except:
            pass


def get_all_plant_ids() -> List[str]:
    """
    저장된 모든 식물 ID 목록을 반환합니다.
    
    Returns:
        식물 ID 리스트
    """
    plant_ids = set()
    
    # 파일에서 로드
    if GROWTH_DATA_FILE.exists():
        try:
            with open(GROWTH_DATA_FILE, 'r', encoding='utf-8') as f:
                growth_history = json.load(f)
                plant_ids.update(growth_history.keys())
        except:
            pass
    
    # 메모리에서 로드
    plant_ids.update(_growth_data.keys())
    
    return list(plant_ids)

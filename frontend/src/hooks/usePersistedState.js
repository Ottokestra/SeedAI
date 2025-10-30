import { useState, useEffect } from 'react';

/**
 * localStorage를 사용하여 상태를 영구 저장하는 커스텀 훅
 * @param {string} key - localStorage 키
 * @param {any} initialValue - 초기값
 * @returns {[any, Function]} - [상태, 상태 변경 함수]
 */
export function usePersistedState(key, initialValue) {
  // 초기 상태 로드
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}


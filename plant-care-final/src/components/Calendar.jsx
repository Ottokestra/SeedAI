import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Calendar({ selectedDate, onDateChange }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // 해당 월의 첫날과 마지막날
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  
  // 달력 시작 요일 (0 = 일요일)
  const startDayOfWeek = firstDay.getDay();
  
  // 총 일수
  const daysInMonth = lastDay.getDate();

  // 이전 달로
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // 다음 달로
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 로컬 날짜를 YYYY-MM-DD 형식으로 변환
  const formatLocalDate = (year, month, day) => {
    const yyyy = year;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const todayString = formatLocalDate(today.getFullYear(), today.getMonth(), today.getDate());
    onDateChange(todayString);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (day) => {
    const dateString = formatLocalDate(currentYear, currentMonth, day);
    onDateChange(dateString);
  };

  // 선택된 날짜 확인
  const isSelectedDate = (day) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth &&
      selected.getFullYear() === currentYear
    );
  };

  // 오늘 날짜 확인
  const isToday = (day) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  // 달력 그리드 생성
  const renderCalendar = () => {
    const days = [];
    
    // 빈 칸 추가 (이전 달 날짜)
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square" />
      );
    }

    // 실제 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelectedDate(day);
      const todayDate = isToday(day);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          className={`
            aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition
            ${selected 
              ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
              : todayDate
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'hover:bg-emerald-50 text-gray-700'
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-white rounded-xl border-2 border-emerald-200 p-4 shadow-md max-w-lg mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="p-2 hover:bg-emerald-100 rounded transition"
          aria-label="이전 달"
        >
          <ChevronLeft className="w-5 h-5 text-emerald-700" />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-emerald-800">
            {currentYear}년 {monthNames[currentMonth]}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-sm h-8 px-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            오늘
          </Button>
        </div>

        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 hover:bg-emerald-100 rounded transition"
          aria-label="다음 달"
        >
          <ChevronRight className="w-5 h-5 text-emerald-700" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-semibold py-2 ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-2">
        {renderCalendar()}
      </div>
    </div>
  );
}


import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

export default function GrowthChart({ data, plantName }) {
  return (
    <div className="w-full h-[400px]" aria-label={`${plantName} 성장 예측 차트`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
          <XAxis
            dataKey="month"
            stroke="#065f46"
            style={{ fontSize: '14px', fontWeight: 500 }}
            label={{ value: '경과 시간', position: 'insideBottom', offset: -10, fill: '#065f46' }}
          />
          <YAxis
            stroke="#065f46"
            style={{ fontSize: '14px', fontWeight: 500 }}
            label={{ value: '높이 (cm)', angle: -90, position: 'insideLeft', fill: '#065f46' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #10b981',
              borderRadius: '8px',
              fontSize: '14px',
            }}
            labelStyle={{ color: '#065f46', fontWeight: 'bold' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
            iconType="line"
          />
          
          {/* 예상 범위 영역 (±10%) */}
          <Area
            type="monotone"
            dataKey="max"
            stroke="none"
            fill="#86efac"
            fillOpacity={0.3}
            name="예상 최대"
          />
          <Area
            type="monotone"
            dataKey="min"
            stroke="none"
            fill="#ffffff"
            fillOpacity={1}
            name="예상 최소"
          />
          
          {/* 기준 성장선 */}
          <Line
            type="monotone"
            dataKey="height"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 5 }}
            activeDot={{ r: 7 }}
            name="예상 높이"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}


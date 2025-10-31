// src/components/GrowthChart.jsx
import React from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function GrowthChart({ rows = [], min = 0, max = 200, unitLabel = "cm" }) {
 // 디버깅: 데이터 확인
  console.log("[GrowthChart] 렌더링:", { rowsCount: rows.length, min, max, sampleRow: rows[0] });
 
  if (!rows.length) {
    return <div className="text-center text-emerald-600 py-16">차트 데이터가 없습니다.</div>;
  }
  return (
    <div style={{ width: "100%", height: 360 }}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis domain={[min, max]} label={{ value: unitLabel, angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend />
           {/* 좋은 조건: 초록색 실선 */}
          <Line 
            type="monotone" 
            dataKey="good" 
            name="좋은 조건 성장" 
            stroke="#22c55e" 
            strokeWidth={2} 
            dot={false} 
          />
          {/* 나쁜 조건: 빨간색 실선 */}
          <Line 
            type="monotone" 
            dataKey="bad" 
            name="나쁜 조건 성장" 
            stroke="#ef4444" 
            strokeWidth={2} 
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { quarterlyData } from '../../data/mockGoals';

export default function QuarterlyTrendChart({ data }) {
  const chartData = data || quarterlyData;

  return (
    <div className="card p-5">
      <h3 className="section-title mb-4">Quarterly Performance Trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="quarter" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{
              background: 'rgba(30,41,59,0.95)',
              border: 'none',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '13px',
            }}
            formatter={(v, name) => [`${v}%`, name === 'completion' ? 'Your Score' : name === 'avg' ? 'Team Avg' : 'Target']}
          />
          <Legend formatter={(v) => (
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>
              {v === 'completion' ? 'Your Score' : v === 'avg' ? 'Team Avg' : 'Target'}
            </span>
          )} />
          <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target', fill: '#f59e0b', fontSize: 11, position: 'right' }} />
          <Line type="monotone" dataKey="completion" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#10b981', r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

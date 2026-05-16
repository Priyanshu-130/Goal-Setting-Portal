import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
// Use neon colors
const getColor = (v) => v >= 75 ? '#00e5ff' : v >= 50 ? '#b388ff' : '#ff4081';

export default function EmployeeProgressChart({ data = [] }) {
  const chartData = data.map((d) => ({
    name: d.name ? d.name.split(' ')[0] : 'N/A',
    completion: d.completion || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} barSize={24} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
          dx={-10}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          contentStyle={{
            background: 'rgba(10, 18, 33, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: '#f8fafc',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)'
          }}
          itemStyle={{ color: '#00e5ff' }}
          formatter={(v) => [`${v}%`, 'Completion']}
        />
        <Bar dataKey="completion" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={getColor(entry.completion)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

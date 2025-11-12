import React, { useState } from 'react';
import { MealLogs } from '../types';
import { getAggregatedData } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatsProps {
  mealLogs: MealLogs;
}

type Period = 'week' | 'month'; // Year might be too much data for a simple chart

const Stats: React.FC<StatsProps> = ({ mealLogs }) => {
  const [period, setPeriod] = useState<Period>('week');
  const data = getAggregatedData(mealLogs, period);

  return (
    <div className="p-4 text-white">
      <h1 className="text-3xl font-bold text-brand-gold-400 mb-4">Your Progress</h1>
      
      <div className="flex justify-center space-x-2 mb-8">
        {(['week', 'month'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${period === p ? 'bg-brand-gold-500 text-brand-gray-900' : 'bg-brand-gray-700 text-gray-300'}`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-brand-gray-800 p-4 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-center mb-4 text-brand-gold-300">Nutrient Intake ({period})</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis dataKey="date" stroke="#A0AEC0" />
              <YAxis stroke="#A0AEC0" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #D97706' }}
                labelStyle={{ color: '#FDE68A' }}
              />
              <Legend wrapperStyle={{color: 'white'}}/>
              <Bar dataKey="calories" fill="#FBBF24" name="Calories"/>
              <Bar dataKey="protein" fill="#FDE68A" name="Protein"/>
              <Bar dataKey="carbs" fill="#FEF3C7" name="Carbs"/>
              <Bar dataKey="fat" fill="#B45309" name="Fat" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Stats;

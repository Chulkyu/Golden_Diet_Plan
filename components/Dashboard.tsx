import React, { useState, useRef, useMemo } from 'react';
import { UserProfile, MealCategory, MealItem, MealLogs, Nutrients, FoodType } from '../types';
import { sumNutrientsForDay, sumNutrientsForCategory } from '../utils/helpers';
import { analyzeFoodLabel } from '../services/geminiService';
import { format, parseISO } from 'date-fns';

const NutrientDisplay: React.FC<{ label: string; value: number; unit: string; className?: string }> = ({ label, value, unit, className }) => (
  <div className={`bg-brand-gray-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg ${className}`}>
    <span className="text-gray-400 text-sm font-medium">{label}</span>
    <span className="text-brand-gold-400 text-2xl font-bold">{value.toFixed(0)}</span>
    <span className="text-gray-400 text-xs">{unit}</span>
  </div>
);

const MealAccordion: React.FC<{ title: MealCategory; items: MealItem[]; totals: Nutrients }> = ({ title, items, totals }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const foodTypeIcons: Record<FoodType, string> = {
    [FoodType.Veggie]: '🌱',
    [FoodType.Vegan]: '🌿',
    [FoodType.Meat]: '🥩',
    [FoodType.Unknown]: '❓',
  };

  return (
    <div className="bg-brand-gray-800 rounded-xl overflow-hidden mb-3">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 text-left flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-white">{title}</h3>
          <p className="text-xs text-gray-400">{totals.calories.toFixed(0)} kcal · P {totals.protein.toFixed(0)}g · C {totals.carbs.toFixed(0)}g · F {totals.fat.toFixed(0)}g</p>
        </div>
        <svg className={`w-6 h-6 text-brand-gold-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-brand-gray-700">
          {items.length > 0 ? items.map(item => (
            <div key={item.id} className="mb-2 p-2 rounded-lg bg-brand-gray-700">
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-white">{item.name} <span title={item.type}>{foodTypeIcons[item.type]}</span></p>
                    <p className="font-semibold text-brand-gold-400">{item.calories.toFixed(0)} kcal</p>
                </div>
                 <p className="text-xs text-gray-400">P {item.protein.toFixed(0)}g · C {item.carbs.toFixed(0)}g · F {item.fat.toFixed(0)}g · S {item.sugar.toFixed(0)}g</p>
            </div>
          )) : <p className="text-gray-400 text-sm">No items logged for this meal.</p>}
        </div>
      )}
    </div>
  );
};


interface DashboardProps {
  user: UserProfile;
  mealLogs: MealLogs;
  addMealItem: (date: string, category: MealCategory, item: Omit<MealItem, 'id'>) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, mealLogs, addMealItem, selectedDate, setSelectedDate }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<MealCategory>(MealCategory.Breakfast);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const dailyTotals = useMemo(() => sumNutrientsForDay(mealLogs, selectedDate), [mealLogs, selectedDate]);
    
    const motivationalQuotes = [
        "Every meal is a choice. Make it a good one!",
        "You're one meal closer to your goal.",
        "Fueling your body is a form of self-respect.",
        "Consistency is key. Keep up the great work!",
    ];
    const quote = useMemo(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)], [selectedDate]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64String = (reader.result as string).split(',')[1];
                const mealData = await analyzeFoodLabel(base64String, file.type);
                addMealItem(selectedDate, selectedCategory, mealData);
            };
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    return (
        <div className="p-4 pb-24 text-white min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold">Hi, {user.name}</h1>
                    <p className="text-sm text-brand-gold-300">{quote}</p>
                </div>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-brand-gray-700 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-gold-500" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-brand-gray-800 p-4 rounded-2xl col-span-1 text-center shadow-lg">
                    <span className="text-gray-400 text-sm">Target</span>
                    <p className="text-brand-gold-400 text-3xl font-bold">{user.targetCalories}</p>
                    <span className="text-gray-400 text-xs">kcal</span>
                </div>
                 <div className="bg-brand-gray-800 p-4 rounded-2xl col-span-1 text-center shadow-lg">
                    <span className="text-gray-400 text-sm">Consumed</span>
                    <p className="text-white text-3xl font-bold">{dailyTotals.calories.toFixed(0)}</p>
                    <span className="text-gray-400 text-xs">kcal</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
                <NutrientDisplay label="Carbs" value={dailyTotals.carbs} unit="g" />
                <NutrientDisplay label="Protein" value={dailyTotals.protein} unit="g" />
                <NutrientDisplay label="Fat" value={dailyTotals.fat} unit="g" />
                <NutrientDisplay label="Sugar" value={dailyTotals.sugar} unit="g" />
            </div>

            <div className="bg-brand-gray-800 p-4 rounded-xl mb-6 shadow-lg">
                <h2 className="font-bold text-lg text-white mb-3">Log a Meal</h2>
                <div className="flex space-x-2">
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as MealCategory)} className="flex-grow bg-brand-gray-700 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-brand-gold-500">
                        {Object.values(MealCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="bg-brand-gold-500 text-brand-gray-900 font-bold py-3 px-5 rounded-lg hover:bg-brand-gold-400 transition duration-300 disabled:bg-brand-gray-700 disabled:cursor-not-allowed">
                        {isLoading ? 'Scanning...' : 'Scan'}
                    </button>
                </div>
                 {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            <div>
                {Object.values(MealCategory).map(cat => (
                    <MealAccordion 
                        key={cat}
                        title={cat}
                        items={mealLogs[selectedDate]?.[cat] || []}
                        totals={sumNutrientsForCategory(mealLogs, selectedDate, cat)}
                    />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;

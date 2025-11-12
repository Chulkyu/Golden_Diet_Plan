import { UserProfile, ActivityLevel, WeightGoal, MealLogs, Nutrients, MealCategory } from '../types';
// Fix: Use explicit sub-path imports for date-fns to resolve module resolution errors.
import { format } from 'date-fns/format';
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import { startOfYear } from 'date-fns/startOfYear';
import { endOfYear } from 'date-fns/endOfYear';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';

export const calculateTargetCalories = (profile: Omit<UserProfile, 'targetCalories'>): number => {
  // Mifflin-St Jeor Equation for BMR
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5; // Assuming male for simplicity
  const tdee = bmr * profile.activityLevel;

  switch (profile.weightGoal) {
    case WeightGoal.Lose:
      return Math.round(tdee - 500);
    case WeightGoal.Gain:
      return Math.round(tdee + 500);
    case WeightGoal.Maintain:
    default:
      return Math.round(tdee);
  }
};

export const getTodaysDateString = () => {
    return format(new Date(), 'yyyy-MM-dd');
}

const emptyNutrients: Nutrients = { calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0 };

export const sumNutrientsForDay = (logs: MealLogs, date: string): Nutrients => {
    const dayLog = logs[date];
    if (!dayLog) return {...emptyNutrients};

    return Object.values(dayLog).flat().reduce((acc, item) => {
        acc.calories += item.calories;
        acc.carbs += item.carbs;
        acc.protein += item.protein;
        acc.fat += item.fat;
        acc.sugar += item.sugar;
        return acc;
    }, {...emptyNutrients});
};

export const sumNutrientsForCategory = (logs: MealLogs, date: string, category: MealCategory): Nutrients => {
    const categoryItems = logs[date]?.[category];
    if (!categoryItems) return {...emptyNutrients};
    
    return categoryItems.reduce((acc, item) => {
        acc.calories += item.calories;
        acc.carbs += item.carbs;
        acc.protein += item.protein;
        acc.fat += item.fat;
        acc.sugar += item.sugar;
        return acc;
    }, {...emptyNutrients});
};

export const getAggregatedData = (logs: MealLogs, period: 'week' | 'month' | 'year') => {
    const now = new Date();
    let interval;

    switch (period) {
        case 'week':
            interval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
            break;
        case 'month':
            interval = { start: startOfMonth(now), end: endOfMonth(now) };
            break;
        case 'year':
            interval = { start: startOfYear(now), end: endOfYear(now) };
            break;
    }
    
    const daysInInterval = eachDayOfInterval(interval);
    
    return daysInInterval.map(day => {
        const dateString = format(day, 'yyyy-MM-dd');
        const nutrients = sumNutrientsForDay(logs, dateString);
        return {
            date: format(day, 'MMM d'),
            ...nutrients
        };
    });
};

export interface UserProfile {
  name: string;
  age: number;
  height: number;
  weight: number;
  activityLevel: ActivityLevel;
  weightGoal: WeightGoal;
  targetCalories: number;
}

export enum ActivityLevel {
  Sedentary = 1.2,
  LightlyActive = 1.375,
  ModeratelyActive = 1.55,
  VeryActive = 1.725,
  ExtraActive = 1.9,
}

export enum WeightGoal {
  Lose = 'lose',
  Maintain = 'maintain',
  Gain = 'gain',
}

export interface Nutrients {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
}

export enum MealCategory {
  Breakfast = 'Breakfast',
  Lunch = 'Lunch',
  Dinner = 'Dinner',
  Snacks = 'Snacks',
  Drinks = 'Drinks',
}

export enum FoodType {
  Veggie = 'Veggie',
  Vegan = 'Vegan',
  Meat = 'Meat',
  Unknown = 'Unknown',
}


export interface MealItem extends Nutrients {
  id: string;
  name: string;
  type: FoodType;
}

export type DailyLog = {
  [key in MealCategory]?: MealItem[];
};

export type MealLogs = {
  [date: string]: DailyLog;
};

export type Page = 'profile' | 'dashboard' | 'stats';

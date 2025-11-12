import React, { useState } from 'react';
import { UserProfile, ActivityLevel, WeightGoal } from '../types';
import { calculateTargetCalories } from '../utils/helpers';

interface ProfileProps {
  userProfile: UserProfile | null;
  onProfileSave: (profile: UserProfile) => void;
}

const Profile: React.FC<ProfileProps> = ({ userProfile, onProfileSave }) => {
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    age: userProfile?.age?.toString() || '',
    height: userProfile?.height?.toString() || '',
    weight: userProfile?.weight?.toString() || '',
    activityLevel: userProfile?.activityLevel || ActivityLevel.LightlyActive,
    weightGoal: userProfile?.weightGoal || WeightGoal.Maintain,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profileData = {
      name: formData.name,
      age: parseInt(formData.age, 10),
      height: parseInt(formData.height, 10),
      weight: parseInt(formData.weight, 10),
      activityLevel: parseFloat(formData.activityLevel.toString()) as ActivityLevel,
      weightGoal: formData.weightGoal as WeightGoal,
    };
    
    const targetCalories = calculateTargetCalories(profileData);
    
    onProfileSave({ ...profileData, targetCalories });
  };

  return (
    <div className="min-h-screen bg-brand-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-brand-gray-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-brand-gold-400">FELFEL Diet Plan</h1>
        <p className="text-center text-gray-300 mb-8">{userProfile ? 'Update your profile.' : 'Create your profile to get started.'}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-brand-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} required className="w-full px-4 py-3 bg-brand-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500" />
            <input type="number" name="height" placeholder="Height (cm)" value={formData.height} onChange={handleChange} required className="w-full px-4 py-3 bg-brand-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500" />
          </div>
          <input type="number" name="weight" placeholder="Weight (kg)" value={formData.weight} onChange={handleChange} required className="w-full px-4 py-3 bg-brand-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500" />
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Activity Level</label>
            <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="w-full px-4 py-3 bg-brand-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500">
              <option value={ActivityLevel.Sedentary}>Sedentary</option>
              <option value={ActivityLevel.LightlyActive}>Lightly Active</option>
              <option value={ActivityLevel.ModeratelyActive}>Moderately Active</option>
              <option value={ActivityLevel.VeryActive}>Very Active</option>
              <option value={ActivityLevel.ExtraActive}>Extra Active</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Weight Goal</label>
            <select name="weightGoal" value={formData.weightGoal} onChange={handleChange} className="w-full px-4 py-3 bg-brand-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500">
              <option value={WeightGoal.Lose}>Lose Weight</option>
              <option value={WeightGoal.Maintain}>Maintain Weight</option>
              <option value={WeightGoal.Gain}>Gain Weight</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-brand-gold-500 text-brand-gray-900 font-bold py-3 rounded-lg hover:bg-brand-gold-400 transition duration-300">Save Profile</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
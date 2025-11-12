import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { UserProfile, MealLogs, MealCategory, MealItem, Page } from './types';
import { getTodaysDateString } from './utils/helpers';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import Stats from './components/Stats';

const BottomNav: React.FC<{ currentPage: Page, setCurrentPage: (page: Page) => void }> = ({ currentPage, setCurrentPage }) => {
    const navItems = [
        { page: 'dashboard', icon: '📊', label: 'Dashboard' },
        { page: 'stats', icon: '📈', label: 'Stats' },
        { page: 'profile', icon: '👤', label: 'Profile' },
    ];
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-brand-gray-800 border-t border-brand-gray-700 h-16 flex justify-around items-center">
            {navItems.map(item => (
                <button
                    key={item.page}
                    onClick={() => setCurrentPage(item.page as Page)}
                    className={`flex flex-col items-center justify-center transition ${currentPage === item.page ? 'text-brand-gold-400' : 'text-gray-400'}`}
                >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs">{item.label}</span>
                </button>
            ))}
        </div>
    );
};

const App: React.FC = () => {
    const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('userProfile', null);
    const [mealLogs, setMealLogs] = useLocalStorage<MealLogs>('mealLogs', {});
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [selectedDate, setSelectedDate] = useState<string>(getTodaysDateString());

    useEffect(() => {
        if (!userProfile) {
            setCurrentPage('profile');
        } else {
            setCurrentPage('dashboard');
        }
    }, [userProfile]);
    
    const handleProfileSave = (profile: UserProfile) => {
        setUserProfile(profile);
        setCurrentPage('dashboard');
    };

    const addMealItem = (date: string, category: MealCategory, itemData: Omit<MealItem, 'id'>) => {
        const newMealItem: MealItem = {
            ...itemData,
            id: new Date().toISOString(),
        };

        // Fix: Ensure state updates are immutable to prevent bugs.
        setMealLogs(prevLogs => {
            const dayLog = prevLogs[date] || {};
            const categoryItems = dayLog[category] || [];
            return {
                ...prevLogs,
                [date]: {
                    ...dayLog,
                    [category]: [...categoryItems, newMealItem],
                },
            };
        });
    };

    const deleteMealItem = (date: string, category: MealCategory, itemId: string) => {
        setMealLogs(prevLogs => {
            const updatedLogs = { ...prevLogs };
            if (!updatedLogs[date]?.[category]) {
                return prevLogs; // No change if date or category doesn't exist
            }
            
            const updatedDayLog = { ...updatedLogs[date] };
            const updatedCategoryItems = updatedDayLog[category]?.filter(item => item.id !== itemId);

            if (updatedCategoryItems && updatedCategoryItems.length > 0) {
                updatedDayLog[category] = updatedCategoryItems;
            } else {
                delete updatedDayLog[category];
            }

            if (Object.keys(updatedDayLog).length > 0) {
                updatedLogs[date] = updatedDayLog;
            } else {
                delete updatedLogs[date];
            }

            return updatedLogs;
        });
    };
    
    const renderPage = () => {
        if (!userProfile || currentPage === 'profile') {
            return <Profile userProfile={userProfile} onProfileSave={handleProfileSave} />;
        }
        
        switch (currentPage) {
            case 'stats':
                return <Stats mealLogs={mealLogs} />;
            case 'dashboard':
            default:
                return <Dashboard 
                            user={userProfile} 
                            mealLogs={mealLogs} 
                            addMealItem={addMealItem}
                            deleteMealItem={deleteMealItem}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate} 
                        />;
        }
    };
    
    return (
        <main className="bg-brand-gray-900 min-h-screen">
            {renderPage()}
            {userProfile && <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />}
        </main>
    );
};

export default App;
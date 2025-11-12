import { GoogleGenAI, Type } from "@google/genai";
import { MealItem, FoodType } from '../types';

const foodLabelSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the food product." },
        calories: { type: Type.NUMBER, description: "Total calories per serving." },
        carbs: { type: Type.NUMBER, description: "Total carbohydrates in grams per serving." },
        protein: { type: Type.NUMBER, description: "Total protein in grams per serving." },
        fat: { type: Type.NUMBER, description: "Total fat in grams per serving." },
        sugar: { type: Type.NUMBER, description: "Total sugar in grams per serving." },
        type: { type: Type.STRING, description: "Classification of the food: 'Veggie', 'Vegan', 'Meat', or 'Unknown'." }
    },
    required: ["name", "calories", "carbs", "protein", "fat", "sugar", "type"]
};


export const analyzeFoodLabel = async (imageBase64: string, mimeType: string): Promise<Omit<MealItem, 'id'>> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType,
        },
    };

    const textPart = {
        text: `You are an expert nutritionist. Analyze the following image of a food nutrition label. Extract the product name, calories, total carbohydrates, protein, total fat, and sugars per serving. Also, classify the food as 'Veggie', 'Vegan', or 'Meat' based on its ingredients if visible, or 'Unknown' if not. Return the data ONLY as a valid JSON object. If any value is not found, return 0 for numbers and 'Unknown Product' for the name.`,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: foodLabelSchema
            }
        });

        const jsonString = response.text.trim();
        const parsedData = JSON.parse(jsonString);

        return {
            name: parsedData.name || 'Unknown Product',
            calories: parsedData.calories || 0,
            carbs: parsedData.carbs || 0,
            protein: parsedData.protein || 0,
            fat: parsedData.fat || 0,
            sugar: parsedData.sugar || 0,
            type: Object.values(FoodType).includes(parsedData.type) ? parsedData.type : FoodType.Unknown,
        };
    } catch (error) {
        console.error("Error analyzing food label with Gemini:", error);
        throw new Error("Failed to analyze food label. Please try again.");
    }
};

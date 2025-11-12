import { GoogleGenAI, Type } from "@google/genai";
import { MealItem, FoodType } from '../types';

const foodLabelSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the food product." },
        calories: { type: Type.NUMBER, description: "Total calories for the entire package." },
        carbs: { type: Type.NUMBER, description: "Total carbohydrates in grams for the entire package." },
        protein: { type: Type.NUMBER, description: "Total protein in grams for the entire package." },
        fat: { type: Type.NUMBER, description: "Total fat in grams for the entire package." },
        sugar: { type: Type.NUMBER, description: "Total sugar in grams for the entire package." },
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
        text: `You are a precise nutrition data extractor. Your task is to analyze the food label image and return a JSON object with the nutritional information for the ENTIRE PACKAGE.

Instructions:
1.  **Find Per-100g Values:** Identify calories, carbs, protein, fat, and sugar per 100g.
2.  **Find Total Weight:** Identify the total weight of the product in grams (e.g., 400g).
3.  **Calculate Totals:** Multiply the per-100g values by the total weight divided by 100. For example, if calories are 205kcal per 100g and total weight is 400g, the total calories are 205 * (400 / 100) = 820.
4.  **Extract Name & Type:** Get the product name and classify it as 'Veggie', 'Vegan', 'Meat', or 'Unknown'.
5.  **Return JSON:** Respond with ONLY a valid JSON object. For missing values, use 0 for numbers and 'Unknown Product' for the name. All nutrient values must be for the entire package.`,
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
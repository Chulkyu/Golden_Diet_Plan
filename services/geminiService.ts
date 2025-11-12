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
        text: `You are a hyper-precise nutrition data extractor. Your sole task is to analyze the food label image and return a JSON object containing the nutritional information for the ENTIRE PACKAGE.

**Critical Instructions:**
1.  **Locate Per-100g Data:** Scan the label for a section like "Nährwerte pro 100g", "Valeurs nutritionnelles pour 100g", or "Nutrition facts per 100g". This is the source data.
2.  **Extract Per-100g Values:** From that section, extract the values for calories (kcal), carbohydrates (g), protein (g), fat (g), and sugar (g).
3.  **Locate Total Weight:** Find the total weight of the product, usually marked in grams (g) (e.g., 450g).
4.  **Perform Calculation:** For EACH nutrient, calculate the total amount for the entire package using this formula: \`Total Nutrient = (Nutrient Value per 100g) * (Total Weight in g / 100)\`.
5.  **Example Calculation:** If protein is 2.8g per 100g and total weight is 450g, the total protein is \`2.8 * (450 / 100) = 12.6g\`.
6.  **Extract Product Details:** Identify the product's full name. Determine if it's 'Veggie', 'Vegan', 'Meat', or 'Unknown' based on icons or text.
7.  **Format Output:** Return ONLY a single, valid JSON object with the calculated total values. Do not include any other text, explanation, or markdown. For missing values, use 0 for numbers and 'Unknown Product' for the name.`,
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
import { GoogleGenAI, Type } from "@google/genai";
import { MealItem, FoodType } from '../types';

const foodLabelSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the food product." },
        calories: { type: Type.NUMBER, description: "Total calories for the entire package, calculated by (calories per 100g) * (total weight / 100)." },
        carbs: { type: Type.NUMBER, description: "Carbohydrates in grams per 100g, as written on the label. DO NOT calculate for the total package." },
        protein: { type: Type.NUMBER, description: "Protein in grams per 100g, as written on the label. DO NOT calculate for the total package." },
        fat: { type: Type.NUMBER, description: "Fat in grams per 100g, as written on the label. DO NOT calculate for the total package." },
        sugar: { type: Type.NUMBER, description: "Sugar in grams per 100g, as written on the label. DO NOT calculate for the total package." },
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
        text: `You are a hyper-precise nutrition data extractor. Your sole task is to analyze the food label image and return a JSON object based on the following specific rules.

**Critical Instructions:**
1.  **Locate Per-100g Data:** Scan the label for a section like "Nährwerte pro 100g", "Valeurs nutritionnelles pour 100g", or "Nutrition facts per 100g". This is the source data.
2.  **Locate Total Weight:** Find the total weight of the product, usually marked in grams (g) (e.g., 400g).
3.  **Calculate TOTAL Calories ONLY:**
    *   Find the calorie value (kcal) per 100g.
    *   Calculate the total calories for the entire package using this formula: \`Total Calories = (Calories per 100g) * (Total Weight in g / 100)\`.
    *   The 'calories' field in the JSON output MUST be this calculated total value.
4.  **Extract Other Nutrients AS-IS (Per 100g):**
    *   Find the values for carbohydrates (g), protein (g), fat (g), and sugar (g) from the per-100g section.
    *   **CRITICAL:** DO NOT multiply these values. Return the exact numbers written on the label for the 100g serving.
5.  **Example:**
    *   A 400g package label states per 100g: 205 kcal, 18g carbs, 5.8g protein.
    *   Your JSON output for 'calories' should be \`205 * (400 / 100) = 820\`.
    *   Your JSON output for 'carbs' should be \`18\`.
    *   Your JSON output for 'protein' should be \`5.8\`.
6.  **Extract Product Details:** Identify the product's full name. Determine if it's 'Veggie', 'Vegan', 'Meat', or 'Unknown' based on icons or text.
7.  **Format Output:** Return ONLY a single, valid JSON object with the specified values. Do not include any other text, explanation, or markdown. For missing values, use 0 for numbers and 'Unknown Product' for the name.`,
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
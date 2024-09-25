import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkApiLimit, increaseApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const data = await req.json();
    const prompt = data.body;

    if (!userId) return new NextResponse("UnAuthorized", { status: 401 });

    if (!genAI.apiKey) {
      return new NextResponse("OpenAI API Key not configured", { status: 500 });
    }


    if(!data){
      return new NextResponse("Messages Are Required", { status: 400 });
    }

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro)
     return new NextResponse("Free Trial Has Expired", { status: 403 });

    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    const result = await model.generateContent(prompt);

    // Handle the result properly
    if (!result.response || !result.response.text) {
      return new NextResponse("No response from AI model", { status: 500 });
    }

    const output = await result.response.text();
    if (!isPro) await increaseApiLimit();
    return NextResponse.json({ output });
    
  } catch (error) {
    console.error('Error in API route:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

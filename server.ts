import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Challenges
  app.post('/api/suggest-challenges', async (req, res) => {
    try {
      const { expenses } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is required' });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `أنت مستشار مالي ذكي. بناءً على هذه المصاريف، اقترح 3 تحديات ادخار مخصصة للمستخدم.
يجب أن تكون التحديات واقعية ومحفزة. (مثلاً: "تحدي تقليل مصاريف المقاهي بنسبة 20%" أو "وفر 50 دينار من مصاريف التسوق").

المصاريف:
${JSON.stringify(expenses, null, 2)}

الرجاء الرد بتنسيق JSON فقط يحتوي على مصفوفة من العناصر التالية:
{
  "id": "معرف_فريد_عشوائي",
  "title": "عنوان التحدي القصير",
  "desc": "وصف التحدي",
  "reward": "المكافأة (نقاط أو شارة)",
  "progress": 0
}
تأكد من الرد بصيغة JSON صحيحة بدون أي نصوص إضافية، بدون Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        const challenges = JSON.parse(text);
        res.json({ challenges });
      } else {
        res.status(500).json({ error: 'No response from AI' });
      }

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      res.status(500).json({ error: 'Failed to generate challenges' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

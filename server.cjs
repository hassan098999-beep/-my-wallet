var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/suggest-challenges", async (req, res) => {
    try {
      const { expenses } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is required" });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const prompt = `\u0623\u0646\u062A \u0645\u0633\u062A\u0634\u0627\u0631 \u0645\u0627\u0644\u064A \u0630\u0643\u064A. \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0645\u0635\u0627\u0631\u064A\u0641\u060C \u0627\u0642\u062A\u0631\u062D 3 \u062A\u062D\u062F\u064A\u0627\u062A \u0627\u062F\u062E\u0627\u0631 \u0645\u062E\u0635\u0635\u0629 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645.
\u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0627\u0644\u062A\u062D\u062F\u064A\u0627\u062A \u0648\u0627\u0642\u0639\u064A\u0629 \u0648\u0645\u062D\u0641\u0632\u0629. (\u0645\u062B\u0644\u0627\u064B: "\u062A\u062D\u062F\u064A \u062A\u0642\u0644\u064A\u0644 \u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u0645\u0642\u0627\u0647\u064A \u0628\u0646\u0633\u0628\u0629 20%" \u0623\u0648 "\u0648\u0641\u0631 50 \u062F\u064A\u0646\u0627\u0631 \u0645\u0646 \u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u062A\u0633\u0648\u0642").

\u0627\u0644\u0645\u0635\u0627\u0631\u064A\u0641:
${JSON.stringify(expenses, null, 2)}

\u0627\u0644\u0631\u062C\u0627\u0621 \u0627\u0644\u0631\u062F \u0628\u062A\u0646\u0633\u064A\u0642 JSON \u0641\u0642\u0637 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0645\u0635\u0641\u0648\u0641\u0629 \u0645\u0646 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u062A\u0627\u0644\u064A\u0629:
{
  "id": "\u0645\u0639\u0631\u0641_\u0641\u0631\u064A\u062F_\u0639\u0634\u0648\u0627\u0626\u064A",
  "title": "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062A\u062D\u062F\u064A \u0627\u0644\u0642\u0635\u064A\u0631",
  "desc": "\u0648\u0635\u0641 \u0627\u0644\u062A\u062D\u062F\u064A",
  "reward": "\u0627\u0644\u0645\u0643\u0627\u0641\u0623\u0629 (\u0646\u0642\u0627\u0637 \u0623\u0648 \u0634\u0627\u0631\u0629)",
  "progress": 0
}
\u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0644\u0631\u062F \u0628\u0635\u064A\u063A\u0629 JSON \u0635\u062D\u064A\u062D\u0629 \u0628\u062F\u0648\u0646 \u0623\u064A \u0646\u0635\u0648\u0635 \u0625\u0636\u0627\u0641\u064A\u0629\u060C \u0628\u062F\u0648\u0646 Markdown.`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const text = response.text;
      if (text) {
        const challenges = JSON.parse(text);
        res.json({ challenges });
      } else {
        res.status(500).json({ error: "No response from AI" });
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({ error: "Failed to generate challenges" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

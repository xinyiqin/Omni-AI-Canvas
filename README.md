<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1t0hVygJXGiKbAXvfLiWnPthBFOLTABHI

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file in the root directory and set the following environment variables:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `DEEPSEEK_API_KEY`: (Optional) Your DeepSeek API key for using DeepSeek V3.2 model
   - `LIGHTX2V_TOKEN`: (Optional) Your LightX2V access token. If not set, you can configure it in the app's environment variables UI.
   - `LIGHTX2V_URL`: (Optional) LightX2V API endpoint URL. Defaults to `https://x2v.light-ai.top` if not set.
3. Run the app:
   `npm run dev`

/* settings.config.js
  This file is for YOUR local configuration.
  It is ignored by git, so you can put secrets here.
*/

window.LOCAL_CONFIG = {
  // 1. API KEY: This overrides Docker environment variables if set
  GEMINI_API_KEY: "YOUR_ACTUAL_API_KEY_HERE",

  // 2. SETTINGS
  theme: "light",
  autoGenerateSummaries: true,

  // 3. LOCAL FILES (Pre-loaded Documents)
  // Since browsers can't read your hard drive directly, paste content here
  // to simulate "local files" loading on startup.
  documents: [
    {
      title: "My Local Notes",
      content: "This is content loaded from the settings.config.js file.",
    }
  ]
};
import { executeLLMWithFallback, validateApiKey, type ChatMessage } from "./index.js";

async function runTests() {
    console.log("==================================================");
    console.log("🧪 Starting LLM Fallback Execution Service Tests");
    console.log("==================================================\n");

    const messages: ChatMessage[] = [
        { role: "user", content: "Say 'Hello' in a single word." }
    ];

    // ----------------------------------------------------
    // Test Case 1: Normal Platform Key Execution
    // ----------------------------------------------------
    console.log("👉 Test Case 1: Normal Platform Key Execution");
    try {
        const result = await executeLLMWithFallback({
            messages,
            userProfile: {
                useCustomKey: false,
                llmApiKey: null,
                llmProvider: null,
            },
        });

        console.log("  Result Content:", result.content.trim());
        console.log("  Fallback Notice:", JSON.stringify(result.fallbackNotice));

        if (result.fallbackNotice?.occurred === false) {
            console.log("  ✅ Test Case 1 PASSED: Executed with platform key without fallback.\n");
        } else {
            console.error("  ❌ Test Case 1 FAILED: Fallback occurred unexpectedly.\n");
        }
    } catch (err) {
        console.error("  ❌ Test Case 1 ERROR:", err, "\n");
    }

    // ----------------------------------------------------
    // Test Case 2: Invalid Custom Key Execution (Fallback Triggered)
    // ----------------------------------------------------
    console.log("👉 Test Case 2: Invalid Custom Key Execution (Groq)");
    try {
        const result = await executeLLMWithFallback({
            messages,
            userProfile: {
                useCustomKey: true,
                llmProvider: "groq",
                llmApiKey: "gsk_invalid_dummy_api_key_99999",
            },
        });

        console.log("  Result Content:", result.content.trim());
        console.log("  Fallback Notice:", JSON.stringify(result.fallbackNotice));

        if (result.fallbackNotice?.occurred === true && result.fallbackNotice.reason) {
            console.log(`  ✅ Test Case 2 PASSED: Custom key failed (${result.fallbackNotice.reason}), successfully fell back to platform key.\n`);
        } else {
            console.error("  ❌ Test Case 2 FAILED: Expected fallbackNotice.occurred === true.\n");
        }
    } catch (err) {
        console.error("  ❌ Test Case 2 ERROR:", err, "\n");
    }

    // ----------------------------------------------------
    // Test Case 3: Invalid Custom Key Execution (Gemini)
    // ----------------------------------------------------
    console.log("👉 Test Case 3: Invalid Custom Key Execution (Gemini)");
    try {
        const result = await executeLLMWithFallback({
            messages,
            userProfile: {
                useCustomKey: true,
                llmProvider: "gemini",
                llmApiKey: "invalid_gemini_api_key_99999",
            },
        });

        console.log("  Result Content:", result.content.trim());
        console.log("  Fallback Notice:", JSON.stringify(result.fallbackNotice));

        if (result.fallbackNotice?.occurred === true && result.fallbackNotice.reason) {
            console.log(`  ✅ Test Case 3 PASSED: Custom key failed (${result.fallbackNotice.reason}), successfully fell back to platform key.\n`);
        } else {
            console.error("  ❌ Test Case 3 FAILED: Expected fallbackNotice.occurred === true.\n");
        }
    } catch (err) {
        console.error("  ❌ Test Case 3 ERROR:", err, "\n");
    }

    // ----------------------------------------------------
    // Test Case 4: API Key Validation - Invalid Key
    // ----------------------------------------------------
    console.log("👉 Test Case 4: API Key Validation (Invalid Custom Key)");
    try {
        const validation = await validateApiKey("groq", "gsk_invalid_dummy_key_12345");
        console.log("  Validation Output:", JSON.stringify(validation));
        if (validation.valid === false && validation.error) {
            console.log(`  ✅ Test Case 4 PASSED: Invalid API key correctly rejected (${validation.error}).\n`);
        } else {
            console.error("  ❌ Test Case 4 FAILED: Expected valid === false.\n");
        }
    } catch (err) {
        console.error("  ❌ Test Case 4 ERROR:", err, "\n");
    }

    // ----------------------------------------------------
    // Test Case 5: API Key Validation - Valid Platform Key
    // ----------------------------------------------------
    console.log("👉 Test Case 5: API Key Validation (Valid Key)");
    try {
        const validKey = process.env.GROQ_API_KEY || "";
        const validation = await validateApiKey("groq", validKey);
        console.log("  Validation Output:", JSON.stringify(validation));
        if (validation.valid === true) {
            console.log("  ✅ Test Case 5 PASSED: Valid API key successfully validated.\n");
        } else {
            console.error(`  ❌ Test Case 5 FAILED: Expected valid === true, got error: ${validation.error}.\n`);
        }
    } catch (err) {
        console.error("  ❌ Test Case 5 ERROR:", err, "\n");
    }

    console.log("==================================================");
    console.log("🎉 All Tests Completed!");
    console.log("==================================================");
}

runTests();

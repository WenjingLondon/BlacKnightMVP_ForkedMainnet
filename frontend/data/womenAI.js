
// ✅ 异步加载 JSON 文件中的 token 数据
export async function loadTokens() {
  const response = await fetch('./data/femaleFriendlyTokens.json');
  if (!response.ok) {
    throw new Error('Failed to load token data');
  }
  const tokens = await response.json();
  return tokens;
}

// ✅ 输入关键词并基于数据筛选建议
export function getTokenSuggestions(inputText, tokens) {
  const normalized = inputText.toLowerCase();

  if (normalized.includes("community")) {
    return tokens.filter(token =>
      token.communityActivityScore >= 7
    );
  }

  if (normalized.includes("social") || normalized.includes("impact")) {
    return tokens.filter(token =>
      token.socialImpactScore >= 7
    );
  }

  if (normalized.includes("apy") || normalized.includes("high return")) {
    return tokens.filter(token =>
      token.apy >= 5
    );
  }

  if (normalized.includes("green") || normalized.includes("climate") || normalized.includes("carbon")) {
    return tokens.filter(token =>
      (token.tags && token.tags.includes("green")) ||
      ((token.description || "").toLowerCase().includes("carbon"))
    );
  }

  if (normalized.includes("female") || normalized.includes("women")) {
    return tokens.filter(token =>
      token.tags && (token.tags.includes("female-led") || token.tags.includes("female-friendly"))
    );
  }

  // 默认返回全部
  return tokens;
}


// ✅ 输出答案文本 + 提示
export function answerQuestion(userInput, tokens) {
  const results = getTokenSuggestions(userInput, tokens);

  if (results.length === 0) {
    return "Sorry, I couldn't find a good match for your request.";
  }

  return `Here are ${results.length} token(s) that might suit your needs. Scroll down to see the details below 👇`;
}


from langchain_together import ChatTogether
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import os

load_dotenv()  

llm = ChatTogether(
    together_api_key=os.getenv("TOGETHER_API_KEY"),
    model="mistralai/Mixtral-8x7B-Instruct-v0.1"
)

prompt = ChatPromptTemplate.from_template("""
You are a professional DeFi assistant. Based on real-time Aave data, provide a recommendation to the user.

Assets:

- DAI
  - Supply APY: {dai_supply}%
  - Borrow APY: {dai_borrow}%
  - LTV: {dai_ltv}%
  - Liquidation Threshold: {dai_liquidation}%

- USDC
  - Supply APY: {usdc_supply}%
  - Borrow APY: {usdc_borrow}%
  - LTV: {usdc_ltv}%
  - Liquidation Threshold: {usdc_liquidation}%

- WBTC
  - Supply APY: {wbtc_supply}%
  - Borrow APY: {wbtc_borrow}%
  - LTV: {wbtc_ltv}%
  - Liquidation Threshold: {wbtc_liquidation}%

Please suggest:
1. Which asset is best to supply now?
2. Brief reason based on yield and risk.
3. Warn about any risky asset if needed.
""")

def get_ai_recommendation(aave_data: dict):
    chain = prompt | llm
    result = chain.invoke(aave_data)

    # Step 1: 提取文本并 HTML 格式化
    text = result.content.strip()

    text = text.replace("1.", "<h3 style='color:#0066cc;'>✅ 1. Best Asset to Supply</h3>", 1)
    text = text.replace("2.", "<h3 style='color:#0066cc;'>📈 2. Reason</h3>", 1)
    text = text.replace("3.", "<h3 style='color:#0066cc;'>⚠️ 3. Risk Warning</h3>", 1)

  
    lines = text.split("\n")
    html_lines = [f"<p style='color:#0066cc; line-height:1.6;'>{line}</p>" for line in lines if line.strip()]
    html_result = "".join(html_lines)

    return html_result

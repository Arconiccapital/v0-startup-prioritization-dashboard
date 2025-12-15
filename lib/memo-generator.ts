import type { Startup } from "./types"

export function generateComprehensiveInvestmentMemo(startup: Startup): string {
  const sections: string[] = []

  // 1. Executive Summary
  sections.push(`## Executive Summary

${startup.description || "No description available."}

**Location:** ${startup.country || "N/A"}
**Stage:** ${startup.stage || "N/A"}
**Pipeline Stage:** ${startup.pipelineStage || "Screening"}

**Machine Learning Score:** ${startup.aiScores?.ml || "N/A"}/100
**Investment Score Overview:** ${startup.investmentScoreOverview || "Pending analysis"}

${startup.investmentScoreOverview ? `This company ${startup.investmentScoreOverview.toLowerCase().includes("strong") || startup.investmentScoreOverview.toLowerCase().includes("excellent") || (startup.aiScores?.ml && startup.aiScores.ml >= 70) ? "appears to be a strong investment candidate" : "requires further evaluation"} based on initial assessment.` : ""}`)

  // 2. Machine Learning Score
  sections.push(`## Machine Learning Score

**Score:** ${startup.aiScores?.ml || "N/A"}/100
**Confidence Level:** ${startup.aiScores?.ml ? (startup.aiScores.ml >= 80 ? "High" : startup.aiScores.ml >= 60 ? "Medium" : "Low") : "N/A"}

${
  startup.aiScores?.ml
    ? startup.aiScores.ml >= 80
      ? "**Excellent** – Top-tier investment potential based on provided metrics. This score indicates strong alignment with investment criteria across multiple dimensions including market opportunity, team quality, and business fundamentals."
      : startup.aiScores.ml >= 60
        ? "**Good** – Solid investment potential with some areas requiring further evaluation. The company demonstrates strengths in key areas but may have specific risks or uncertainties to address."
        : "**Fair** – Investment potential exists but significant concerns or gaps in data require careful consideration. Additional due diligence is recommended before proceeding."
    : "Score not yet calculated. Requires data input and analysis."
}`)

  // 3. Arconic LLM Rules
  sections.push(`## Arconic LLM Rules

${startup.arconicLlmRules || "The evaluation model emphasizes data-driven assessment across multiple dimensions including deal structure, revenue scale, market dynamics, team quality, and investor validation. All scoring is transparent and based on structured input fields."}

**Evaluation Framework:**
- Market opportunity and addressable market size
- Team credentials and execution capability
- Product differentiation and competitive moat
- Business model viability and unit economics
- Traction metrics and growth trajectory
- Regulatory and compliance considerations

All evaluations are fully data-driven and transparent, with scoring based on quantifiable metrics and structured assessments.`)

  // 4. Investment Thesis (Why Now)
  sections.push(`## Investment Thesis (Why Now)

${
  startup.marketInfo?.industry ||
  startup.marketInfo?.marketSize ||
  startup.companyInfo?.founded ||
  startup.riskInfo?.regulatoryRisk
    ? `**Industry Context:** ${startup.marketInfo?.industry || "N/A"} | **Sub-Industry:** ${startup.marketInfo?.subIndustry || "N/A"}

**Market Timing:** ${
        startup.marketInfo?.aiDisruptionPropensity
          ? `The ${startup.marketInfo.industry || "target"} industry is experiencing ${startup.marketInfo.aiDisruptionPropensity.toLowerCase()} AI disruption propensity, creating opportunities for innovative solutions.`
          : "Market dynamics are evolving, creating opportunities for well-positioned players."
      }

**Founded:** ${startup.companyInfo?.founded || "N/A"} | **Location:** ${startup.country || "N/A"}

**Market Size:** ${startup.marketInfo?.marketSize || "Not specified"}

**Regulatory Environment:** ${startup.riskInfo?.regulatoryRisk || "Standard regulatory considerations apply"}

The timing appears ${startup.marketInfo?.marketSize && (startup.marketInfo.marketSize.toLowerCase().includes("large") || startup.marketInfo.marketSize.toLowerCase().includes("billion")) ? "favorable" : "reasonable"} given the market maturity, regulatory landscape, and the company's stage of development.`
    : "Insufficient data to provide detailed investment thesis. Additional market and company information required."
}`)

  // 5. Market Opportunity
  sections.push(`## Market Opportunity

**Market Size:** ${startup.marketInfo?.marketSize || "Not specified"}
**Industry:** ${startup.marketInfo?.industry || "N/A"}
**Sub-Industry:** ${startup.marketInfo?.subIndustry || "N/A"}
**AI Disruption Propensity:** ${startup.marketInfo?.aiDisruptionPropensity || "N/A"}

${
  startup.marketInfo?.marketSize || startup.marketInfo?.industry
    ? `The company operates in the ${startup.marketInfo?.industry || "target"} sector${startup.marketInfo?.subIndustry ? `, specifically focusing on ${startup.marketInfo.subIndustry}` : ""}. ${startup.marketInfo?.marketSize ? `The addressable market is ${startup.marketInfo.marketSize}.` : ""} ${startup.marketInfo?.aiDisruptionPropensity ? `This market shows ${startup.marketInfo.aiDisruptionPropensity.toLowerCase()} propensity for AI-driven disruption, indicating ${startup.marketInfo.aiDisruptionPropensity.toLowerCase().includes("high") ? "significant" : "moderate"} opportunity for technology-enabled solutions.` : ""}`
    : "Market opportunity data not available. Further market research recommended."
}

${startup.marketInfo?.marketCompetitionAnalysis ? `\n**Market & Competition Analysis:**\n${startup.marketInfo.marketCompetitionAnalysis}` : ""}`)

  // 6. Product & Business Model
  sections.push(`## Product & Business Model

**Product Name:** ${startup.productInfo?.productName || startup.name}
**Problem Solved:** ${startup.productInfo?.problemSolved || "Not specified"}
**Orientation:** ${startup.marketInfo?.b2bOrB2c || "Not specified"}
**Approach:** ${startup.productInfo?.horizontalOrVertical || "Not specified"}

**Revenue Model:** ${startup.businessModelInfo?.revenueModel || "Not specified"}
**Pricing Strategy:** ${startup.businessModelInfo?.pricingStrategy || "Not specified"}
**Unit Economics:** ${startup.businessModelInfo?.unitEconomics || "Not specified"}

${
  startup.productInfo?.problemSolved || startup.businessModelInfo?.revenueModel
    ? `The company ${startup.productInfo?.problemSolved ? `addresses ${startup.productInfo.problemSolved.toLowerCase()}` : "provides a solution"} through a ${startup.marketInfo?.b2bOrB2c || "market-focused"} approach. ${startup.businessModelInfo?.revenueModel ? `Revenue is generated via ${startup.businessModelInfo.revenueModel.toLowerCase()}.` : ""} ${startup.businessModelInfo?.pricingStrategy ? `The pricing strategy is ${startup.businessModelInfo.pricingStrategy.toLowerCase()}.` : ""} ${startup.businessModelInfo?.unitEconomics ? `Unit economics are ${startup.businessModelInfo.unitEconomics.toLowerCase()}.` : ""}`
    : "Product and business model details require further documentation."
}`)

  // 7. Traction & Scale
  sections.push(`## Traction & Scale

**Funding:** ${startup.companyInfo?.fundingRaised || startup.financialInfo?.capitalRaised || "Not disclosed"}
**Lead Investors:** ${startup.companyInfo?.ventureCapitalFirm || startup.financialInfo?.leadInvestors || "Not disclosed"}
**Employees:** ${startup.companyInfo?.employeeCount || "Not specified"}
**Revenue:** ${startup.financialInfo?.estimatedRevenue || "Not disclosed"}

${
  startup.companyInfo?.fundingRaised || startup.companyInfo?.employeeCount
    ? `The company has ${startup.companyInfo?.fundingRaised ? `raised ${startup.companyInfo.fundingRaised}` : "secured funding"}${startup.companyInfo?.ventureCapitalFirm ? ` from ${startup.companyInfo.ventureCapitalFirm}` : ""}. ${startup.companyInfo?.employeeCount ? `The team has grown to ${startup.companyInfo.employeeCount} employees.` : ""} ${startup.financialInfo?.estimatedRevenue ? `Current revenue is estimated at ${startup.financialInfo.estimatedRevenue}.` : ""} This demonstrates ${startup.companyInfo?.fundingRaised && startup.companyInfo?.employeeCount ? "meaningful" : "early-stage"} operational maturity and scale.`
    : "Traction metrics not fully available. Additional financial and operational data recommended."
}`)

  // 8. Go-to-Market Strategy
  sections.push(`## Go-to-Market Strategy

**Target Persona:** ${startup.marketInfo?.targetPersona || "Not specified"}
**Sales Motion:** ${startup.salesInfo?.salesMotion || "Not specified"}
**Sales Cycle Length:** ${startup.salesInfo?.salesCycleLength || "Not specified"}
**Channels:** ${startup.salesInfo?.channels || "Not specified"}
**Sales Complexity:** ${startup.salesInfo?.salesComplexity || "Not specified"}
**GTM Strategy:** ${startup.salesInfo?.gtmStrategy || "Not specified"}

${
  startup.salesInfo?.salesMotion || startup.marketInfo?.targetPersona
    ? `The company targets ${startup.marketInfo?.targetPersona || "key customer segments"} through ${startup.salesInfo?.salesMotion || "a defined sales approach"}. ${startup.salesInfo?.salesCycleLength ? `The typical sales cycle is ${startup.salesInfo.salesCycleLength.toLowerCase()}.` : ""} ${startup.salesInfo?.channels ? `Distribution occurs via ${startup.salesInfo.channels.toLowerCase()}.` : ""} ${startup.salesInfo?.salesComplexity ? `Sales complexity is ${startup.salesInfo.salesComplexity.toLowerCase()}.` : ""}`
    : "Go-to-market strategy requires further documentation."
}`)

  // 9. Competitive Landscape
  sections.push(`## Competitive Landscape

**Competitors:** ${startup.competitiveInfo?.competitors || "Not specified"}
**Moat:** ${startup.productInfo?.moat || "Not specified"}
**Industry Multiples:** ${startup.competitiveInfo?.industryMultiples || "Not specified"}

${
  startup.competitiveInfo?.competitors || startup.productInfo?.moat
    ? `${startup.competitiveInfo?.competitors ? `The company competes with ${startup.competitiveInfo.competitors}.` : "Competitive landscape requires further analysis."} ${startup.productInfo?.moat ? `Differentiation is achieved through ${startup.productInfo.moat.toLowerCase()}.` : ""} ${startup.competitiveInfo?.industryMultiples ? `Industry valuation multiples are ${startup.competitiveInfo.industryMultiples.toLowerCase()}.` : ""}`
    : "Competitive analysis data not available."
}`)

  // 10. Team & Leadership
  sections.push(`## Team & Leadership

**Founders:** ${startup.companyInfo?.founders || "Not specified"}
**Founders' Education:** ${startup.teamInfo?.foundersEducation || "Not specified"}
**Founders' Prior Experience:** ${startup.teamInfo?.foundersPriorExperience || "Not specified"}
**Key Team Members:** ${startup.teamInfo?.keyTeamMembers || "Not specified"}
**Team Depth:** ${startup.teamInfo?.teamDepth || "Not specified"}
**Total Employees:** ${startup.companyInfo?.employeeCount || "Not specified"}

${
  startup.companyInfo?.founders || startup.teamInfo?.foundersEducation
    ? `${startup.companyInfo?.founders ? `The company was founded by ${startup.companyInfo.founders}.` : ""} ${startup.teamInfo?.foundersEducation ? `The founders bring educational credentials from ${startup.teamInfo.foundersEducation}.` : ""} ${startup.teamInfo?.foundersPriorExperience ? `Prior experience includes ${startup.teamInfo.foundersPriorExperience}.` : ""} ${startup.teamInfo?.teamDepth ? `Team depth is characterized as ${startup.teamInfo.teamDepth.toLowerCase()}.` : ""} ${startup.companyInfo?.employeeCount ? `The organization has scaled to ${startup.companyInfo.employeeCount} employees.` : ""}`
    : "Team and leadership information requires further documentation."
}

${startup.teamInfo?.teamExecutionAssessment ? `\n**Team & Execution Assessment:**\n${startup.teamInfo.teamExecutionAssessment}` : ""}`)

  // 11. Financial & Investment Profile
  sections.push(`## Financial & Investment Profile

**Venture Capital Firm:** ${startup.companyInfo?.ventureCapitalFirm || "Not disclosed"}
**Funding Raised:** ${startup.companyInfo?.fundingRaised || startup.financialInfo?.capitalRaised || "Not disclosed"}
**Lead Investors:** ${startup.financialInfo?.leadInvestors || "Not disclosed"}
**Industry Multiples:** ${startup.competitiveInfo?.industryMultiples || "Not specified"}
**Exit Potential:** ${startup.opportunityInfo?.exitPotential || "Not assessed"}

${
  startup.companyInfo?.fundingRaised || startup.companyInfo?.ventureCapitalFirm
    ? `${startup.companyInfo?.fundingRaised ? `The company has raised ${startup.companyInfo.fundingRaised}` : "Funding has been secured"}${startup.companyInfo?.ventureCapitalFirm ? ` from ${startup.companyInfo.ventureCapitalFirm}` : ""}${startup.financialInfo?.leadInvestors ? `, with lead investors including ${startup.financialInfo.leadInvestors}` : ""}. ${startup.opportunityInfo?.exitPotential ? `Exit potential is assessed as ${startup.opportunityInfo.exitPotential.toLowerCase()}.` : ""} ${startup.competitiveInfo?.industryMultiples ? `Industry valuation multiples are ${startup.competitiveInfo.industryMultiples.toLowerCase()}.` : ""}`
    : "Financial and investment profile data not fully available."
}`)

  // 12. Key Strengths
  sections.push(`## Key Strengths

${
  startup.rationale?.keyStrengths ||
  startup.rationale?.whyInvest?.length ||
  startup.companyInfo?.fundingRaised ||
  startup.teamInfo?.foundersEducation
    ? startup.rationale?.keyStrengths
      ? startup.rationale.keyStrengths
      : startup.rationale?.whyInvest?.length
        ? startup.rationale.whyInvest.map((strength, i) => `${i + 1}. ${strength}`).join("\n")
        : `Based on available data:
${startup.companyInfo?.fundingRaised ? `- Secured ${startup.companyInfo.fundingRaised} in funding${startup.companyInfo?.ventureCapitalFirm ? ` from ${startup.companyInfo.ventureCapitalFirm}` : ""}` : ""}
${startup.teamInfo?.foundersEducation ? `- Strong founder credentials: ${startup.teamInfo.foundersEducation}` : ""}
${startup.marketInfo?.marketSize ? `- Large addressable market: ${startup.marketInfo.marketSize}` : ""}
${startup.productInfo?.moat ? `- Competitive differentiation: ${startup.productInfo.moat}` : ""}
${startup.riskInfo?.regulatoryRisk && startup.riskInfo.regulatoryRisk.toLowerCase().includes("low") ? "- Favorable regulatory environment" : ""}`
    : "Key strengths require further assessment based on additional data."
}`)

  // 13. Areas of Concern
  sections.push(`## Areas of Concern

${
  startup.rationale?.areasOfConcern ||
  startup.rationale?.whyNot?.length ||
  startup.riskInfo?.regulatoryRisk ||
  startup.competitiveInfo?.competitors
    ? startup.rationale?.areasOfConcern
      ? startup.rationale.areasOfConcern
      : startup.rationale?.whyNot?.length
        ? startup.rationale.whyNot.map((concern, i) => `${i + 1}. ${concern}`).join("\n")
        : `Based on available data:
${startup.riskInfo?.regulatoryRisk && !startup.riskInfo.regulatoryRisk.toLowerCase().includes("low") ? `- Regulatory considerations: ${startup.riskInfo.regulatoryRisk}` : ""}
${startup.competitiveInfo?.competitors ? `- Competitive pressure: ${startup.competitiveInfo.competitors}` : ""}
${!startup.financialInfo?.estimatedRevenue ? "- Revenue metrics not disclosed" : ""}
${!startup.companyInfo?.fundingRaised ? "- Funding history not fully documented" : ""}
${startup.salesInfo?.salesComplexity && startup.salesInfo.salesComplexity.toLowerCase().includes("high") ? `- Sales complexity: ${startup.salesInfo.salesComplexity}` : ""}`
    : "Areas of concern require further assessment based on additional data."
}`)

  // 14. Risk & Regulatory Outlook
  sections.push(`## Risk & Regulatory Outlook

**Regulatory Risk:** ${startup.riskInfo?.regulatoryRisk || "Not assessed"}
**Country:** ${startup.country || "N/A"}
**Area:** ${startup.companyInfo?.area || "Not specified"}

${
  startup.riskInfo?.regulatoryRisk || startup.country
    ? `${startup.riskInfo?.regulatoryRisk ? `Regulatory risk is characterized as ${startup.riskInfo.regulatoryRisk.toLowerCase()}.` : "Regulatory considerations require assessment."} ${startup.country ? `Operating in ${startup.country}${startup.companyInfo?.area ? ` (${startup.companyInfo.area})` : ""} presents ${startup.riskInfo?.regulatoryRisk && startup.riskInfo.regulatoryRisk.toLowerCase().includes("low") ? "manageable" : "standard"} jurisdictional considerations.` : ""}`
    : "Risk and regulatory outlook requires further analysis."
}`)

  // 15. Investment Recommendation
  const mlScore = startup.aiScores?.ml || 0
  const hasStrongData =
    startup.companyInfo?.fundingRaised && startup.teamInfo?.foundersEducation && startup.marketInfo?.marketSize
  const recommendation =
    mlScore >= 75 && hasStrongData ? "Invest" : mlScore >= 60 || hasStrongData ? "Watch" : "Decline"

  sections.push(`## Investment Recommendation

**Verdict:** ${recommendation}

${
  recommendation === "Invest"
    ? `**Rationale:**
1. Strong ML score (${mlScore}/100) indicates solid investment potential
2. ${startup.companyInfo?.fundingRaised ? `Validated by ${startup.companyInfo.fundingRaised} in funding` : "Positive market indicators"}
3. ${startup.teamInfo?.foundersEducation || startup.teamInfo?.foundersPriorExperience ? "Experienced founding team with relevant credentials" : "Favorable market dynamics"}

**Next Steps:**
1. Proceed to detailed due diligence
2. Schedule partner review meeting
3. Request additional financial documentation
4. Conduct reference checks with customers and investors`
    : recommendation === "Watch"
      ? `**Rationale:**
1. ML score (${mlScore}/100) suggests potential but requires validation
2. ${!startup.companyInfo?.fundingRaised ? "Funding history needs clarification" : "Some data gaps exist"}
3. Additional information needed for confident decision

**Next Steps:**
1. Request missing data points (financials, metrics, team details)
2. Conduct deeper market analysis
3. Schedule follow-up meeting to address concerns
4. Re-evaluate after data collection`
      : `**Rationale:**
1. ML score (${mlScore}/100) indicates significant concerns
2. Insufficient data for confident investment decision
3. ${!hasStrongData ? "Critical information gaps in team, market, or traction data" : "Risk factors outweigh potential upside"}

**Next Steps:**
1. Provide feedback to company on areas for improvement
2. Maintain relationship for future consideration
3. Re-evaluate if circumstances change materially`
}

**Confidence Level:** ${mlScore >= 75 && hasStrongData ? "High" : mlScore >= 60 || hasStrongData ? "Medium" : "Low"}
**Data Completeness:** ${hasStrongData ? "Good" : "Requires improvement"}

---

*Investment Memo Generated: ${new Date().toLocaleString()}*
*Pipeline Stage: ${startup.pipelineStage || "Screening"}*
*Overall Score: ${startup.score}/100*`)

  return sections.join("\n\n")
}

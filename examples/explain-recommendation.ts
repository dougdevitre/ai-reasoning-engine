/**
 * @example Explain Recommendation
 * @description Generates a natural language explanation for an AI recommendation,
 * including source citations and alternative conclusions.
 */

import {
  ReasoningTracer,
  ConfidenceCalculator,
  ExplanationGenerator,
} from '../src';

async function explainRecommendation() {
  const tracer = new ReasoningTracer();

  // Build a trace
  const trace = tracer.startTrace('Should I file a motion to modify custody?');

  tracer.addStep(trace.id, {
    description: 'Analyze substantial change in circumstances requirement',
    sources: [{
      id: 's1', title: 'Family Code 3087', type: 'statute',
      qualityScore: 0.9, jurisdiction: 'california',
    }],
    method: 'statutory_interpretation',
    result: 'A motion to modify requires showing a substantial change in circumstances since the last order',
  });

  tracer.addStep(trace.id, {
    description: 'Evaluate reported changes against legal standard',
    sources: [{
      id: 's2', title: 'In re Marriage of LaMusga', type: 'case_law',
      qualityScore: 0.85,
    }],
    method: 'factual_assessment',
    result: 'The reported relocation constitutes a substantial change under the LaMusga standard',
  });

  const completed = tracer.complete(trace.id);

  // Calculate confidence
  const confidence = new ConfidenceCalculator().calculate(completed);

  // Generate explanation
  const explainer = new ExplanationGenerator({ depth: 'detailed', showConfidence: true });
  const explanation = explainer.explain(completed, confidence, [
    {
      conclusion: 'Do not file — changes may not meet the substantial change standard',
      rejectionReason: 'The relocation meets the LaMusga threshold based on case law analysis',
      confidence: 0.25,
      supportingSources: [],
    },
  ]);

  console.log('=== Summary ===');
  console.log(explanation.summary);

  console.log('\n=== Detailed Explanation ===');
  console.log(explanation.detailed);

  console.log('\n=== Citations ===');
  for (const citation of explanation.citations) {
    console.log(`  - "${citation.claim}" → ${citation.source.title}`);
  }

  console.log('\n=== Alternatives Considered ===');
  for (const alt of explanation.alternatives) {
    console.log(`  - ${alt.conclusion}`);
    console.log(`    Rejected because: ${alt.rejectionReason}`);
  }
}

explainRecommendation().catch(console.error);

/**
 * @example Trace Legal Research
 * @description Demonstrates tracing an AI legal research query through
 * multiple reasoning steps with source attribution.
 */

import { ReasoningTracer, ConfidenceCalculator } from '../src';

async function traceLegalResearch() {
  const tracer = new ReasoningTracer();

  // --- 1. Start a trace for a custody question ---
  const trace = tracer.startTrace(
    'What factors does California consider in child custody decisions?',
    { jurisdiction: 'california', caseType: 'family' }
  );
  console.log(`Trace started: ${trace.id}`);

  // --- 2. Add reasoning steps ---
  tracer.addStep(trace.id, {
    description: 'Identify the primary custody statute',
    sources: [
      {
        id: 'cal_fam_3011',
        title: 'California Family Code Section 3011',
        type: 'statute',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=FAM&sectionNum=3011',
        jurisdiction: 'california',
        qualityScore: 0.95,
      },
    ],
    method: 'source_analysis',
    result: 'Section 3011 lists the statutory best interest factors including health/safety, nature of contact, history of abuse, and substance abuse',
  });

  tracer.addStep(trace.id, {
    description: 'Analyze case law interpreting the statute',
    sources: [
      {
        id: 'marriage_brown',
        title: 'In re Marriage of Brown & Yana (2006)',
        type: 'case_law',
        qualityScore: 0.85,
        jurisdiction: 'california',
      },
      {
        id: 'montenegro',
        title: 'Montenegro v. Diaz (2001)',
        type: 'case_law',
        qualityScore: 0.80,
        jurisdiction: 'california',
      },
    ],
    method: 'comparative_analysis',
    result: 'Courts apply a totality of circumstances test; no single factor is dispositive',
  });

  tracer.addStep(trace.id, {
    description: 'Review recent legislative changes',
    sources: [
      {
        id: 'ab_957',
        title: 'AB-957 (2023 Session)',
        type: 'statute',
        qualityScore: 0.9,
        jurisdiction: 'california',
        publishedAt: '2023-10-01',
      },
    ],
    method: 'statutory_interpretation',
    result: 'Recent amendments expanded consideration of each parent\'s willingness to support the child\'s relationship with the other parent',
  });

  tracer.addStep(trace.id, {
    description: 'Synthesize findings into comprehensive answer',
    sources: [
      {
        id: 'cal_fam_3011',
        title: 'California Family Code Section 3011',
        type: 'statute',
        qualityScore: 0.95,
      },
    ],
    method: 'synthesis',
    result: 'California considers health/safety, contact quality, abuse history, substance abuse, and willingness to co-parent as custody factors',
  });

  // --- 3. Complete the trace ---
  const completed = tracer.complete(trace.id);
  console.log(`Trace completed with ${completed.steps.length} steps`);
  console.log(`Aggregate confidence: ${completed.aggregateConfidence?.toFixed(2)}`);

  // --- 4. Calculate detailed confidence ---
  const calculator = new ConfidenceCalculator({ uncertaintyThreshold: 0.6 });
  const confidence = calculator.calculate(completed);

  console.log(`\nConfidence: ${confidence.aggregate}%`);
  console.log(`Chain strength: ${confidence.chainStrength.toFixed(1)}%`);

  if (confidence.uncertainAreas.length > 0) {
    console.log(`\nUncertain areas:`);
    for (const area of confidence.uncertainAreas) {
      console.log(`  - ${area}`);
    }
  }

  // --- 5. List all sources used ---
  const sources = tracer.getSources(trace.id);
  console.log(`\nSources used (${sources.length}):`);
  for (const source of sources) {
    console.log(`  - [${source.type}] ${source.title}`);
  }
}

traceLegalResearch().catch(console.error);

import { parse } from 'csv-parse/sync';

export interface LeetCodeQuestion {
  id: number;
  qid: number;
  title: string;
  title_slug: string;
  difficulty: string;
  acceptance_rate: number;
  topic_tags: string[];
  question_body: string;
  examples: any;
  constraints: string[];
  follow_up: string;
  hints?: string[];
  Companies: string;
}

import fs from 'fs/promises';
import path from 'path';

export async function loadQuestions(): Promise<LeetCodeQuestion[]> {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'leetcode_questions_with_companies.csv');
    const fileContent = await fs.readFile(csvPath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      cast: true,
      cast_date: false,
      relax_quotes: true,
      escape: '\\',
      relax_column_count: true,
      delimiter: ',',
      quote: '"',
      from_line: 1
    });
    
    const questions: LeetCodeQuestion[] = records.map((record: any) => {
      try {
        // Parse topic tags
        const topic_tags = record.topic_tags ? JSON.parse(record.topic_tags.replace(/'/g, '"')) : [];
        
        // Parse examples
        let examples: any[] = [];
        if (record.examples) {
          try {
            examples = JSON.parse(record.examples.replace(/"<\/strong> /g, '').replace(/<\/strong>/g, ''));
          } catch (e) {
            console.warn('Failed to parse examples:', e);
          }
        }

        // Parse constraints
        const constraints = record.constraints ? JSON.parse(record.constraints.replace(/'/g, '"')) : [];

        return {
          id: record.id,
          qid: record.qid,
          title: record.title,
          title_slug: record.title_slug,
          difficulty: record.difficulty,
          acceptance_rate: record.acceptance_rate,
          topic_tags,
          question_body: record.question_body,
          examples: examples.map((ex: any) => ({ input: ex.input, output: ex.output, explanation: ex.explanation })),
          constraints,
          follow_up: record.follow_up,
          Companies: record.Companies || ''
        };
      } catch (error) {
        console.error('Error processing record:', error, record);
        return null;
      }
    })
    .filter((q: any): q is LeetCodeQuestion => q !== null)
    .sort((a: LeetCodeQuestion, b: LeetCodeQuestion) => a.qid - b.qid);
    
    // Verify we have all expected qids
    console.log('Loaded questions:', questions.map((q: LeetCodeQuestion) => q.qid));
    return questions;
  } catch (error) {
    console.error('Error loading questions:', error);
    return [];
  }
}

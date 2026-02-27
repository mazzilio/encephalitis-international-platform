import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;

interface SuggestedTag {
  category: string;
  tag: string;
  reasoning: string;
  confidence: number;
  url: string;
  title: string;
}

interface TagAnalysis {
  suggested_tags: SuggestedTag[];
  tag_frequency: Record<string, {
    count: number;
    avg_confidence: number;
    examples: { url: string; title: string; reasoning: string }[];
  }>;
  classification_gaps: {
    missing_categories: string[];
    ambiguous_content: string[];
    needs_review_count: number;
  };
  recommendations: {
    high_priority_additions: string[];
    low_confidence_items: { url: string; title: string; confidence: number }[];
    coverage_gaps: string[];
  };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const batchId = event.pathParameters?.batchId;

    if (!batchId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing batchId parameter' }),
      };
    }

    // List all result files for this batch
    const listResult = await s3Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `results/${batchId}/`,
    }));

    if (!listResult.Contents || listResult.Contents.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No results found for this batch' }),
      };
    }

    // Fetch and analyze all results
    const allSuggestedTags: SuggestedTag[] = [];
    const allGaps: { missing: string[]; ambiguous: string[]; needsReview: boolean }[] = [];
    const lowConfidenceItems: { url: string; title: string; confidence: number }[] = [];

    for (const obj of listResult.Contents) {
      const getResult = await s3Client.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: obj.Key,
      }));

      const body = await streamToString(getResult.Body as Readable);
      const classification = JSON.parse(body);

      // Collect suggested new tags
      if (classification.suggested_new_tags && classification.suggested_new_tags.length > 0) {
        classification.suggested_new_tags.forEach((tag: any) => {
          allSuggestedTags.push({
            ...tag,
            url: classification.url,
            title: classification.title,
          });
        });
      }

      // Collect classification gaps
      if (classification.classification_gaps) {
        allGaps.push({
          missing: classification.classification_gaps.missing_categories || [],
          ambiguous: classification.classification_gaps.ambiguous_content || [],
          needsReview: classification.classification_gaps.needs_review || false,
        });
      }

      // Collect low confidence items
      if (classification.confidence_scores?.overall_classification < 70) {
        lowConfidenceItems.push({
          url: classification.url,
          title: classification.title,
          confidence: classification.confidence_scores.overall_classification,
        });
      }
    }

    // Analyze tag frequency
    const tagFrequency: Record<string, {
      count: number;
      confidences: number[];
      examples: { url: string; title: string; reasoning: string }[];
    }> = {};

    allSuggestedTags.forEach(tag => {
      const key = `${tag.category}:${tag.tag}`;
      if (!tagFrequency[key]) {
        tagFrequency[key] = {
          count: 0,
          confidences: [],
          examples: [],
        };
      }
      tagFrequency[key].count++;
      tagFrequency[key].confidences.push(tag.confidence);
      if (tagFrequency[key].examples.length < 3) {
        tagFrequency[key].examples.push({
          url: tag.url,
          title: tag.title,
          reasoning: tag.reasoning,
        });
      }
    });

    // Calculate average confidence and format
    const formattedFrequency: Record<string, {
      count: number;
      avg_confidence: number;
      examples: { url: string; title: string; reasoning: string }[];
    }> = {};

    Object.entries(tagFrequency).forEach(([key, data]) => {
      formattedFrequency[key] = {
        count: data.count,
        avg_confidence: data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length,
        examples: data.examples,
      };
    });

    // Identify high-priority additions (suggested by multiple items with high confidence)
    const highPriorityAdditions = Object.entries(formattedFrequency)
      .filter(([_, data]) => data.count >= 3 && data.avg_confidence >= 80)
      .map(([tag, _]) => tag)
      .sort((a, b) => formattedFrequency[b].count - formattedFrequency[a].count);

    // Aggregate missing categories
    const allMissingCategories = allGaps.flatMap(g => g.missing);
    const missingCategoryFrequency: Record<string, number> = {};
    allMissingCategories.forEach(cat => {
      missingCategoryFrequency[cat] = (missingCategoryFrequency[cat] || 0) + 1;
    });

    const coverageGaps = Object.entries(missingCategoryFrequency)
      .filter(([_, count]) => count >= 2)
      .map(([cat, _]) => cat);

    // Build analysis response
    const analysis: TagAnalysis = {
      suggested_tags: allSuggestedTags,
      tag_frequency: formattedFrequency,
      classification_gaps: {
        missing_categories: Array.from(new Set(allMissingCategories)),
        ambiguous_content: Array.from(new Set(allGaps.flatMap(g => g.ambiguous))),
        needs_review_count: allGaps.filter(g => g.needsReview).length,
      },
      recommendations: {
        high_priority_additions: highPriorityAdditions,
        low_confidence_items: lowConfidenceItems.sort((a, b) => a.confidence - b.confidence),
        coverage_gaps: coverageGaps,
      },
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(analysis, null, 2),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

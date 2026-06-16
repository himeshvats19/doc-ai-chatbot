import { ingestDocuments } from '@/lib/ingest';

export async function POST() {
  try {
    const stats = await ingestDocuments();

    return Response.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Ingest API error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to ingest documents',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

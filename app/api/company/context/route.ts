import { NextRequest, NextResponse } from 'next/server';
import { getCompanyIfExists, searchCompanyVectors } from '@/lib/rag/queryEngine';

export async function POST(request: NextRequest) {
  try {
    const { companyName, query } = await request.json();
    
    // Validate inputs
    if (!companyName) {
      return NextResponse.json(
        { message: 'Company name is required' },
        { status: 400 }
      );
    }
    
    if (!query) {
      return NextResponse.json(
        { message: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Get company ID from company name
    const { exists, companyId } = await getCompanyIfExists(companyName);
    
    if (!exists || !companyId) {
      return NextResponse.json(
        { message: `Company "${companyName}" not found` },
        { status: 404 }
      );
    }
    
    console.log(`Searching company "${companyName}" with ID: ${companyId}...`);
    const { context, sources } = await searchCompanyVectors(companyId, query);

    console.log(`Context: ${context}`);
    console.log(`Sources: ${JSON.stringify(sources)}`);
    return NextResponse.json({
      context,
      sources,
      companyId: companyId.toString()
    });
  } catch (error) {
    console.error('Error in company query API:', error);
    return NextResponse.json(
      { 
        message: 'Error processing query', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

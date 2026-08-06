import { NextRequest, NextResponse } from "next/server";
import { vectorStore } from "../ingest/route";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!vectorStore) {
      return NextResponse.json(
        { context: "No clinic website has been loaded yet." }
      );
    }

    // Search for top 3 most relevant chunks
    const results = await vectorStore.similaritySearch(query, 3);

    const context = results
      .map((doc) => doc.pageContent)
      .join("\n\n");

    return NextResponse.json({ context });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { context: "Search failed." },
      { status: 500 }
    );
  }
}
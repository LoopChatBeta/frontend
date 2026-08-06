import { NextRequest, NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

// In-memory vector store for the hackathon
// Replace with Qdrant or AnalyticDB for production
export let vectorStore: MemoryVectorStore | null = null;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Step 1: Crawl the website
    const firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY!,
    });

    console.log(`Crawling: ${url}`);
    const result = await firecrawl.scrape(url, {
      formats: ["markdown"],
    });

    if (!result.markdown) {
      return NextResponse.json(
        { error: "No markdown content returned from URL" },
        { status: 500 }
      );
    }

    // Step 2: Split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const docs = await splitter.createDocuments([result.markdown]);


    // Step 3: Embed in batches of 10 (DashScope limit)
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.DASHSCOPE_API_KEY!,
      configuration: {
        baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      },  
      model: "text-embedding-v3",
      batchSize: 10,
    });

    vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

    console.log(`Ingested ${docs.length} chunks from ${url}`);

    console.log(`Ingested ${docs.length} chunks from ${url}`);

    // Return the top chunks directly so frontend doesn't need a second call
    const topChunks = docs.slice(0, 10).map((d) => d.pageContent).join("\n\n");

    return NextResponse.json({
      success: true,
      chunks: docs.length,
      message: `Successfully ingested ${docs.length} chunks`,
      context: topChunks,
    });

  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      { error: "Ingestion failed" },
      { status: 500 }
    );
  }
}
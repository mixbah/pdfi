import { DocumentProcessor } from "@/components/document-processor"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">PDFI Summarizer</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Upload images or PDFs and get AI-powered summaries instantly.Drag and drop your files or click to browse.
          </p>
        </div>
        <DocumentProcessor />
      </div>
    </main>
  )
}

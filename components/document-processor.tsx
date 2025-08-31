"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FileText, ImageIcon, Download, Upload, Loader2, CheckCircle, AlertCircle, History, Trash2 } from "lucide-react"

interface ProcessedFile {
  id: string
  name: string
  type: string
  size: number
  summary: string
  status: "processing" | "completed" | "error"
  progress: number
  processedAt?: Date
  createdAt?: Date
}

interface MongoDocument {
  _id: string
  fileName: string
  fileType: string
  fileSize: number
  summary: string
  processedAt: string
  processingTime: number
}

export function DocumentProcessor() {
  const [files, setFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [history, setHistory] = useState<ProcessedFile[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true)
      try {
        const response = await fetch("/api/history?limit=50", { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          const formattedHistory = (data.documents || []).map((doc: any) => {
            const id = typeof doc._id === "string" ? doc._id : doc?._id?.$oid ? doc._id.$oid : String(doc._id)
            const processedAtStr: string | undefined =
              typeof doc.processedAt === "string"
                ? doc.processedAt
                : doc?.processedAt?.$date
                  ? doc.processedAt.$date
                  : undefined
            return {
              id,
              name: doc.fileName as string,
              type: doc.fileType as string,
              size: Number(doc.fileSize) || 0,
              summary: (doc.summary as string) || "",
              status: "completed" as const,
              progress: 100,
              processedAt: processedAtStr ? new Date(processedAtStr) : undefined,
            }
          })
          setHistory(formattedHistory)
        }
      } catch (error) {
        console.error("Failed to load history:", error)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    fetchHistory()
  }, [])

  const refreshHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/history?limit=50", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        const formattedHistory = (data.documents || []).map((doc: any) => {
          const id = typeof doc._id === "string" ? doc._id : doc?._id?.$oid ? doc._id.$oid : String(doc._id)
          const processedAtStr: string | undefined =
            typeof doc.processedAt === "string"
              ? doc.processedAt
              : doc?.processedAt?.$date
                ? doc.processedAt.$date
                : undefined
          return {
            id,
            name: doc.fileName as string,
            type: doc.fileType as string,
            size: Number(doc.fileSize) || 0,
            summary: (doc.summary as string) || "",
            status: "completed" as const,
            progress: 100,
            processedAt: processedAtStr ? new Date(processedAtStr) : undefined,
          }
        })
        setHistory(formattedHistory)
      }
    } catch (error) {
      console.error("Failed to refresh history:", error)
    }
  }, [])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: ProcessedFile[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        summary: "",
        status: "processing" as const,
        progress: 0,
        createdAt: new Date(),
      }))

      setFiles((prev) => [...prev, ...newFiles])
      setIsProcessing(true)

      for (const file of acceptedFiles) {
        const fileId = newFiles.find((f) => f.name === file.name)?.id
        if (!fileId) continue

        try {
          console.log("[v0] Processing file:", file.name, "Type:", file.type, "Size:", file.size)

          setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress: 25 } : f)))

          const formData = new FormData()
          formData.append("file", file)

          console.log("[v0] Sending request to API...")
          const response = await fetch("/api/process-document", {
            method: "POST",
            body: formData,
          })

          console.log("[v0] API response status:", response.status)
          setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress: 75 } : f)))

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
            console.error("[v0] API error:", errorData)
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          }

          const result = await response.json()
          console.log("[v0] API success, summary length:", result.summary?.length || 0)

          if (!result.summary) {
            throw new Error("No summary received from API")
          }

          const completedFile = {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            summary: result.summary,
            status: "completed" as const,
            progress: 100,
            processedAt: new Date(),
          }

          setFiles((prev) => prev.map((f) => (f.id === fileId ? completedFile : f)))

          await refreshHistory()
        } catch (error) {
          console.error("[v0] Error processing file:", error)
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
          console.error("[v0] Error details:", errorMessage)

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, status: "error", progress: 0, summary: `Error: ${errorMessage}` } : f,
            ),
          )
        }
      }

      setIsProcessing(false)
    },
    [refreshHistory],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const downloadSummary = (file: ProcessedFile) => {
    const blob = new Blob([file.summary], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${file.name.split(".")[0]}_summary.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const clearHistory = async () => {
    try {
      for (const item of history) {
        await fetch(`/api/history?id=${item.id}`, { method: "DELETE" })
      }
      await refreshHistory()
      setHistory([])
    } catch (error) {
      console.error("Failed to clear history:", error)
    }
  }

  const removeFromHistory = async (id: string) => {
    try {
      const response = await fetch(`/api/history?id=${id}`, { method: "DELETE" })
      if (response.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id))
      }
    } catch (error) {
      console.error("Failed to remove from history:", error)
    }
  }

  return (
    <div
      className="dark min-h-screen bg-background text-foreground max-w-4xl mx-auto space-y-8 px-4 py-8"
      role="region"
      aria-label="AI Document Processor"
    >
      {/* Upload Section */}
      <section aria-labelledby="uploader-title" className="space-y-4">
        <h2 id="uploader-title" className="sr-only">
          Upload
        </h2>
        <Card>
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? "border-foreground/50 bg-muted" : "border-border hover:border-foreground/30 hover:bg-muted/50"}
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {isDragActive ? "Drop files here" : "Drag & drop files here"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse • PDF, PNG, JPG, GIF up to 10MB
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span>PDF</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <span>Images</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Divider to visually separate sections while staying monochrome */}
      <div className="h-px bg-border" aria-hidden="true" />

      {/* History Toolbar (kept between uploader and output) */}
      <section aria-labelledby="history-toolbar" className="rounded-md border bg-background/50">
        <div id="history-toolbar" className="flex items-center justify-between p-3">
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoadingHistory}
          >
            {isLoadingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
            <span className="text-foreground">
              {isLoadingHistory
                ? "Loading History..."
                : showHistory
                  ? "Hide History"
                  : `View History (${history.length})`}
            </span>
          </Button>
          {showHistory && history.length > 0 ? (
            <Button
              onClick={clearHistory}
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground px-2" aria-live="polite">
              {history.length === 0 && !isLoadingHistory ? "No history yet" : null}
            </div>
          )}
        </div>
      </section>

      {/* Processing History Section */}
      {showHistory && (
        <>
          {history.length > 0 ? (
            (() => {
              const sortedHistory = [...history].sort((a, b) => {
                const ta = a.processedAt ? a.processedAt.getTime() : 0
                const tb = b.processedAt ? b.processedAt.getTime() : 0
                return tb - ta // newest first
              })
              return (
                <section aria-labelledby="history-title" className="space-y-4">
                  <h2 id="history-title" className="text-2xl font-semibold text-foreground">
                    Processing History
                  </h2>
                  {sortedHistory.map((file) => (
                    <Card key={file.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              {file.type.startsWith("image/") ? (
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{file.name}</CardTitle>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{formatFileSize(file.size)}</span>
                                {file.processedAt && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      {file.processedAt.toLocaleDateString()} {file.processedAt.toLocaleTimeString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                            <Button
                              onClick={() => removeFromHistory(file.id)}
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-muted border border-border">
                            <h4 className="font-medium text-foreground mb-2">AI Summary:</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{file.summary}</p>
                          </div>
                          <Button
                            onClick={() => downloadSummary(file)}
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Summary
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </section>
              )
            })()
          ) : (
            <section className="p-6 rounded-md border bg-muted/30 text-muted-foreground">
              No past documents yet. Upload a PDF or image to see your history here.
            </section>
          )}
        </>
      )}

      {/* Processing Alert */}
      {isProcessing && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Processing your documents with AI. This may take a few moments...</AlertDescription>
        </Alert>
      )}

      {/* Current Session Section */}
      {files.length > 0 &&
        (() => {
          const sortedFiles = [...files].sort((a, b) => {
            const timeA = a.processedAt?.getTime?.() ?? a.createdAt?.getTime?.() ?? 0
            const timeB = b.processedAt?.getTime?.() ?? b.createdAt?.getTime?.() ?? 0
            return timeB - timeA
          })
          return (
            <section aria-labelledby="session-title" className="space-y-4">
              <h2 id="session-title" className="text-2xl font-semibold text-foreground">
                Current Session
              </h2>
              {sortedFiles.map((file) => (
                <Card key={file.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {file.type.startsWith("image/") ? (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{file.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === "processing" && (
                          <Badge variant="outline">
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Processing
                          </Badge>
                        )}
                        {file.status === "completed" && (
                          <Badge variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        {file.status === "error" && (
                          <Badge variant="outline" className="text-foreground">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {file.status === "processing" && (
                      <div className="space-y-2">
                        <Progress value={file.progress} className="w-full" />
                        <p className="text-sm text-muted-foreground">{file.progress}% complete</p>
                      </div>
                    )}
                    {file.status === "completed" && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted border border-border">
                          <h4 className="font-medium text-foreground mb-2">AI Summary:</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{file.summary}</p>
                        </div>
                        <Button
                          onClick={() => downloadSummary(file)}
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Summary
                        </Button>
                      </div>
                    )}
                    {file.status === "error" && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {file.summary.startsWith("Error: ")
                            ? file.summary
                            : "Failed to process this document. Please try again."}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </section>
          )
        })()}
    </div>
  )
}

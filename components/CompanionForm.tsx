'use client';

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect, useState } from "react"
import { redirect } from "next/navigation"
import { Loader2, FileText, Upload, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

import { subjects } from "@/constants"
import { createCompanionWithPDF } from "@/lib/actions/companion.actions"
import { PDFUpload } from "@/components/PDFUpload"

const formSchema = z.object({
  name: z.string().min(1, { message: 'Companion name is required' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  topic: z.string().min(1, { message: 'Topic is required' }),
  voice: z.string().min(1, { message: 'Voice is required' }),
  style: z.string().min(1, { message: 'Style is required' }),
  duration: z.coerce.number().min(1, { message: 'Duration is required' }),
  language: z.string().min(1, { message: 'Language is required' }),
})

type FormData = z.infer<typeof formSchema>;

// Loading stages for better UX
const LOADING_STAGES = [
  { id: 'validating', label: 'Validating form data...', progress: 10 },
  { id: 'processing-pdf', label: 'Processing PDF document...', progress: 30 },
  { id: 'extracting-text', label: 'Extracting text content...', progress: 50 },
  { id: 'uploading-file', label: 'Uploading to cloud storage...', progress: 70 },
  { id: 'creating-companion', label: 'Creating your AI companion...', progress: 90 },
  { id: 'finalizing', label: 'Finalizing setup...', progress: 100 },
]

const CompanionForm = () => {
  const [loading, setLoading] = useState(false)
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null)
  const [loadingStage, setLoadingStage] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      subject: '',
      topic: '',
      voice: '',
      style: '',
      duration: 15,
      language: '',
    },
  })

  useEffect(() => {
    if (selectedPDF) {
      const pdfName = selectedPDF.name.replace(/\.[^/.]+$/, ""); 
      form.setValue('name', `${pdfName} Tutor`);
      form.setValue('topic', `Content from ${pdfName}`);
    }
  }, [selectedPDF, form]);

  // Simulate loading stages for better UX
  const simulateLoadingStages = async () => {
    for (const stage of LOADING_STAGES) {
      setLoadingStage(stage.label)
      setProgress(stage.progress)
      
      // Add realistic delays between stages
      if (stage.id === 'processing-pdf' && selectedPDF) {
        // PDF processing takes longer, especially for larger files
        const fileSize = selectedPDF.size / (1024 * 1024) // Size in MB
        const delay = Math.min(fileSize * 500, 3000) // 500ms per MB, max 3 seconds
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        await new Promise(resolve => setTimeout(resolve, 800))
      }
    }
  }

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true)
      setError(null)
      setProgress(0)
      
      console.log('🚀 Starting companion creation process...')
      console.log('📝 Form values:', values)
      console.log('📄 Selected PDF:', selectedPDF ? {
        name: selectedPDF.name,
        size: `${(selectedPDF.size / 1024 / 1024).toFixed(2)}MB`,
        type: selectedPDF.type
      } : 'None')

      // Start the loading simulation
      const loadingPromise = simulateLoadingStages()
      
      // Start the actual companion creation
      const creationPromise = createCompanionWithPDF({
        ...values,
        pdfFile: selectedPDF || undefined
      })

      // Wait for both to complete
      const [companion] = await Promise.all([creationPromise, loadingPromise])

      console.log('✅ Companion created successfully:', companion)

      if (companion) {
        setLoadingStage('Redirecting to your companion...')
        setProgress(100)
        
        // Small delay to show completion
        setTimeout(() => {
          redirect(`/companions/${companion.id}`)
        }, 1000)
      } else {
        throw new Error('No companion data returned')
      }
    } catch (error) {
      console.error('❌ Error creating companion:', error)
      setError(error instanceof Error ? error.message : 'Failed to create companion')
      setLoading(false)
      setProgress(0)
      setLoadingStage('')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Create Your AI Companion</h1>
        <p className="text-gray-500 mt-2">Build a personalized tutor for your learning journey</p>
      </div>

      {/* Loading Progress */}
      {loading && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Creating Your Companion</span>
          </div>
          
          <Progress value={progress} className="mb-2" />
          
          <p className="text-sm text-blue-700">{loadingStage}</p>
          
          {selectedPDF && progress >= 30 && progress < 70 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
              <FileText className="h-4 w-4" />
              Processing {selectedPDF.name} ({(selectedPDF.size / 1024 / 1024).toFixed(2)}MB)
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* PDF Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Learning Material
            </h3>
            <PDFUpload
              onFileSelect={setSelectedPDF}
              selectedFile={selectedPDF}
              disabled={loading}
            />
            
            {/* PDF Info */}
            {selectedPDF && !loading && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  PDF ready: {selectedPDF.name} ({(selectedPDF.size / 1024 / 1024).toFixed(2)}MB)
                </span>
              </div>
            )}
          </div>

          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Companion Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={selectedPDF ? `${selectedPDF.name} Tutor` : "E.g. Math Mentor, Grammar Guru..."} 
                    disabled={loading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Subject */}
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject} className="capitalize">
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Topic */}
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What should your companion help with?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={
                      selectedPDF 
                        ? `Content from ${selectedPDF.name}` 
                        : "E.g. Algebra, Tenses, Cell Division..."
                    }
                    className="min-h-[100px]"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Voice & Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="voice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voice</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Style</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Duration & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={60} disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="zh">🇨🇳 中文</SelectItem>
                        <SelectItem value="ms">🇲🇾 Malay</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                {progress < 100 ? 'Processing...' : 'Almost Done!'}
              </>
            ) : (
              'Create Your AI Companion'
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}

export default CompanionForm
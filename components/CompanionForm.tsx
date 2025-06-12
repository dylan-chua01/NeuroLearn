'use client';

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect, useState } from "react"
import { redirect } from "next/navigation"
import { useUser, useAuth } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { Loader2, FileText, Upload, CheckCircle, Crown } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { subjects } from "@/constants"
import { createCompanionWithPDF } from "@/lib/actions/companion.actions"
import { PDFUpload } from "@/components/PDFUpload"

// Subscription plan types and limits
type SubscriptionPlan = 'basic' | 'core' | 'pro_learner';

interface PlanLimits {
  maxDuration: number;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  basic: {
    maxDuration: 15,
    name: 'Basic Plan',
    icon: undefined,
    color: 'text-gray-600'
  },
  core: {
    maxDuration: 30,
    name: 'Core Learner',
    icon: undefined,
    color: 'text-blue-600'
  },
  pro_learner: {
    maxDuration: 45,
    name: 'Pro Learner',
    icon: undefined,
    color: 'text-yellow-600'
  }
};

// Helper function to get user's subscription plan and duration limits from Clerk auth
const getUserPlanAndLimits = (has: any): { plan: SubscriptionPlan; maxDuration: number } => {
  if (has({ plan: 'pro_learner' })) {
    return { plan: 'pro_learner', maxDuration: 45 };
  } else if (has({ plan: 'core' })) {
    return { plan: 'core', maxDuration: 30 };
  } else if (has({ feature: 'extended_sessions' })) {
    // Alternative way to check for extended session feature
    return { plan: 'core', maxDuration: 30 };
  } else {
    return { plan: 'basic', maxDuration: 15 };
  }
};

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
  const { user, isLoaded } = useUser();
  const { has } = useAuth();
  const [loading, setLoading] = useState(false)
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null)
  const [loadingStage, setLoadingStage] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<SubscriptionPlan>('basic');

  // Get user's subscription plan
  useEffect(() => {
    if (isLoaded && user && has) {
      const { plan } = getUserPlanAndLimits(has);
      setUserPlan(plan);
    }
  }, [user, isLoaded, has]);

  // Create dynamic form schema based on user's plan
  const createFormSchema = (maxDuration: number) => {
    return z.object({
      name: z.string().min(1, { message: 'Companion name is required' }),
      subject: z.string().min(1, { message: 'Subject is required' }),
      topic: z.string().min(1, { message: 'Topic is required' }),
      voice: z.string().min(1, { message: 'Voice is required' }),
      style: z.string().min(1, { message: 'Style is required' }),
      duration: z.coerce.number()
        .min(1, { message: 'Duration is required' })
        .max(maxDuration, { message: `Duration cannot exceed ${maxDuration} minutes for your current plan` }),
      language: z.string().min(1, { message: 'Language is required' }),
    });
  };

  const currentPlanLimits = PLAN_LIMITS[userPlan];
  const dynamicFormSchema = createFormSchema(currentPlanLimits.maxDuration);

  const form = useForm<FormData>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: {
      name: '',
      subject: '',
      topic: '',
      voice: '',
      style: '',
      duration: Math.min(15, currentPlanLimits.maxDuration), // Default to 15 or max allowed
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

  // Update form validation when plan changes
  useEffect(() => {
    const currentDuration = form.getValues('duration');
    if (currentDuration > currentPlanLimits.maxDuration) {
      form.setValue('duration', currentPlanLimits.maxDuration);
    }
  }, [userPlan, currentPlanLimits.maxDuration, form]);

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
      
      // Double-check duration limit on submission
      if (values.duration > currentPlanLimits.maxDuration) {
        throw new Error(`Duration cannot exceed ${currentPlanLimits.maxDuration} minutes for your ${currentPlanLimits.name}`);
      }
      
      console.log('🚀 Starting companion creation process...')
      console.log('📝 Form values:', values)
      console.log('👤 User plan:', userPlan)
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
        pdfFile: selectedPDF || undefined,
        userPlan 
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

  // Generate duration options based on user's plan
  const getDurationOptions = () => {
    const options = [];
    for (let i = 5; i <= currentPlanLimits.maxDuration; i += 5) {
      options.push(i);
    }
    // Always include the exact max duration if it's not already in the list
    if (!options.includes(currentPlanLimits.maxDuration)) {
      options.push(currentPlanLimits.maxDuration);
    }
    return options.sort((a, b) => a - b);
  };

  if (!isLoaded) {
    return (
      <div className="max-w-2xl mx-auto p-6 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Create Your AI Companion</h1>
        <p className="text-gray-500 mt-2">Build a personalized tutor for your learning journey</p>
        
        {/* Plan Badge */}
        <div className="mt-4 flex items-center justify-center">
          <Badge variant="outline" className={`${currentPlanLimits.color} border-current`}>
            <span className="mr-2">{currentPlanLimits.icon}</span>
            {currentPlanLimits.name}
          </Badge>
        </div>
      </div>

      {/* Plan Limits Info */}
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <span>
              Your plan allows sessions up to <strong>{currentPlanLimits.maxDuration} minutes</strong>
            </span>
            {userPlan === 'basic' && (
              <Button variant="link" size="sm" className="text-blue-600 p-0 h-auto">
                Upgrade Plan
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

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
                  <FormLabel className="flex items-center gap-2">
                    Session Duration (minutes)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className={`${currentPlanLimits.color}`}>
                            {currentPlanLimits.icon}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{currentPlanLimits.name}: Up to {currentPlanLimits.maxDuration} minutes</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()} 
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {getDurationOptions().map((duration) => (
                          <SelectItem key={duration} value={duration.toString()}>
                            {duration} minutes
                            {duration === currentPlanLimits.maxDuration && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Max
                              </Badge>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
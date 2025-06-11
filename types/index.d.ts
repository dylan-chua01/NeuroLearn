enum Subject {
  maths = "maths",
  language = "language",
  science = "science",
  history = "history",
  coding = "coding",
  geography = "geography",
  economics = "economics",
  finance = "finance",
  business = "business",
}

// Updated Companion type to match your database schema
type Companion = Models.DocumentList<Models.Document> & {
  $id: string;
  name: string;
  subject: Subject;
  topic: string;
  duration: number;
  bookmarked: boolean;
  language: string;
  voice: string;           // Added - you have this in your DB
  style: string;           // Added - you have this in your DB
  author: string;          // Added - you have this in your DB
  created_at: string;      // Added - you have this in your DB
  content_source: string;  // Added - you have this in your DB
  pdf_url?: string;        // Added - for PDF URL
  pdf_name?: string;       // Added - for PDF filename
  pdf_content?: string;    // Added - for PDF text content
  has_pdf: boolean;        // Added - to check if PDF exists
};

interface CreateCompanion {
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
  language: string;
  content_source?: string;  // Added - 'general' or 'pdf'
  pdf_url?: string;         // Added - for PDF uploads
  pdf_name?: string;        // Added - for PDF filename
  pdf_content?: string;     // Added - for extracted PDF text
}

interface GetAllCompanions {
  limit?: number;
  page?: number;
  subject?: string | string[];
  topic?: string | string[];
}

interface BuildClient {
  key?: string;
  sessionToken?: string;
}

interface CreateUser {
  email: string;
  name: string;
  image?: string;
  accountId: string;
}

interface SearchParams {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface Avatar {
  userName: string;
  width: number;
  height: number;
  className?: string;
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

// Updated to include PDF fields
interface CompanionComponentProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  voice: string;
  style: string;
  language: string;
  pdf_content?: string;    // Added
  pdf_name?: string;       // Added
  has_pdf?: boolean;       // Added
}

// Helper type for configureAssistant function
interface CompanionConfigData {
  topic: string;
  subject: string;
  voice: "male" | "female";
  style: "casual" | "formal";
  language: "en" | "zh" | "ms";
  pdf_content?: string;
  pdf_name?: string;
}